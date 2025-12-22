// ============================================================================
// FIXED TERRAFORM GENERATOR - Single Source of Truth for app_name
// ============================================================================

import { CodeGenOptions, GeneratedFile, Project } from "./code-generator-utils";

/**
 * Generate main Terraform configuration - app_name driven
 */
export function generateTerraformMain(project: Project, options: CodeGenOptions): GeneratedFile {
  const content = `# =============================================================================
# ${project.name} - AWS ECS Terraform Configuration (app_name driven)
# =============================================================================

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "${project.name}"
      ProjectId   = "${project.id}"
      Environment = var.environment
      ManagedBy   = "Terraform"
      AppName     = var.app_name
    }
  }
}

# =============================================================================
# CRITICAL: app_name is the SINGLE source of truth for ALL resource naming
# =============================================================================

locals {
  # DO NOT compute names - use app_name directly
  app_name = var.app_name
  
  # Optional: Add suffixes for specific resources
  service_name = "\${var.app_name}-service"
  alb_name     = substr("\${var.app_name}-alb", 0, 32)  # ALB has 32 char limit
  tg_name      = substr("\${var.app_name}-tg", 0, 32)
  log_group    = "/ecs/\${var.app_name}"
}

# =============================================================================
# Data Sources
# =============================================================================

data "aws_availability_zones" "available" {
  state = "available"
  
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# =============================================================================
# VPC Module
# =============================================================================

module "vpc" {
  source = "./modules/vpc"

  app_name             = local.app_name
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  availability_zones   = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# =============================================================================
# Security Groups
# =============================================================================

module "security_groups" {
  source = "./modules/security"

  app_name    = local.app_name
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
}

# =============================================================================
# RDS PostgreSQL Database (Free Tier: db.t3.micro, 20GB)
# =============================================================================

module "rds" {
  source = "./modules/rds"

  app_name               = local.app_name
  environment            = var.environment
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  db_security_group_id   = module.security_groups.db_security_group_id
  db_name                = var.db_name
  db_username            = var.db_username
  db_password            = var.db_password
  db_instance_class      = var.db_instance_class
  db_allocated_storage   = var.db_allocated_storage
}

# =============================================================================
# ECR Repository - MUST match app_name exactly
# =============================================================================

module "ecr" {
  source = "./modules/ecr"

  app_name    = local.app_name
  environment = var.environment
}

# =============================================================================
# ECS Cluster (Free Tier: Fargate with minimal resources)
# =============================================================================

module "ecs" {
  source = "./modules/ecs"

  app_name                 = local.app_name
  service_name             = local.service_name
  alb_name                 = local.alb_name
  tg_name                  = local.tg_name
  environment              = var.environment
  vpc_id                   = module.vpc.vpc_id
  public_subnet_ids        = module.vpc.public_subnet_ids
  private_subnet_ids       = module.vpc.private_subnet_ids
  ecs_security_group_id    = module.security_groups.ecs_security_group_id
  alb_security_group_id    = module.security_groups.alb_security_group_id
  ecr_repository_url       = module.ecr.repository_url
  
  # Database configuration
  db_host                  = module.rds.db_endpoint
  db_port                  = module.rds.db_port
  db_name                  = var.db_name
  db_username              = var.db_username
  db_password              = var.db_password
  
  # Application configuration (Free Tier optimized)
  app_port                 = var.app_port
  app_cpu                  = var.app_cpu
  app_memory               = var.app_memory
  desired_count            = var.desired_count
  
  ${options.includeAuth ? `# Authentication
  jwt_secret               = var.jwt_secret
  ` : ''}
  # Health check
  health_check_path        = var.health_check_path
}

# =============================================================================
# CloudWatch Log Groups (Free Tier: 5GB ingestion, 1 month retention)
# =============================================================================

resource "aws_cloudwatch_log_group" "app" {
  name              = local.log_group
  retention_in_days = 1

  tags = {
    Name    = "\${local.app_name}-logs"
    AppName = local.app_name
  }
}`;

  return {
    path: 'terraform/main.tf',
    content,
    description: 'Main Terraform configuration using app_name as single source of truth'
  };
}

/**
 * Generate Terraform variables - app_name is REQUIRED input
 */
export function generateTerraformVariables(project: Project, options: CodeGenOptions): GeneratedFile {
  const dbName = project.name.toLowerCase().replace(/\s+/g, '_');

  const content = `# =============================================================================
# ${project.name} - Terraform Variables (app_name driven)
# =============================================================================

# =============================================================================
# CRITICAL: app_name is provided by deploy service - DO NOT set default
# =============================================================================

variable "app_name" {
  description = "Immutable application identifier (generated by deploy service)"
  type        = string
  
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*[a-z0-9]$", var.app_name))
    error_message = "app_name must be lowercase alphanumeric with hyphens, start/end with alphanumeric"
  }
  
  validation {
    condition     = length(var.app_name) <= 50
    error_message = "app_name must be 50 characters or less for AWS resource limits"
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# =============================================================================
# VPC Configuration (Free Tier Compatible)
# =============================================================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (2 AZs for HA)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (2 AZs for RDS)"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

# =============================================================================
# Database Configuration (FREE TIER: db.t3.micro + 20GB)
# =============================================================================

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "${dbName}"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password (min 8 characters)"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.db_password) >= 8
    error_message = "Database password must be at least 8 characters"
  }
}

variable "db_instance_class" {
  description = "RDS instance class (FREE TIER: db.t3.micro only)"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB (FREE TIER: max 20GB)"
  type        = number
  default     = 20
}

# =============================================================================
# Application Configuration (FREE TIER: 256 CPU + 512 MB)
# =============================================================================

variable "app_port" {
  description = "Application port"
  type        = number
  default     = 3000
}

variable "app_cpu" {
  description = "Fargate CPU units (FREE TIER: 256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "app_memory" {
  description = "Fargate memory in MB (FREE TIER: 512-2048 MB)"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired number of tasks (FREE TIER: 1 recommended)"
  type        = number
  default     = 1
}

variable "health_check_path" {
  description = "Health check endpoint path"
  type        = string
  default     = "/health"
}

${options.includeAuth ? `# =============================================================================
# Authentication Configuration
# =============================================================================

variable "jwt_secret" {
  description = "JWT secret for authentication (min 32 characters)"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.jwt_secret) >= 32
    error_message = "JWT secret must be at least 32 characters for security"
  }
}
` : ''}`;

  return {
    path: 'terraform/variables.tf',
    content,
    description: 'Terraform variables with app_name as required input'
  };
}

/**
 * Generate Terraform outputs
 */
export function generateTerraformOutputs(project: Project): GeneratedFile {
  const content = `# =============================================================================
# ${project.name} - Terraform Outputs
# =============================================================================

output "app_name" {
  description = "Application name used for all resources"
  value       = var.app_name
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = module.ecr.repository_url
}

output "ecr_repository_name" {
  description = "ECR repository name (must match app_name)"
  value       = var.app_name
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.ecs.alb_dns_name
}

output "alb_url" {
  description = "Application Load Balancer URL"
  value       = "http://\${module.ecs.alb_dns_name}"
}

output "db_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}

output "container_image" {
  description = "Full container image path used in ECS"
  value       = "\${module.ecr.repository_url}:latest"
}

output "resource_summary" {
  description = "Summary of all created resources"
  value = {
    app_name         = var.app_name
    ecr_repo         = var.app_name
    ecs_cluster      = "\${var.app_name}-cluster"
    ecs_service      = "\${var.app_name}-service"
    task_family      = var.app_name
    container_name   = var.app_name
    alb              = "\${substr(var.app_name, 0, 28)}-alb"
    log_group        = "/ecs/\${var.app_name}"
    image_path       = "\${module.ecr.repository_url}:latest"
  }
}`;

  return {
    path: 'terraform/outputs.tf',
    content,
    description: 'Terraform outputs showing app_name usage'
  };
}

/**
 * UPDATED: ECR module - uses app_name directly
 */
export function generateTerraformECRModule(): GeneratedFile {
  const content = `# =============================================================================
# ECR Repository Module - MUST match app_name exactly
# =============================================================================

resource "aws_ecr_repository" "ecr_repo" {
  name                 = var.app_name  # CRITICAL: Must match Docker image name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name     = "\${var.app_name}-ecr"
    AppName  = var.app_name
    FreeTier = "true"
  }
}

resource "aws_ecr_lifecycle_policy" "ecr_lifecycle" {
  repository = aws_ecr_repository.ecr_repo.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 3 images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 3
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# =============================================================================
# Module Variables
# =============================================================================

variable "app_name" {
  type        = string
  description = "Application name - MUST match Docker image name"
}

variable "environment" {
  type = string
}

# =============================================================================
# Module Outputs
# =============================================================================

output "repository_url" {
  value       = aws_ecr_repository.ecr_repo.repository_url
  description = "Full ECR repository URL including registry"
}

output "repository_arn" {
  value = aws_ecr_repository.ecr_repo.arn
}

output "repository_name" {
  value       = aws_ecr_repository.ecr_repo.name
  description = "ECR repository name (equals app_name)"
}`;

  return {
    path: 'terraform/modules/ecr/main.tf',
    content,
    description: 'ECR module using app_name directly'
  };
}

/**
 * UPDATED: ECS module - uses app_name for container and image
 */
export function generateTerraformECSModule(project: Project, options: CodeGenOptions): GeneratedFile {
  const content = `# =============================================================================
# ECS Module - app_name driven naming
# =============================================================================

resource "aws_ecs_cluster" "ecs_cluster_main" {
  name = "\${var.app_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "disabled"
  }

  tags = {
    Name     = "\${var.app_name}-cluster"
    AppName  = var.app_name
    FreeTier = "true"
  }
}

# =============================================================================
# IAM Roles
# =============================================================================

resource "aws_iam_role" "iam_ecs_task_execution" {
  name = substr("\${var.app_name}-ecs-exec", 0, 64)

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name    = "\${var.app_name}-ecs-exec"
    AppName = var.app_name
  }
}

resource "aws_iam_role_policy_attachment" "iam_ecs_task_execution_attach" {
  role       = aws_iam_role.iam_ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "iam_ecs_task" {
  name = substr("\${var.app_name}-ecs-task", 0, 64)

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name    = "\${var.app_name}-ecs-task"
    AppName = var.app_name
  }
}

# =============================================================================
# Application Load Balancer
# =============================================================================

resource "aws_lb" "alb_main" {
  name               = var.alb_name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false
  enable_http2               = true
  idle_timeout               = 60

  tags = {
    Name    = var.alb_name
    AppName = var.app_name
  }
}

resource "aws_lb_target_group" "alb_target_group" {
  name        = var.tg_name
  port        = var.app_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = var.health_check_path
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name    = var.tg_name
    AppName = var.app_name
  }
}

resource "aws_lb_listener" "alb_listener" {
  load_balancer_arn = aws_lb.alb_main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.alb_target_group.arn
  }
}

# =============================================================================
# ECS Task Definition - CRITICAL: image path must match pushed image
# =============================================================================

resource "aws_ecs_task_definition" "ecs_task_def" {
  family                   = var.app_name  # CRITICAL: Task family = app_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.app_cpu
  memory                   = var.app_memory
  execution_role_arn       = aws_iam_role.iam_ecs_task_execution.arn
  task_role_arn            = aws_iam_role.iam_ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = var.app_name  # CRITICAL: Container name = app_name
      image     = "\${var.ecr_repository_url}:latest"  # CRITICAL: Must match pushed image
      essential = true

      portMappings = [
        {
          containerPort = var.app_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = tostring(var.app_port)
        },
        {
          name  = "DB_HOST"
          value = split(":", var.db_host)[0]
        },
        {
          name  = "DB_PORT"
          value = tostring(var.db_port)
        },
        {
          name  = "DB_NAME"
          value = var.db_name
        },
        {
          name  = "DB_USER"
          value = var.db_username
        },
        {
          name  = "DB_PASSWORD"
          value = var.db_password
        },
        {
          name  = "DATABASE_URL"
          value = "postgresql://\${var.db_username}:\${var.db_password}@\${split(":", var.db_host)[0]}:\${var.db_port}/\${var.db_name}"
        }${options.includeAuth ? `,
        {
          name  = "JWT_SECRET"
          value = var.jwt_secret
        }` : ''}
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/\${var.app_name}"
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:\${var.app_port}\${var.health_check_path} || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name     = "\${var.app_name}-task"
    AppName  = var.app_name
    FreeTier = "true"
  }
}

# =============================================================================
# ECS Service
# =============================================================================

resource "aws_ecs_service" "ecs_service_main" {
  name            = var.service_name
  cluster         = aws_ecs_cluster.ecs_cluster_main.id
  task_definition = aws_ecs_task_definition.ecs_task_def.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [var.ecs_security_group_id]
    subnets          = var.private_subnet_ids
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.alb_target_group.arn
    container_name   = var.app_name  # CRITICAL: Must match container name in task def
    container_port   = var.app_port
  }

  deployment_controller {
    type = "ECS"
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  health_check_grace_period_seconds = 60

  depends_on = [
    aws_lb_listener.alb_listener,
    aws_iam_role_policy_attachment.iam_ecs_task_execution_attach
  ]

  tags = {
    Name     = var.service_name
    AppName  = var.app_name
    FreeTier = "true"
  }
}

# =============================================================================
# Data Sources
# =============================================================================

data "aws_region" "current" {}

# =============================================================================
# Module Variables
# =============================================================================

variable "app_name" {
  type        = string
  description = "Application name - used for task family and container name"
}

variable "service_name" {
  type        = string
  description = "ECS service name"
}

variable "alb_name" {
  type        = string
  description = "Application Load Balancer name"
}

variable "tg_name" {
  type        = string
  description = "Target Group name"
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "ecs_security_group_id" {
  type = string
}

variable "alb_security_group_id" {
  type = string
}

variable "ecr_repository_url" {
  type        = string
  description = "Full ECR repository URL - image MUST exist before terraform apply"
}

variable "db_host" {
  type = string
}

variable "db_port" {
  type = number
}

variable "db_name" {
  type = string
}

variable "db_username" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "app_port" {
  type = number
}

variable "app_cpu" {
  type = number
}

variable "app_memory" {
  type = number
}

variable "desired_count" {
  type = number
}

variable "health_check_path" {
  type = string
}

${options.includeAuth ? `variable "jwt_secret" {
  type      = string
  sensitive = true
}
` : ''}
# =============================================================================
# Module Outputs
# =============================================================================

output "cluster_name" {
  value = aws_ecs_cluster.ecs_cluster_main.name
}

output "service_name" {
  value = aws_ecs_service.ecs_service_main.name
}

output "alb_dns_name" {
  value = aws_lb.alb_main.dns_name
}

output "task_definition_arn" {
  value = aws_ecs_task_definition.ecs_task_def.arn
}`;

  return {
    path: 'terraform/modules/ecs/main.tf',
    content,
    description: 'ECS module with app_name driven naming and image path'
  };
}

// Update VPC and Security modules to use app_name instead of project_name
export function generateTerraformVPCModule(): GeneratedFile {
  const content = `# =============================================================================
# VPC Module - app_name driven
# =============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name    = "\${var.app_name}-vpc"
    AppName = var.app_name
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name    = "\${var.app_name}-igw"
    AppName = var.app_name
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name    = "\${var.app_name}-public-\${count.index + 1}"
    AppName = var.app_name
    Type    = "Public"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name    = "\${var.app_name}-private-\${count.index + 1}"
    AppName = var.app_name
    Type    = "Private"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name    = "\${var.app_name}-public-rt"
    AppName = var.app_name
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name    = "\${var.app_name}-private-rt"
    AppName = var.app_name
  }
}

resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# =============================================================================
# Variables
# =============================================================================

variable "app_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

variable "availability_zones" {
  type = list(string)
}

variable "public_subnet_cidrs" {
  type = list(string)
}

variable "private_subnet_cidrs" {
  type = list(string)
}

# =============================================================================
# Outputs
# =============================================================================

output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  value = aws_internet_gateway.main.id
}`;

  return {
    path: 'terraform/modules/vpc/main.tf',
    content,
    description: 'VPC module using app_name'
  };
}

export function generateTerraformSecurityModule(): GeneratedFile {
  const content = `# =============================================================================
# Security Groups Module - app_name driven
# =============================================================================

resource "aws_security_group" "alb" {
  name        = "\${var.app_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "\${var.app_name}-alb-sg"
    AppName = var.app_name
  }
}

resource "aws_security_group" "ecs_tasks" {
  name        = "\${var.app_name}-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow traffic from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "\${var.app_name}-ecs-tasks-sg"
    AppName = var.app_name
  }
}

resource "aws_security_group" "rds" {
  name        = "\${var.app_name}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "\${var.app_name}-rds-sg"
    AppName = var.app_name
  }
}

# =============================================================================
# Variables
# =============================================================================

variable "app_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

# =============================================================================
# Outputs
# =============================================================================

output "alb_security_group_id" {
  value = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  value = aws_security_group.ecs_tasks.id
}

output "db_security_group_id" {
  value = aws_security_group.rds.id
}`;

  return {
    path: 'terraform/modules/security/main.tf',
    content,
    description: 'Security groups module using app_name'
  };
}

export function generateTerraformRDSModule(): GeneratedFile {
  const content = `# =============================================================================
# RDS Module - app_name driven
# =============================================================================

resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "\${var.app_name}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name    = "\${var.app_name}-db-subnet-group"
    AppName = var.app_name
  }
}

resource "aws_db_instance" "rds_postgres" {
  identifier            = "\${var.app_name}-db"
  engine                = "postgres"
  engine_version        = "15"
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = false
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [var.db_security_group_id]
  
  backup_retention_period = 1
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"
  
  skip_final_snapshot       = true
  final_snapshot_identifier = null
  
  enabled_cloudwatch_logs_exports = []
  monitoring_interval             = 0
  
  auto_minor_version_upgrade = true
  deletion_protection        = false
  multi_az                   = false
  performance_insights_enabled = false
  publicly_accessible        = false

  tags = {
    Name     = "\${var.app_name}-db"
    AppName  = var.app_name
    FreeTier = "true"
  }
}

# =============================================================================
# Variables
# =============================================================================

variable "app_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "db_security_group_id" {
  type = string
}

variable "db_name" {
  type = string
}

variable "db_username" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "db_instance_class" {
  type = string
}

variable "db_allocated_storage" {
  type = number
}

# =============================================================================
# Outputs
# =============================================================================

output "db_endpoint" {
  value = aws_db_instance.rds_postgres.endpoint
}

output "db_address" {
  value = aws_db_instance.rds_postgres.address
}

output "db_port" {
  value = aws_db_instance.rds_postgres.port
}

output "db_name" {
  value = aws_db_instance.rds_postgres.db_name
}

output "db_identifier" {
  value = aws_db_instance.rds_postgres.identifier
}`;

  return {
    path: 'terraform/modules/rds/main.tf',
    content,
    description: 'RDS module using app_name'
  };
}


export function generateTerraformTfvarsExample(
  project: Project,
  options: CodeGenOptions
): GeneratedFile {
  const dbName = project.name.toLowerCase().replace(/\s+/g, '_');

  const content = `# =============================================================================
# ${project.name} - Terraform Variables
# =============================================================================
# IMPORTANT: Do NOT edit this file manually when using deploy service
# The deploy service will pass app_name automatically via -var flag
#
# This file is only needed if you're running Terraform manually (not recommended)
# =============================================================================

# =============================================================================
# CRITICAL: app_name is automatically generated and passed by deploy service
# =============================================================================
# DO NOT SET app_name HERE - it will be passed via: terraform apply -var="app_name=..."
# If running manually, you must provide: -var="app_name=your-app-name-here"
#
# Example:
#   terraform apply -var="app_name=task-manager-dev-abc12345"
#
# app_name format: lowercase alphanumeric with hyphens, max 50 chars
# Example: "my-project-dev-abc12345"

# =============================================================================
# AWS Configuration
# =============================================================================

aws_region = "us-east-1"
environment = "dev"

# =============================================================================
# Database Configuration (FREE TIER)
# =============================================================================

db_name = "${dbName}"
db_username = "postgres"
db_password = "CHANGE_THIS_PASSWORD_NOW"  # Min 8 characters, REQUIRED!

# FREE TIER LIMITS:
db_instance_class = "db.t3.micro"     # ✓ Free Tier eligible
db_allocated_storage = 20              # ✓ Max 20GB for Free Tier

# =============================================================================
# Application Configuration (FREE TIER)
# =============================================================================

app_port = 3000
app_cpu = 256       # ✓ 0.25 vCPU (Free Tier eligible)
app_memory = 512    # ✓ 512 MB RAM
desired_count = 1   # ✓ 1 task recommended for Free Tier

${options.includeAuth ? `# =============================================================================
# Authentication
# =============================================================================

jwt_secret = "CHANGE_THIS_JWT_SECRET_32_CHARS_MINIMUM"  # Min 32 characters, REQUIRED!
` : ''}
# =============================================================================
# Health Check
# =============================================================================

health_check_path = "/health"

# =============================================================================
# Cost Control
# =============================================================================

enable_deletion_protection = false  # Keep false for easy cleanup

# =============================================================================
# 💰 ESTIMATED MONTHLY COSTS (Free Tier):
# =============================================================================
# - RDS db.t3.micro (750 hours/month free): $0
# - Fargate (512 MB RAM, 1 task): ~$5-10/month
# - ALB (750 hours/month free first year): $0 first year, then ~$16/month
# - ECR (500MB free): $0
# - CloudWatch Logs (5GB free): $0
# - Data Transfer (1GB free): $0
#
# TOTAL FIRST YEAR: ~$5-10/month
# TOTAL AFTER YEAR 1: ~$20-30/month
#
# 🔥 FREE TIER LIMITS (12 months):
# - 750 hours/month RDS db.t3.micro
# - 750 hours/month ALB
# - Always Free: 25 GB RDS storage, 20 GB backup storage
# =============================================================================

# =============================================================================
# ⚠️  IMPORTANT NOTES:
# =============================================================================
# 1. app_name is NOT in this file - it's generated by deploy service
# 2. If deploying manually, you MUST pass: -var="app_name=your-name"
# 3. app_name must match the Docker image name pushed to ECR
# 4. See README.md for proper deployment workflow
# =============================================================================`;

  return {
    path: 'terraform/terraform.tfvars',
    content,
    description: 'Example Terraform variables (app_name passed by deploy service)'
  };
}

/**
 * Generate deployment script - DEPRECATED, use deploy service API instead
 */
export function generateDeploymentScript(project: Project, options: CodeGenOptions): GeneratedFile {
  const content = `#!/bin/bash
# =============================================================================
# ${project.name} - Deployment Script
# =============================================================================
# ⚠️  WARNING: This script is DEPRECATED
# 
# This project uses an app_name-driven deployment architecture where:
# 1. app_name is generated by the deploy service (not this script)
# 2. Docker images are built with the generated app_name
# 3. Terraform receives app_name as a variable
#
# RECOMMENDED: Use the deploy service API instead:
#   POST http://localhost:3001/api/deploy
#   Then connect to WebSocket for real-time updates
#
# This script is provided for reference only and may not work correctly.
# =============================================================================

set -e
set -o pipefail

RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0;0m'

echo -e "\${RED}╔════════════════════════════════════════════════════════╗\${NC}"
echo -e "\${RED}║  ⚠️  WARNING: Manual Deployment Not Recommended       ║\${NC}"
echo -e "\${RED}╚════════════════════════════════════════════════════════╝\${NC}"
echo ""
echo -e "\${YELLOW}This script cannot generate app_name correctly.\${NC}"
echo -e "\${YELLOW}Use the deploy service API for proper deployment:\${NC}"
echo ""
echo -e "\${BLUE}1. Start deploy service:\${NC}"
echo "   cd deploy-service && npm start"
echo ""
echo -e "\${BLUE}2. Initiate deployment:\${NC}"
echo "   curl -X POST http://localhost:3001/api/deploy \\\\"
echo "     -H 'Content-Type: application/json' \\\\"
echo "     -d '{"
echo "       \"userId\": \"your-user-id\","
echo "       \"projectId\": \"your-project-id\","
echo "       \"accessKeyId\": \"YOUR_AWS_KEY\","
echo "       \"secretAccessKey\": \"YOUR_AWS_SECRET\","
echo "       \"region\": \"us-east-1\""
echo "     }'"
echo ""
echo -e "\${BLUE}3. Connect to WebSocket for real-time updates:\${NC}"
echo "   Use deployment ID from step 2"
echo ""
echo -e "\${YELLOW}═══════════════════════════════════════════════════════\${NC}"
echo ""
read -p "Continue with manual deployment anyway? (yes/no): " CONFIRM

if [ "\$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled. Please use the deploy service API."
    exit 1
fi

echo ""
echo -e "\${YELLOW}⚠️  Proceeding with manual deployment...\${NC}"
echo ""

# =============================================================================
# Manual Deployment (NOT RECOMMENDED)
# =============================================================================

# You MUST provide app_name manually
if [ -z "\$APP_NAME" ]; then
    echo -e "\${RED}ERROR: APP_NAME environment variable not set\${NC}"
    echo ""
    echo "Set APP_NAME to match your Docker image name:"
    echo "  export APP_NAME=\"my-project-dev-abc12345\""
    echo ""
    echo "Format: lowercase alphanumeric with hyphens, max 50 chars"
    echo "MUST match the image you pushed to ECR"
    exit 1
fi

AWS_REGION="\${AWS_REGION:-us-east-1}"

echo -e "\${GREEN}════════════════════════════════════\${NC}"
echo -e "\${GREEN}Manual Deployment Configuration\${NC}"
echo -e "\${GREEN}════════════════════════════════════\${NC}"
echo ""
echo "APP_NAME: \$APP_NAME"
echo "AWS_REGION: \$AWS_REGION"
echo ""

# =============================================================================
# 1. Prerequisites
# =============================================================================
echo -e "\${YELLOW}📋 Step 1: Checking prerequisites...\${NC}"

command -v terraform &>/dev/null || { echo "Terraform not installed"; exit 1; }
command -v aws &>/dev/null || { echo "AWS CLI not installed"; exit 1; }
command -v docker &>/dev/null || { echo "Docker not installed"; exit 1; }
docker info &>/dev/null || { echo "Docker daemon not running"; exit 1; }

echo -e "\${GREEN}✅ All tools installed\${NC}"

aws sts get-caller-identity &>/dev/null || { echo "AWS not configured"; exit 1; }

AWS_ACCOUNT_ID=\$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="\${AWS_ACCOUNT_ID}.dkr.ecr.\${AWS_REGION}.amazonaws.com"

echo -e "\${GREEN}✅ AWS authenticated\${NC}"
echo "Account ID: \${AWS_ACCOUNT_ID}"
echo ""

# =============================================================================
# 2. Check if image exists in ECR
# =============================================================================
echo -e "\${YELLOW}🔍 Step 2: Validating Docker image in ECR...\${NC}"

if ! aws ecr describe-images \\
    --repository-name "\$APP_NAME" \\
    --image-ids imageTag=latest \\
    --region \$AWS_REGION &>/dev/null; then
    
    echo -e "\${RED}ERROR: Image \${ECR_REGISTRY}/\${APP_NAME}:latest not found in ECR\${NC}"
    echo ""
    echo "You must build and push the image first:"
    echo "  1. aws ecr get-login-password --region \$AWS_REGION | \\\\"
    echo "       docker login --username AWS --password-stdin \$ECR_REGISTRY"
    echo "  2. docker build -t \$APP_NAME:latest ."
    echo "  3. docker tag \$APP_NAME:latest \${ECR_REGISTRY}/\${APP_NAME}:latest"
    echo "  4. docker push \${ECR_REGISTRY}/\${APP_NAME}:latest"
    echo ""
    exit 1
fi

echo -e "\${GREEN}✅ Image found in ECR: \${APP_NAME}:latest\${NC}"
echo ""

# =============================================================================
# 3. Terraform Deployment
# =============================================================================
echo -e "\${YELLOW}🏗️  Step 3: Deploying infrastructure...\${NC}"

cd terraform || { echo "terraform/ directory not found"; exit 1; }

if [ ! -f "terraform.tfvars" ]; then
    echo -e "\${RED}ERROR: terraform.tfvars not found\${NC}"
    echo "Copy terraform.tfvars.example and set your passwords"
    exit 1
fi

# Check for required passwords
if grep -q "CHANGE_THIS" terraform.tfvars; then
    echo -e "\${RED}ERROR: Please set passwords in terraform.tfvars\${NC}"
    exit 1
fi

echo "Initializing Terraform..."
terraform init -reconfigure || exit 1

echo "Planning deployment with app_name: \$APP_NAME"
terraform plan -var="app_name=\$APP_NAME" || exit 1

echo ""
echo -e "\${YELLOW}Review the plan above. Ready to apply?\${NC}"
read -p "Continue? (yes/no): " APPLY_CONFIRM

if [ "\$APPLY_CONFIRM" != "yes" ]; then
    echo "Deployment cancelled"
    exit 1
fi

echo "Applying with app_name: \$APP_NAME"
terraform apply -auto-approve -var="app_name=\$APP_NAME" || exit 1

echo -e "\${GREEN}✅ Infrastructure deployed\${NC}"
echo ""

# =============================================================================
# 4. Get outputs
# =============================================================================
ALB_DNS=\$(terraform output -raw alb_dns_name 2>/dev/null || echo "")

echo -e "\${GREEN}════════════════════════════════════\${NC}"
echo -e "\${GREEN}✅ Deployment Complete\${NC}"
echo -e "\${GREEN}════════════════════════════════════\${NC}"
echo ""
echo "APP_NAME: \$APP_NAME"
echo "URL: http://\${ALB_DNS}"
echo ""
echo "View logs:"
echo "  aws logs tail /ecs/\${APP_NAME} --follow"
echo ""
echo "Destroy:"
echo "  cd terraform && terraform destroy -var=\\"app_name=\$APP_NAME\\""
echo ""`;

  return {
    path: 'deploy.sh',
    content,
    description: 'Deprecated deployment script (use deploy service API instead)'
  };
}

/**
 * Generate Terraform README - UPDATED for app_name architecture
 */
export function generateTerraformReadme(
  project: Project,
  options: CodeGenOptions
): GeneratedFile {
  const content = `# ${project.name} - Terraform Infrastructure

This directory contains Terraform configurations for deploying ${project.name} to AWS ECS (Fargate).

## 🎯 Architecture: app_name Driven

**IMPORTANT**: This project uses an **app_name-driven architecture** where:

1. **app_name** is generated by the deploy service (not by Terraform)
2. Docker images are built and tagged with app_name
3. Images are validated in ECR before Terraform runs
4. Terraform receives app_name as an input variable
5. All resources are named using app_name

### Why app_name?

The deploy service generates a unique, immutable identifier for your application:

\`\`\`
generateAppName("Task Manager", "abc12345-...")
  → "task-manager-dev-abc12345"
\`\`\`

This ensures perfect consistency between:
- ECR repository name
- Docker image name
- ECS task definition family
- ECS container name
- All other AWS resources

## 📋 Infrastructure Components

- **VPC**: Custom VPC with public and private subnets across 2 AZs
- **RDS**: PostgreSQL database in private subnets
- **ECR**: Docker container registry (named with app_name)
- **ECS**: Fargate cluster (tasks use app_name)
- **ALB**: Application Load Balancer for traffic distribution
- **Security Groups**: Properly configured network security

## 🚀 Deployment (RECOMMENDED: Use Deploy Service API)

### Method 1: Deploy Service API (Recommended)

The deploy service handles everything automatically:

\`\`\`bash
# 1. Start deploy service
cd deploy-service
npm install
npm start

# 2. Initiate deployment via API
curl -X POST http://localhost:3001/api/deploy \\
  -H 'Content-Type: application/json' \\
  -d '{
    "userId": "your-user-id",
    "projectId": "your-project-id",
    "accessKeyId": "YOUR_AWS_ACCESS_KEY",
    "secretAccessKey": "YOUR_AWS_SECRET_KEY",
    "region": "us-east-1"
  }'

# 3. Connect to WebSocket for real-time updates
# Use deploymentId from response above
\`\`\`

The deploy service will:
1. ✅ Generate app_name automatically
2. ✅ Build Docker image with app_name
3. ✅ Push to ECR with app_name
4. ✅ Validate image exists in ECR
5. ✅ Run Terraform with \`-var="app_name=..."\`
6. ✅ Stream logs via WebSocket

### Method 2: Manual Deployment (Not Recommended)

If you must deploy manually, you need to:

1. **Generate app_name** (cannot be done manually - use deploy service)
2. **Build and push Docker image**:
   \`\`\`bash
   # Set app_name (must match exactly what deploy service would generate)
   export APP_NAME="task-manager-dev-abc12345"
   export AWS_REGION="us-east-1"
   export AWS_ACCOUNT_ID=\$(aws sts get-caller-identity --query Account --output text)
   export ECR_REGISTRY="\${AWS_ACCOUNT_ID}.dkr.ecr.\${AWS_REGION}.amazonaws.com"
   
   # Login to ECR
   aws ecr get-login-password --region \$AWS_REGION | \\
     docker login --username AWS --password-stdin \$ECR_REGISTRY
   
   # Create ECR repository
   aws ecr create-repository --repository-name \$APP_NAME --region \$AWS_REGION
   
   # Build and push
   docker build -t \$APP_NAME:latest .
   docker tag \$APP_NAME:latest \${ECR_REGISTRY}/\${APP_NAME}:latest
   docker push \${ECR_REGISTRY}/\${APP_NAME}:latest
   \`\`\`

3. **Validate image exists**:
   \`\`\`bash
   aws ecr describe-images \\
     --repository-name \$APP_NAME \\
     --image-ids imageTag=latest \\
     --region \$AWS_REGION
   \`\`\`

4. **Deploy with Terraform**:
   \`\`\`bash
   cd terraform
   # Edit terraform.tfvars with your passwords
   
   terraform init
   terraform plan -var="app_name=\$APP_NAME"
   terraform apply -var="app_name=\$APP_NAME"
   \`\`\`

**⚠️ WARNING**: Manual deployment is error-prone. The deploy service is designed to prevent common mistakes like:
- Name mismatches between Docker and Terraform
- Deploying before image is pushed
- Using incorrect app_name format

## 📁 File Structure

\`\`\`
terraform/
├── main.tf                    # Main configuration (uses var.app_name)
├── variables.tf               # Variable definitions (app_name required)
├── outputs.tf                 # Output values
├── terraform.tfvars   # Example variables (app_name NOT here)
└── modules/
    ├── vpc/                   # VPC networking (uses var.app_name)
    ├── security/              # Security groups (uses var.app_name)
    ├── rds/                   # PostgreSQL database (uses var.app_name)
    ├── ecr/                   # Container registry (name = var.app_name)
    └── ecs/                   # ECS cluster & service (uses var.app_name)
\`\`\`

## 🔧 Important Variables

| Variable | Description | Source | Default |
|----------|-------------|--------|---------|
| \`app_name\` | **CRITICAL**: Unique app identifier | Deploy service | **NONE** (must provide) |
| \`aws_region\` | AWS region | terraform.tfvars | us-east-1 |
| \`environment\` | Environment name | terraform.tfvars | dev |
| \`db_password\` | Database password | terraform.tfvars | **REQUIRED** |
${options.includeAuth ? '| `jwt_secret` | JWT signing secret | terraform.tfvars | **REQUIRED** |\n' : ''}| \`app_cpu\` | Fargate CPU units | terraform.tfvars | 256 |
| \`app_memory\` | Fargate memory (MB) | terraform.tfvars | 512 |
| \`desired_count\` | Number of tasks | terraform.tfvars | 1 |

### app_name Requirements

The app_name must:
- ✅ Be lowercase
- ✅ Use only alphanumeric and hyphens
- ✅ Start and end with alphanumeric
- ✅ Be 50 characters or less
- ✅ Match the Docker image name in ECR
- ✅ Be generated by deploy service (not manually)

**Example**: \`task-manager-dev-abc12345\`

## 📊 Outputs

After deployment, Terraform provides:

\`\`\`bash
# Get app_name used
terraform output app_name

# Get application URL
terraform output alb_url

# Get ECR repository
terraform output ecr_repository_url

# Get container image path
terraform output container_image

# Get resource summary
terraform output resource_summary
\`\`\`

## 🔒 Security Considerations

1. **Never commit** \`terraform.tfvars\` or \`.env\` files
2. Use strong passwords for \`db_password\`${options.includeAuth ? ' and `jwt_secret`' : ''}
3. Review security group rules before applying
4. Enable deletion protection for production RDS instances
5. Use AWS Secrets Manager for production secrets
6. Never hardcode \`app_name\` - let deploy service generate it

## 💰 Cost Estimation

Approximate monthly costs (us-east-1):

- **ECS Fargate** (1 task, 0.25 vCPU, 0.5 GB): ~$5-10
- **RDS db.t3.micro**: ~$15-20
- **ALB**: ~$16-20
- **Data Transfer**: Variable
- **ECR Storage**: Minimal

**Total**: ~$40-60/month for dev environment

**Free Tier Eligible** (first 12 months):
- 750 hours/month RDS db.t3.micro
- 750 hours/month ALB
- Always free: 25 GB RDS storage

## 🔄 Updating Infrastructure

### Update Application Code Only

\`\`\`bash
# Use deploy service to rebuild and redeploy
# It will handle Docker build/push and ECS update
curl -X POST http://localhost:3001/api/deploy ...
\`\`\`

### Update Infrastructure (Terraform)

\`\`\`bash
# Modify .tf files, then:
terraform plan -var="app_name=\$APP_NAME"
terraform apply -var="app_name=\$APP_NAME"
\`\`\`

## 🗑️ Cleanup

### Using Deploy Service (Recommended)

\`\`\`bash
curl -X POST http://localhost:3001/api/destroy \\
  -H 'Content-Type: application/json' \\
  -d '{
    "userId": "your-user-id",
    "projectId": "your-project-id",
    "accessKeyId": "YOUR_AWS_ACCESS_KEY",
    "secretAccessKey": "YOUR_AWS_SECRET_KEY",
    "region": "us-east-1"
  }'
\`\`\`

### Manual Cleanup

\`\`\`bash
cd terraform
terraform destroy -var="app_name=\$APP_NAME"
\`\`\`

⚠️ **Warning**: This will delete all resources including the database!

## 🐛 Troubleshooting

### Issue: "app_name variable not set"

**Cause**: Terraform doesn't know the app_name

**Solution**: 
- Use deploy service API (recommended)
- OR manually pass: \`terraform apply -var="app_name=your-app-name"\`

### Issue: "Image not found" during ECS deployment

**Cause**: Docker image doesn't exist in ECR with the expected name

**Solution**:
1. Verify ECR repository exists:
   \`\`\`bash
   aws ecr describe-repositories --repository-names \$APP_NAME
   \`\`\`

2. Verify image exists:
   \`\`\`bash
   aws ecr describe-images \\
     --repository-name \$APP_NAME \\
     --image-ids imageTag=latest
   \`\`\`

3. If missing, build and push with correct app_name:
   \`\`\`bash
   docker build -t \$APP_NAME:latest .
   docker tag \$APP_NAME:latest \${ECR_REGISTRY}/\${APP_NAME}:latest
   docker push \${ECR_REGISTRY}/\${APP_NAME}:latest
   \`\`\`

### Issue: Name mismatch between Docker and ECS

**Cause**: Docker image was pushed with different name than Terraform expects

**Solution**: This is why we recommend using the deploy service! It guarantees consistency.

**Manual fix**:
1. Delete wrong ECR repository
2. Use same app_name for Docker build and Terraform
3. Push image with correct name
4. Redeploy with Terraform

### Issue: ECS service won't stabilize

\`\`\`bash
# Check service events
aws ecs describe-services \\
  --cluster \${APP_NAME}-cluster \\
  --services \${APP_NAME}-service

# Check task logs
aws logs tail /ecs/\${APP_NAME} --follow
\`\`\`

### Issue: Database connection fails

- Check security group rules allow ECS → RDS
- Verify RDS is in "available" state
- Confirm environment variables in ECS task definition

## 📚 Resources

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [Deploy Service API Documentation](../deploy-service/README.md)

## ✅ Verification Checklist

After deployment, verify:

- [ ] \`terraform output app_name\` shows correct value
- [ ] ECR repository exists: \`aws ecr describe-repositories --repository-names \$APP_NAME\`
- [ ] Image exists in ECR: \`aws ecr describe-images --repository-name \$APP_NAME\`
- [ ] ECS task definition family matches app_name
- [ ] ECS container name matches app_name
- [ ] ECS service is running: \`aws ecs describe-services --cluster \${APP_NAME}-cluster\`
- [ ] No image pull errors in ECS events
- [ ] Application accessible via ALB URL`;

  return {
    path: 'terraform/README.md',
    content,
    description: 'Comprehensive Terraform documentation for app_name architecture'
  };
}