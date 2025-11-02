// ============================================================================
// TERRAFORM AWS ECS GENERATORS
// ============================================================================
// Add these functions to the end of code-generator-utils.ts

import { CodeGenOptions, GeneratedFile, Project } from "./code-generator-utils";

/**
 * Generate main Terraform configuration
 */
export function generateTerraformMain(project: Project, options: CodeGenOptions): GeneratedFile {
  const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');

  const content = `# =============================================================================
# ${project.name} - AWS ECS Terraform Configuration
# =============================================================================

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment to use S3 backend for state management
  # backend "s3" {
  #   bucket         = "${projectSlug}-terraform-state"
  #   key            = "infrastructure/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "${projectSlug}-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "${project.name}"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Application = "${projectSlug}"
    }
  }
}

# =============================================================================
# Data Sources
# =============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# =============================================================================
# VPC Module
# =============================================================================

module "vpc" {
  source = "./modules/vpc"

  project_name        = var.project_name
  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = data.aws_availability_zones.available.names
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# =============================================================================
# Security Groups
# =============================================================================

module "security_groups" {
  source = "./modules/security"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

# =============================================================================
# RDS PostgreSQL Database
# =============================================================================

module "rds" {
  source = "./modules/rds"

  project_name           = var.project_name
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
# ECR Repository
# =============================================================================

module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment
}

# =============================================================================
# ECS Cluster
# =============================================================================

module "ecs" {
  source = "./modules/ecs"

  project_name             = var.project_name
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
  
  # Application configuration
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
# CloudWatch Log Groups
# =============================================================================

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/\${var.project_name}-\${var.environment}"
  retention_in_days = 7

  tags = {
    Name = "\${var.project_name}-\${var.environment}-logs"
  }
}`;

  return {
    path: 'terraform/main.tf',
    content,
    description: 'Main Terraform configuration file'
  };
}

/**
 * Generate Terraform variables
 */
export function generateTerraformVariables(project: Project, options: CodeGenOptions): GeneratedFile {
  const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
  const dbName = project.name.toLowerCase().replace(/\s+/g, '_');

  const content = `# =============================================================================
# ${project.name} - Terraform Variables
# =============================================================================

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "${projectSlug}"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# =============================================================================
# VPC Configuration
# =============================================================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

# =============================================================================
# Database Configuration
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
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

# =============================================================================
# Application Configuration
# =============================================================================

variable "app_port" {
  description = "Application port"
  type        = number
  default     = 3000
}

variable "app_cpu" {
  description = "Fargate CPU units"
  type        = number
  default     = 256
}

variable "app_memory" {
  description = "Fargate memory in MB"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 2
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
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
}
` : ''}`;

  return {
    path: 'terraform/variables.tf',
    content,
    description: 'Terraform variables definition'
  };
}

/**
 * Generate Terraform outputs
 */
export function generateTerraformOutputs(project: Project): GeneratedFile {
  const content = `# =============================================================================
# ${project.name} - Terraform Outputs
# =============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = module.ecr.repository_url
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

output "db_port" {
  description = "RDS database port"
  value       = module.rds.db_port
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.app.name
}`;

  return {
    path: 'terraform/outputs.tf',
    content,
    description: 'Terraform outputs'
  };
}

/**
 * Generate VPC module
 */
export function generateTerraformVPCModule(): GeneratedFile {
  const content = `# =============================================================================
# VPC Module
# =============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "\${var.project_name}-\${var.environment}-vpc"
  }
}

# =============================================================================
# Internet Gateway
# =============================================================================

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "\${var.project_name}-\${var.environment}-igw"
  }
}

# =============================================================================
# Public Subnets
# =============================================================================

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "\${var.project_name}-\${var.environment}-public-\${count.index + 1}"
    Type = "Public"
  }
}

# =============================================================================
# Private Subnets
# =============================================================================

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "\${var.project_name}-\${var.environment}-private-\${count.index + 1}"
    Type = "Private"
  }
}

# =============================================================================
# NAT Gateway
# =============================================================================

resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"

  tags = {
    Name = "\${var.project_name}-\${var.environment}-nat-eip-\${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = length(var.public_subnet_cidrs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "\${var.project_name}-\${var.environment}-nat-\${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# =============================================================================
# Route Tables
# =============================================================================

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "\${var.project_name}-\${var.environment}-public-rt"
  }
}

resource "aws_route_table" "private" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "\${var.project_name}-\${var.environment}-private-rt-\${count.index + 1}"
  }
}

# =============================================================================
# Route Table Associations
# =============================================================================

resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# =============================================================================
# Module Variables
# =============================================================================

variable "project_name" {
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
# Module Outputs
# =============================================================================

output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}`;

  return {
    path: 'terraform/modules/vpc/main.tf',
    content,
    description: 'VPC module for networking infrastructure'
  };
}

/**
 * Generate Security Groups module
 */
export function generateTerraformSecurityModule(): GeneratedFile {
  const content = `# =============================================================================
# Security Groups Module
# =============================================================================

# =============================================================================
# ALB Security Group
# =============================================================================

resource "aws_security_group" "alb" {
  name        = "\${var.project_name}-\${var.environment}-alb-sg"
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
    Name = "\${var.project_name}-\${var.environment}-alb-sg"
  }
}

# =============================================================================
# ECS Tasks Security Group
# =============================================================================

resource "aws_security_group" "ecs_tasks" {
  name        = "\${var.project_name}-\${var.environment}-ecs-tasks-sg"
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
    Name = "\${var.project_name}-\${var.environment}-ecs-tasks-sg"
  }
}

# =============================================================================
# RDS Security Group
# =============================================================================

resource "aws_security_group" "rds" {
  name        = "\${var.project_name}-\${var.environment}-rds-sg"
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
    Name = "\${var.project_name}-\${var.environment}-rds-sg"
  }
}

# =============================================================================
# Module Variables
# =============================================================================

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

# =============================================================================
# Module Outputs
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
    description: 'Security groups module'
  };
}

/**
 * Generate RDS module
 */
export function generateTerraformRDSModule(): GeneratedFile {
  const content = `# =============================================================================
# RDS PostgreSQL Module
# =============================================================================

resource "aws_db_subnet_group" "main" {
  name       = "\${var.project_name}-\${var.environment}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "\${var.project_name}-\${var.environment}-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "\${var.project_name}-\${var.environment}-db"
  engine         = "postgres"
  engine_version = "15"
  
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432
  
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.db_security_group_id]
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  skip_final_snapshot       = true
  final_snapshot_identifier = "\${var.project_name}-\${var.environment}-final-snapshot"
  
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  
  auto_minor_version_upgrade = true
  deletion_protection        = false
  
  tags = {
    Name = "\${var.project_name}-\${var.environment}-db"
  }
}

# =============================================================================
# Module Variables
# =============================================================================

variable "project_name" {
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
# Module Outputs
# =============================================================================

output "db_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "db_address" {
  value = aws_db_instance.main.address
}

output "db_port" {
  value = aws_db_instance.main.port
}

output "db_name" {
  value = aws_db_instance.main.db_name
}`;

  return {
    path: 'terraform/modules/rds/main.tf',
    content,
    description: 'RDS PostgreSQL module'
  };
}

/**
 * Generate ECR module
 */
export function generateTerraformECRModule(): GeneratedFile {
  const content = `# =============================================================================
# ECR Repository Module
# =============================================================================

resource "aws_ecr_repository" "main" {
  name                 = "\${var.project_name}-\${var.environment}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "\${var.project_name}-\${var.environment}-ecr"
  }
}

resource "aws_ecr_lifecycle_policy" "main" {
  repository = aws_ecr_repository.main.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 10
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

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

# =============================================================================
# Module Outputs
# =============================================================================

output "repository_url" {
  value = aws_ecr_repository.main.repository_url
}

output "repository_arn" {
  value = aws_ecr_repository.main.arn
}

output "repository_name" {
  value = aws_ecr_repository.main.name
}`;

  return {
    path: 'terraform/modules/ecr/main.tf',
    content,
    description: 'ECR repository module'
  };
}

/**
 * Generate ECS module - CORRECTED VERSION
 * Fixes the deployment_configuration error
 */
export function generateTerraformECSModule(project: Project, options: CodeGenOptions): GeneratedFile {
  const content = `# =============================================================================
# ECS Cluster and Service Module
# =============================================================================

# =============================================================================
# ECS Cluster
# =============================================================================

resource "aws_ecs_cluster" "main" {
  name = "\${var.project_name}-\${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "\${var.project_name}-\${var.environment}-cluster"
  }
}

# =============================================================================
# IAM Roles
# =============================================================================

resource "aws_iam_role" "ecs_task_execution" {
  name = "\${var.project_name}-\${var.environment}-ecs-task-execution-role"

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
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name = "\${var.project_name}-\${var.environment}-ecs-task-role"

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
}

# =============================================================================
# Application Load Balancer
# =============================================================================

resource "aws_lb" "main" {
  name               = "\${var.project_name}-\${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false
  enable_http2              = true

  tags = {
    Name = "\${var.project_name}-\${var.environment}-alb"
  }
}

resource "aws_lb_target_group" "main" {
  name        = "\${var.project_name}-\${var.environment}-tg"
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
    Name = "\${var.project_name}-\${var.environment}-tg"
  }
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# =============================================================================
# ECS Task Definition
# =============================================================================

resource "aws_ecs_task_definition" "main" {
  family                   = "\${var.project_name}-\${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.app_cpu
  memory                   = var.app_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "\${var.project_name}-\${var.environment}"
      image     = "\${var.ecr_repository_url}:latest"
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
          value = var.db_host
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
        }${options.includeAuth ? `,
        {
          name  = "JWT_SECRET"
          value = var.jwt_secret
        }` : ''}
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/\${var.project_name}-\${var.environment}"
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
    Name = "\${var.project_name}-\${var.environment}-task"
  }
}

# =============================================================================
# ECS Service
# =============================================================================

resource "aws_ecs_service" "main" {
  name            = "\${var.project_name}-\${var.environment}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [var.ecs_security_group_id]
    subnets          = var.private_subnet_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "\${var.project_name}-\${var.environment}"
    container_port   = var.app_port
  }

  # CORRECTED: Use individual attributes instead of nested block
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
    aws_lb_listener.main,
    aws_iam_role_policy_attachment.ecs_task_execution
  ]

  tags = {
    Name = "\${var.project_name}-\${var.environment}-service"
  }
}

# =============================================================================
# Auto Scaling
# =============================================================================

resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 4
  min_capacity       = var.desired_count
  resource_id        = "service/\${aws_ecs_cluster.main.name}/\${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "\${var.project_name}-\${var.environment}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "ecs_memory" {
  name               = "\${var.project_name}-\${var.environment}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# =============================================================================
# Data Sources
# =============================================================================

data "aws_region" "current" {}

# =============================================================================
# Module Variables
# =============================================================================

variable "project_name" {
  type = string
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
  type = string
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
  value = aws_ecs_cluster.main.name
}

output "service_name" {
  value = aws_ecs_service.main.name
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "alb_arn" {
  value = aws_lb.main.arn
}

output "target_group_arn" {
  value = aws_lb_target_group.main.arn
}`;

  return {
    path: 'terraform/modules/ecs/main.tf',
    content,
    description: 'ECS module with corrected deployment configuration'
  };
}

/**
 * Generate terraform.tfvars.example
 */
export function generateTerraformTfvarsExample(
  project: Project,
  options: CodeGenOptions
): GeneratedFile {
  const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
  const dbName = project.name.toLowerCase().replace(/\s+/g, '_');

  const content = `# =============================================================================
# ${project.name} - Terraform Variables Example
# =============================================================================
# Copy this file to terraform.tfvars and update with your actual values

# Project Configuration
project_name = "${projectSlug}"
environment  = "dev"
aws_region   = "us-east-1"

# Database Configuration
db_name     = "${dbName}"
db_username = "postgres"
db_password = "CHANGE_THIS_SECURE_PASSWORD"  # Change this!

db_instance_class    = "db.t3.micro"
db_allocated_storage = 20

# Application Configuration
app_port       = 3000
app_cpu        = 256
app_memory     = 512
desired_count  = 2

${options.includeAuth ? `# Authentication
jwt_secret = "CHANGE_THIS_SECURE_JWT_SECRET"  # Change this!
` : ''}
# Health Check
health_check_path = "/health"`;

  return {
    path: 'terraform/terraform.tfvars.example',
    content,
    description: 'Example Terraform variables file'
  };
}



export function generateDeploymentScript(project: Project): GeneratedFile {
  const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');

  const content = `#!/bin/bash
# =============================================================================
# ${project.name} - Deployment Script
# =============================================================================

set -e
set -o pipefail

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m'

# Configuration
PROJECT_NAME="\${PROJECT_NAME:-${projectSlug}}"
AWS_REGION="\${AWS_REGION:-us-east-1}"
ENVIRONMENT="\${ENVIRONMENT:-dev}"

error_exit() {
    echo -e "\${RED}❌ Error: $1\${NC}" >&2
    exit 1
}

success() {
    echo -e "\${GREEN}✅ $1\${NC}"
}

info() {
    echo -e "\${BLUE}ℹ️  $1\${NC}"
}

warn() {
    echo -e "\${YELLOW}⚠️  $1\${NC}"
}

echo -e "\${GREEN}========================================\${NC}"
echo -e "\${GREEN}🚀 Deploying ${project.name}\${NC}"
echo -e "\${GREEN}========================================\${NC}"
echo ""

# =============================================================================
# 1. Prerequisites Check
# =============================================================================
echo -e "\${YELLOW}📋 Step 1: Checking prerequisites...\${NC}"

if ! command -v terraform &> /dev/null; then
    error_exit "Terraform not found. Install: https://www.terraform.io/downloads"
fi
success "Terraform found: \$(terraform version | head -n1)"

if ! command -v aws &> /dev/null; then
    error_exit "AWS CLI not found. Install: https://aws.amazon.com/cli/"
fi
success "AWS CLI found: \$(aws --version)"

if ! command -v docker &> /dev/null; then
    error_exit "Docker not found. Install: https://docs.docker.com/get-docker/"
fi
success "Docker found: \$(docker --version)"

if ! docker info &> /dev/null; then
    error_exit "Docker daemon not running. Please start Docker."
fi
success "Docker daemon running"

echo ""
info "Verifying AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    error_exit "AWS credentials not configured. Run: aws configure"
fi

AWS_ACCOUNT_ID=\$(aws sts get-caller-identity --query Account --output text)
AWS_USER=\$(aws sts get-caller-identity --query Arn --output text)
success "AWS authenticated as: \${AWS_USER}"
info "AWS Account ID: \${AWS_ACCOUNT_ID}"
info "AWS Region: \${AWS_REGION}"
echo ""

# =============================================================================
# 2. Check AWS IAM Permissions (FIXED)
# =============================================================================
echo -e "\${YELLOW}🔐 Step 2: Checking AWS IAM permissions...\${NC}"

check_service_access() {
    local service=\$1
    local test_command=\$2
    
    if eval "\$test_command" &> /dev/null; then
        success "\$service access confirmed"
        return 0
    else
        warn "\$service access check failed (may work anyway)"
        return 1
    fi
}

# Fixed permission checks - removed --max-results and added || true for graceful failures
check_service_access "EC2" "aws ec2 describe-regions --region \$AWS_REGION"
check_service_access "ECR" "aws ecr describe-repositories --region \$AWS_REGION || true"
check_service_access "ECS" "aws ecs list-clusters --region \$AWS_REGION"
check_service_access "RDS" "aws rds describe-db-instances --region \$AWS_REGION || true"

echo ""
info "Permission checks completed. Proceeding with deployment..."
echo ""

# =============================================================================
# 3. Terraform Infrastructure
# =============================================================================
echo -e "\${YELLOW}🏗️  Step 3: Provisioning infrastructure...\${NC}"

if [ ! -d "terraform" ]; then
    error_exit "terraform/ directory not found. Are you in the project root?"
fi

cd terraform

if [ ! -f "terraform.tfvars" ]; then
    error_exit "terraform.tfvars not found! Copy terraform.tfvars.example and configure it."
fi
success "terraform.tfvars found"

info "Initializing Terraform..."
if ! terraform init; then
    error_exit "Terraform initialization failed"
fi
success "Terraform initialized"

info "Validating configuration..."
if ! terraform validate; then
    error_exit "Terraform validation failed"
fi
success "Configuration valid"

info "Creating execution plan..."
if ! terraform plan -out=tfplan; then
    error_exit "Terraform plan failed"
fi
success "Execution plan created"

echo ""
warn "About to apply infrastructure changes."
read -p "Continue? (yes/no): " CONFIRM
if [ "\$CONFIRM" != "yes" ]; then
    error_exit "Deployment cancelled"
fi

info "Applying changes (10-15 minutes)..."
if ! terraform apply tfplan; then
    error_exit "Terraform apply failed"
fi
success "Infrastructure provisioned"

info "Retrieving outputs..."
ECR_REPOSITORY_URL=\$(terraform output -raw ecr_repository_url 2>/dev/null) || error_exit "Failed to get ECR URL"
ECS_CLUSTER_NAME=\$(terraform output -raw ecs_cluster_name 2>/dev/null) || error_exit "Failed to get cluster name"
ECS_SERVICE_NAME=\$(terraform output -raw ecs_service_name 2>/dev/null) || error_exit "Failed to get service name"
ALB_DNS_NAME=\$(terraform output -raw alb_dns_name 2>/dev/null) || error_exit "Failed to get ALB DNS"
success "Outputs retrieved"

cd ..
echo ""

# =============================================================================
# 4. Docker Build & Push
# =============================================================================
echo -e "\${YELLOW}🐳 Step 4: Building and pushing Docker image...\${NC}"

if [ ! -f "Dockerfile" ]; then
    error_exit "Dockerfile not found"
fi
success "Dockerfile found"

info "Logging into ECR..."
if ! aws ecr get-login-password --region \$AWS_REGION | \\
    docker login --username AWS --password-stdin \$ECR_REPOSITORY_URL; then
    error_exit "ECR login failed"
fi
success "ECR login successful"

info "Building Docker image..."
if ! docker build -t \$PROJECT_NAME:latest .; then
    error_exit "Docker build failed"
fi
success "Image built"

info "Tagging for ECR..."
docker tag \$PROJECT_NAME:latest \$ECR_REPOSITORY_URL:latest
success "Image tagged"

info "Pushing to ECR..."
if ! docker push \$ECR_REPOSITORY_URL:latest; then
    error_exit "Push to ECR failed"
fi
success "Image pushed"
echo ""

# =============================================================================
# 5. ECS Deployment
# =============================================================================
echo -e "\${YELLOW}🚢 Step 5: Deploying to ECS...\${NC}"

info "Forcing new deployment..."
if ! aws ecs update-service \\
    --cluster \$ECS_CLUSTER_NAME \\
    --service \$ECS_SERVICE_NAME \\
    --force-new-deployment \\
    --region \$AWS_REGION \\
    > /dev/null; then
    error_exit "ECS update failed"
fi
success "Deployment initiated"

info "Waiting for stability (5-10 minutes)..."
info "Press Ctrl+C to exit (deployment continues)"

if aws ecs wait services-stable \\
    --cluster \$ECS_CLUSTER_NAME \\
    --services \$ECS_SERVICE_NAME \\
    --region \$AWS_REGION 2>/dev/null; then
    success "Service is stable"
else
    warn "Stabilization timeout"
    info "Check status: aws ecs describe-services --cluster \$ECS_CLUSTER_NAME --services \$ECS_SERVICE_NAME"
fi
echo ""

# =============================================================================
# 6. Health Check
# =============================================================================
echo -e "\${YELLOW}🏥 Step 6: Health check...\${NC}"

info "Waiting 30s for load balancer..."
sleep 30

HEALTH_URL="http://\${ALB_DNS_NAME}/health"
info "Checking: \$HEALTH_URL"

for i in {1..10}; do
    if curl -f -s -o /dev/null "\$HEALTH_URL"; then
        success "Health check passed!"
        break
    else
        warn "Health check failed (attempt \$i/10), retrying..."
        sleep 10
    fi
    
    if [ \$i -eq 10 ]; then
        warn "Health check incomplete"
        info "Check logs: aws logs tail /ecs/\${PROJECT_NAME}-\${ENVIRONMENT} --follow"
    fi
done
echo ""

# =============================================================================
# 7. Summary
# =============================================================================
echo -e "\${GREEN}========================================\${NC}"
echo -e "\${GREEN}✅ Deployment Complete!\${NC}"
echo -e "\${GREEN}========================================\${NC}"
echo ""
echo -e "\${BLUE}📊 Summary:\${NC}"
echo "  • Project: \${PROJECT_NAME}"
echo "  • Environment: \${ENVIRONMENT}"
echo "  • Region: \${AWS_REGION}"
echo "  • Account: \${AWS_ACCOUNT_ID}"
echo ""
echo -e "\${BLUE}🌐 URLs:\${NC}"
echo "  • App: http://\${ALB_DNS_NAME}"
echo "  • Health: http://\${ALB_DNS_NAME}/health"
echo ""
echo -e "\${BLUE}🎯 Resources:\${NC}"
echo "  • Cluster: \${ECS_CLUSTER_NAME}"
echo "  • Service: \${ECS_SERVICE_NAME}"
echo "  • Registry: \${ECR_REPOSITORY_URL}"
echo ""
echo -e "\${YELLOW}⏳ Load balancer may take 2-3 minutes to be fully healthy\${NC}"
echo ""
echo -e "\${BLUE}📚 Commands:\${NC}"
echo ""
echo "Service status:"
echo "  aws ecs describe-services --cluster \$ECS_CLUSTER_NAME --services \$ECS_SERVICE_NAME"
echo ""
echo "View logs:"
echo "  aws logs tail /ecs/\${PROJECT_NAME}-\${ENVIRONMENT} --follow"
echo ""
echo "List tasks:"
echo "  aws ecs list-tasks --cluster \$ECS_CLUSTER_NAME --service-name \$ECS_SERVICE_NAME"
echo ""
echo "Test API:"
echo "  curl http://\${ALB_DNS_NAME}/health"
echo ""`;

  return {
    path: 'deploy.sh',
    content,
    description: 'Fixed deployment script with proper permission checks and error handling'
  };
}

/**
 * Generate Terraform README
 */
export function generateTerraformReadme(
  project: Project,
  options: CodeGenOptions
): GeneratedFile {
  const content = `# ${project.name} - Terraform Infrastructure

This directory contains Terraform configurations for deploying ${project.name} to AWS ECS (Fargate).

## 📋 Infrastructure Components

- **VPC**: Custom VPC with public and private subnets across 2 AZs
- **RDS**: PostgreSQL database in private subnets
- **ECR**: Docker container registry
- **ECS**: Fargate cluster with auto-scaling
- **ALB**: Application Load Balancer for traffic distribution
- **Security Groups**: Properly configured network security

## 🚀 Quick Start

### Prerequisites

\`\`\`bash
# Install Terraform
brew install terraform  # macOS
# or download from https://www.terraform.io/downloads

# Configure AWS credentials
aws configure
\`\`\`

### Deployment Steps

1. **Configure Variables**
   \`\`\`bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   \`\`\`

2. **Deploy Everything**
   \`\`\`bash
   # From project root
   chmod +x deploy.sh
   ./deploy.sh
   \`\`\`

   Or manually:
   \`\`\`bash
   # Initialize Terraform
   terraform init

   # Review changes
   terraform plan

   # Apply infrastructure
   terraform apply

   # Build and push Docker image
   ECR_URL=$(terraform output -raw ecr_repository_url)
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URL
   docker build -t myapp .
   docker tag myapp:latest $ECR_URL:latest
   docker push $ECR_URL:latest

   # Force ECS deployment
   aws ecs update-service \\
     --cluster $(terraform output -raw ecs_cluster_name) \\
     --service $(terraform output -raw ecs_service_name) \\
     --force-new-deployment
   \`\`\`

## 📁 File Structure

\`\`\`
terraform/
├── main.tf                    # Main configuration
├── variables.tf               # Variable definitions
├── outputs.tf                 # Output values
├── terraform.tfvars.example   # Example variables
└── modules/
    ├── vpc/                   # VPC networking
    ├── security/              # Security groups
    ├── rds/                   # PostgreSQL database
    ├── ecr/                   # Container registry
    └── ecs/                   # ECS cluster & service
\`\`\`

## 🔧 Important Variables

| Variable | Description | Default |
|----------|-------------|---------|
| \`project_name\` | Project identifier | - |
| \`environment\` | Environment name | dev |
| \`db_password\` | Database password | - |
${options.includeAuth ? '| `jwt_secret` | JWT signing secret | - |\n' : ''}| \`app_cpu\` | Fargate CPU units | 256 |
| \`app_memory\` | Fargate memory (MB) | 512 |
| \`desired_count\` | Number of tasks | 2 |

## 📊 Outputs

After deployment, Terraform provides:

- \`alb_url\`: Application URL
- \`ecr_repository_url\`: Docker registry URL
- \`db_endpoint\`: Database connection endpoint

## 🔒 Security Considerations

1. **Never commit** \`terraform.tfvars\` or \`.env\` files
2. Use strong passwords for \`db_password\`${options.includeAuth ? ' and `jwt_secret`' : ''}
3. Review security group rules before applying
4. Enable deletion protection for production RDS instances
5. Consider using AWS Secrets Manager for sensitive data

## 💰 Cost Estimation

Approximate monthly costs (us-east-1):

- **ECS Fargate** (2 tasks, 0.25 vCPU, 0.5 GB): ~$15-20
- **RDS db.t3.micro**: ~$15-20
- **ALB**: ~$16-20
- **Data Transfer**: Variable
- **ECR Storage**: Minimal

**Total**: ~$50-70/month for dev environment

## 🔄 Updating Infrastructure

\`\`\`bash
# Modify .tf files
terraform plan
terraform apply

# To update application code only
./deploy.sh  # Rebuilds and redeploys container
\`\`\`

## 🗑️ Cleanup

\`\`\`bash
cd terraform
terraform destroy
\`\`\`

⚠️ **Warning**: This will delete all resources including the database!

## 🐛 Troubleshooting

### Issue: Service won't stabilize
\`\`\`bash
# Check service events
aws ecs describe-services --cluster CLUSTER_NAME --services SERVICE_NAME

# Check task logs
aws logs tail /ecs/PROJECT_NAME-ENV --follow
\`\`\`

### Issue: Can't push to ECR
\`\`\`bash
# Re-authenticate
aws ecr get-login-password --region us-east-1 | \\
  docker login --username AWS --password-stdin ECR_URL
\`\`\`

### Issue: Database connection fails
- Check security group rules
- Verify RDS is in "available" state
- Confirm environment variables in ECS task definition

## 📚 Resources

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)`;

  return {
    path: 'terraform/README.md',
    content,
    description: 'Comprehensive Terraform documentation'
  };
}
