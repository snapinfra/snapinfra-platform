


// ============================================================================
// TERRAFORM AWS FREE TIER GENERATORS - WITH UNIQUE NAMING
// ============================================================================

import { CodeGenOptions, GeneratedFile, Project } from "./code-generator-utils";


/**
 * Generate main Terraform configuration with unique naming
 */
/**
 * Generate main Terraform configuration with unique naming
 */
export function generateTerraformMain(project: Project, options: CodeGenOptions): GeneratedFile {
  const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
  const projectId = project.id.substring(0, 8); // Use only first 8 chars of UUID

  const content = `# =============================================================================
# ${project.name} - AWS ECS Terraform Configuration (Free Tier Optimized)
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
      Application = "${projectSlug}"
    }
  }
}

# =============================================================================
# Local Values - Using Short Project ID for Unique Naming
# =============================================================================

locals {
  # Use first 8 chars of project ID for guaranteed uniqueness within character limits
  project_id_short = "${projectId}"
  
  # Resource naming with shortened project ID (ensures we stay under AWS limits)
  # Pattern: {project}-{env}-{short-id} = max ~30 chars base
  project_prefix = "\${var.project_name}-\${var.environment}-\${local.project_id_short}"
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

# =============================================================================
# VPC Module
# =============================================================================

module "vpc" {
  source = "./modules/vpc"

  project_name        = local.project_prefix
  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# =============================================================================
# Security Groups
# =============================================================================

module "security_groups" {
  source = "./modules/security"

  project_name = local.project_prefix
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

# =============================================================================
# RDS PostgreSQL Database (Free Tier: db.t3.micro, 20GB)
# =============================================================================

module "rds" {
  source = "./modules/rds"

  project_name           = local.project_prefix
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

  project_name = local.project_prefix
  environment  = var.environment
}

# =============================================================================
# ECS Cluster (Free Tier: Fargate with minimal resources)
# =============================================================================

module "ecs" {
  source = "./modules/ecs"

  project_name             = local.project_prefix
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
  name              = "/ecs/\${local.project_prefix}"
  retention_in_days = 1

  tags = {
    Name      = "\${local.project_prefix}-logs"
    ProjectId = local.project_id_short
  }
}`;

  return {
    path: 'terraform/main.tf',
    content,
    description: 'Main Terraform configuration with shortened project ID'
  };
}
/**
 * Generate Terraform variables with Free Tier defaults
 */
export function generateTerraformVariables(project: Project, options: CodeGenOptions): GeneratedFile {
  const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
  const dbName = project.name.toLowerCase().replace(/\s+/g, '_');

  const content = `# =============================================================================
# ${project.name} - Terraform Variables (Free Tier Optimized)
# =============================================================================

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name (will be prefixed with project ID)"
  type        = string
  default     = "${projectSlug}"
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
  
  validation {
    condition     = var.db_instance_class == "db.t3.micro" || var.db_instance_class == "db.t2.micro"
    error_message = "For Free Tier, use db.t3.micro or db.t2.micro"
  }
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB (FREE TIER: max 20GB)"
  type        = number
  default     = 20
  
  validation {
    condition     = var.db_allocated_storage <= 20
    error_message = "Free Tier allows maximum 20GB storage"
  }
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
  
  validation {
    condition     = contains([256, 512, 1024, 2048, 4096], var.app_cpu)
    error_message = "Valid CPU values: 256, 512, 1024, 2048, 4096"
  }
}

variable "app_memory" {
  description = "Fargate memory in MB (FREE TIER: 512-2048 MB)"
  type        = number
  default     = 512
  
  validation {
    condition     = var.app_memory >= 512 && var.app_memory <= 30720
    error_message = "Memory must be between 512 and 30720 MB"
  }
}

variable "desired_count" {
  description = "Desired number of tasks (FREE TIER: 1 recommended)"
  type        = number
  default     = 1
  
  validation {
    condition     = var.desired_count >= 1 && var.desired_count <= 4
    error_message = "Task count must be between 1 and 4"
  }
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
` : ''}

# =============================================================================
# Cost Control Variables
# =============================================================================

variable "enable_deletion_protection" {
  description = "Enable deletion protection for RDS (recommended for prod)"
  type        = bool
  default     = false
}`;

  return {
    path: 'terraform/variables.tf',
    content,
    description: 'Terraform variables using project ID'
  };
}

/**
 * Generate Terraform outputs
 */
export function generateTerraformOutputs(project: Project): GeneratedFile {
  const projectId = project.id.substring(0, 8); // Shortened

  const content = `# =============================================================================
# ${project.name} - Terraform Outputs
# =============================================================================

output "project_id_short" {
  description = "Project ID used for all resources (shortened for AWS limits)"
  value       = local.project_id_short
}

output "project_id_full" {
  description = "Full project ID"
  value       = "${project.id}"
}

output "resource_prefix" {
  description = "Resource naming prefix"
  value       = local.project_prefix
}

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
}

output "resource_naming_guide" {
  description = "Guide to all created resources"
  value = {
    project_id_short = local.project_id_short
    project_id_full  = "${project.id}"
    prefix           = local.project_prefix
    vpc              = "\${local.project_prefix}-vpc"
    rds              = "\${local.project_prefix}-db"
    ecr              = "\${local.project_prefix}"
    ecs_cluster      = "\${local.project_prefix}-cluster"
    ecs_service      = "\${local.project_prefix}-service"
    alb              = "\${local.project_prefix}-alb"
    log_group        = "/ecs/\${local.project_prefix}"
  }
}

output "free_tier_status" {
  description = "Free Tier compliance status"
  value = {
    rds_instance    = "db.t3.micro (✓ Free Tier eligible)"
    rds_storage     = "\${var.db_allocated_storage}GB (✓ Up to 20GB free)"
    fargate_cpu     = "\${var.app_cpu} units (✓ Free Tier eligible)"
    fargate_memory  = "\${var.app_memory}MB (✓ Free Tier eligible)"
    tasks           = "\${var.desired_count} task(s)"
    estimated_cost  = var.desired_count == 1 ? "~$5-10/month" : "~$10-20/month"
  }
}

output "next_steps" {
  description = "What to do next"
  value = <<-EOT
  
  ✅ Infrastructure deployed successfully!
  
  📋 Project ID (short): ${projectId}
  📋 Project ID (full): ${project.id}
  
  📋 Next Steps:
  
  1. Build and push your Docker image:
     
     aws ecr get-login-password --region \${var.aws_region} | \\
       docker login --username AWS --password-stdin \${module.ecr.repository_url}
     
     docker build -t myapp .
     docker tag myapp:latest \${module.ecr.repository_url}:latest
     docker push \${module.ecr.repository_url}:latest
  
  2. Deploy to ECS:
     
     aws ecs update-service \\
       --cluster \${module.ecs.cluster_name} \\
       --service \${module.ecs.service_name} \\
       --force-new-deployment \\
       --region \${var.aws_region}
  
  3. Wait 5-10 minutes, then test:
     
     curl http://\${module.ecs.alb_dns_name}/health
  
  4. View logs:
     
     aws logs tail \${aws_cloudwatch_log_group.app.name} --follow
  
  💰 Estimated Monthly Cost: ~$5-20 (mostly RDS and ALB)
  
  🗑️  To destroy everything:
     
     cd terraform && terraform destroy
  
  EOT
}`;

  return {
    path: 'terraform/outputs.tf',
    content,
    description: 'Terraform outputs with shortened project ID'
  };
}

/**
 * Generate VPC module (Free Tier compatible - optional NAT)
 */
export function generateTerraformVPCModule(): GeneratedFile {
  const content = `# =============================================================================
# VPC Module (Free Tier Compatible)
# =============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "\${var.project_name}-vpc"
  }
}

# =============================================================================
# Internet Gateway (Free)
# =============================================================================

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "\${var.project_name}-igw"
  }
}

# =============================================================================
# Public Subnets (Free)
# =============================================================================

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "\${var.project_name}-public-\${count.index + 1}"
    Type = "Public"
  }
}

# =============================================================================
# Private Subnets (Free)
# =============================================================================

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "\${var.project_name}-private-\${count.index + 1}"
    Type = "Private"
  }
}

# =============================================================================
# Route Tables
# =============================================================================

# Public Route Table (Free)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "\${var.project_name}-public-rt"
  }
}

# Private Route Table (routes to public for cost savings)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  # For Free Tier: Route private subnets through public IGW
  # Note: This means private instances have public IPs but controlled by SG
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "\${var.project_name}-private-rt"
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
  route_table_id = aws_route_table.private.id
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
}

output "internet_gateway_id" {
  value = aws_internet_gateway.main.id
}`;

  return {
    path: 'terraform/modules/vpc/main.tf',
    content,
    description: 'VPC module optimized for Free Tier (no NAT Gateway)'
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
  name        = "\${var.project_name}-alb-sg"
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
    Name = "\${var.project_name}-alb-sg"
  }
}

# =============================================================================
# ECS Tasks Security Group
# =============================================================================

resource "aws_security_group" "ecs_tasks" {
  name        = "\${var.project_name}-ecs-tasks-sg"
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
    Name = "\${var.project_name}-ecs-tasks-sg"
  }
}

# =============================================================================
# RDS Security Group
# =============================================================================

resource "aws_security_group" "rds" {
  name        = "\${var.project_name}-rds-sg"
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
    Name = "\${var.project_name}-rds-sg"
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
    description: 'Security groups module with unique naming'
  };
}

/**
 * Generate RDS module (Free Tier: db.t3.micro + 20GB)
 */
export function generateTerraformRDSModule(): GeneratedFile {
  const content = `# =============================================================================
# RDS PostgreSQL Module(FREE TIER: db.t3.micro + 20GB)
# =============================================================================

  resource "aws_db_subnet_group" "rds_subnet_group" {
  name = "\${var.project_name}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "\${var.project_name}-db-subnet-group"
  }
}

resource "aws_db_instance" "rds_postgres" {
  identifier = "\${var.project_name}-db"
  engine = "postgres"
  engine_version = "15"  # Free Tier eligible
  
  # FREE TIER: db.t3.micro only
  instance_class = var.db_instance_class
  allocated_storage = var.db_allocated_storage  # Max 20GB for free tier
  storage_type = "gp2"  # gp2 is free tier eligible(gp3 is not)
  storage_encrypted = false  # Encryption adds cost

  db_name = var.db_name
  username = var.db_username
  password = var.db_password
  port = 5432

  db_subnet_group_name = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [var.db_security_group_id]
  
  # FREE TIER: Minimal backup retention
  backup_retention_period = 1  # Minimum allowed
  backup_window = "03:00-04:00"
  maintenance_window = "mon:04:00-mon:05:00"
  
  # Important for dev / testing
  skip_final_snapshot = true
  final_snapshot_identifier = null
  
  # Disable enhanced monitoring to save costs
  enabled_cloudwatch_logs_exports = []
  monitoring_interval = 0
  
  # Auto minor version upgrades
  auto_minor_version_upgrade = true
  
  # Deletion protection(disable for dev)
    deletion_protection = false
  
  # Multi - AZ is NOT free tier
  multi_az = false
  
  # Performance Insights is NOT free tier
  performance_insights_enabled = false
  
  # Publicly accessible(for dev only, change for prod)
    publicly_accessible = false

  tags = {
    Name      = "\${var.project_name}-db"
    FreeTier  = "true"
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
  type = string
  sensitive = true
}

variable "db_password" {
  type = string
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
} `;

  return {
    path: 'terraform/modules/rds/main.tf',
    content,
    description: 'RDS PostgreSQL module optimized for Free Tier'
  };
}

/**
 * Generate ECR module (Free Tier: 500MB storage/month)
 */
export function generateTerraformECRModule(): GeneratedFile {
  const content = `# =============================================================================
# ECR Repository Module(FREE TIER: 500MB storage / month)
# =============================================================================

  resource "aws_ecr_repository" "ecr_repo" {
  name = "\${var.project_name}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false  # Basic scanning is free, enhanced is paid
  }

  encryption_configuration {
    encryption_type = "AES256"  # Default encryption(free)
  }

  tags = {
    Name     = "\${var.project_name}-ecr"
    FreeTier = "true"
  }
}

# Lifecycle policy to stay within free tier(keep only 3 images)
resource "aws_ecr_lifecycle_policy" "ecr_lifecycle" {
  repository = aws_ecr_repository.ecr_repo.name

  policy = jsonencode({
    rules =[
      {
        rulePriority = 1
        description  = "Keep last 3 images to stay within 500MB"
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
  value = aws_ecr_repository.ecr_repo.repository_url
}

output "repository_arn" {
  value = aws_ecr_repository.ecr_repo.arn
}

output "repository_name" {
  value = aws_ecr_repository.ecr_repo.name
} `;

  return {
    path: 'terraform/modules/ecr/main.tf',
    content,
    description: 'ECR repository module optimized for Free Tier (500MB limit)'
  };
}

/**
 * Generate ECS module (Free Tier: 256 CPU + 512 MB RAM)
 */
export function generateTerraformECSModule(project: Project, options: CodeGenOptions): GeneratedFile {
  const content = `# =============================================================================
# ECS Module (FREE TIER: 256 CPU + 512 MB RAM)
# =============================================================================

# =============================================================================
# ECS Cluster
# =============================================================================

resource "aws_ecs_cluster" "ecs_cluster_main" {
  name = "\${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "disabled"  # Container Insights is NOT free tier
  }

  tags = {
    Name     = "\${var.project_name}-cluster"
    FreeTier = "true"
  }
}

# =============================================================================
# IAM Roles (with 64-char limit enforcement)
# =============================================================================

resource "aws_iam_role" "iam_ecs_task_execution" {
  # Ensure IAM role name stays under 64 chars (AWS limit)
  name = substr("\${var.project_name}-ecs-exec", 0, 64)

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
    Name = substr("\${var.project_name}-ecs-exec", 0, 64)
  }
}

resource "aws_iam_role_policy_attachment" "iam_ecs_task_execution_attach" {
  role       = aws_iam_role.iam_ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "iam_ecs_task" {
  # Ensure IAM role name stays under 64 chars (AWS limit)
  name = substr("\${var.project_name}-ecs-task", 0, 64)

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
    Name = substr("\${var.project_name}-ecs-task", 0, 64)
  }
}

# =============================================================================
# Application Load Balancer (ALB) - 32 char name limit
# =============================================================================

resource "aws_lb" "alb_main" {
  name               = substr("\${var.project_name}-alb", 0, 32)
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false
  enable_http2               = true
  idle_timeout               = 60

  tags = {
    Name = "\${var.project_name}-alb"
  }
}

resource "aws_lb_target_group" "alb_target_group" {
  name        = substr("\${var.project_name}-tg", 0, 32)
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
    Name = "\${var.project_name}-tg"
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
# ECS Task Definition (FREE TIER: 256 CPU + 512 MB)
# =============================================================================

resource "aws_ecs_task_definition" "ecs_task_def" {
  family                   = substr("\${var.project_name}", 0, 255)
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.app_cpu     # 256 for free tier
  memory                   = var.app_memory  # 512 for free tier
  execution_role_arn       = aws_iam_role.iam_ecs_task_execution.arn
  task_role_arn            = aws_iam_role.iam_ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = substr("\${var.project_name}", 0, 255)
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
        },
        {
          name  = "DB_POOL_MIN"
          value = "2"
        },
        {
          name  = "DB_POOL_MAX"
          value = "10"
        }${options.includeAuth ? `,
        {
          name  = "JWT_SECRET"
          value = var.jwt_secret
        }` : ''}
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/\${var.project_name}"
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
    Name     = "\${var.project_name}-task"
    FreeTier = "true"
  }
}

# =============================================================================
# ECS Service
# =============================================================================

resource "aws_ecs_service" "ecs_service_main" {
  name            = "\${var.project_name}-service"
  cluster         = aws_ecs_cluster.ecs_cluster_main.id
  task_definition = aws_ecs_task_definition.ecs_task_def.arn
  desired_count   = var.desired_count  # 1 for free tier
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [var.ecs_security_group_id]
    subnets          = var.private_subnet_ids
    assign_public_ip = true  # Required since no NAT Gateway
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.alb_target_group.arn
    container_name   = substr("\${var.project_name}", 0, 255)
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
    Name     = "\${var.project_name}-service"
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
  value = aws_ecs_cluster.ecs_cluster_main.name
}

output "service_name" {
  value = aws_ecs_service.ecs_service_main.name
}

output "alb_dns_name" {
  value = aws_lb.alb_main.dns_name
}

output "alb_arn" {
  value = aws_lb.alb_main.arn
}

output "target_group_arn" {
  value = aws_lb_target_group.alb_target_group.arn
}`;

  return {
    path: 'terraform/modules/ecs/main.tf',
    content,
    description: 'ECS module with proper character limit enforcement'
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
  const projectId = project.id.substring(0, 8);

  const content = `# =============================================================================
# ${project.name} - Terraform Variables (FREE TIER CONFIGURATION)
# =============================================================================
# Copy this file to terraform.tfvars and update with your values
# Project ID: ${projectId}

# Project Configuration
project_name = "${projectSlug}"
environment = "dev"
aws_region = "us-east-1"

# Database Configuration (FREE TIER)
db_name = "${dbName}"
db_username = "postgres"
db_password = "CHANGE_THIS_PASSWORD_NOW"  # Min 8 characters, REQUIRED!

# FREE TIER LIMITS:
db_instance_class = "db.t3.micro"     # ✓ Free Tier eligible
db_allocated_storage = 20              # ✓ Max 20GB for Free Tier

# Application Configuration (FREE TIER)
app_port = 3000
app_cpu = 256       # ✓ 0.25 vCPU (Free Tier: up to 512 MB/hour)
app_memory = 512    # ✓ 512 MB RAM
desired_count = 1   # ✓ 1 task recommended for Free Tier

${options.includeAuth ? `# Authentication
jwt_secret = "CHANGE_THIS_JWT_SECRET_32_CHARS_MINIMUM"  # Min 32 characters, REQUIRED!
` : ''}
# Health Check
health_check_path = "/health"

# Cost Control
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
#
# 📋 PROJECT ID: ${projectId}
#    All resources will be named with this unique identifier
# =============================================================================`;

  return {
    path: 'terraform/terraform.tfvars',
    content,
    description: 'Example Terraform variables with project ID'
  };
}

/**
 * Generate deployment script with unique ID tracking
 */
export function generateDeploymentScript(project: Project, options: CodeGenOptions): GeneratedFile {
  const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
  const projectId = project.id.substring(0, 8);

  const content = `#!/bin/bash
# =============================================================================
# ${project.name} - AWS Free Tier Deployment Script
# Project ID: ${projectId}
# =============================================================================

set -e
set -o pipefail

RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m'

PROJECT_NAME="\${PROJECT_NAME:-${projectSlug}}"
PROJECT_ID="${projectId}"
AWS_REGION="\${AWS_REGION:-us-east-1}"
ENVIRONMENT="\${ENVIRONMENT:-dev}"

error_exit() {
  echo -e "\${RED}❌ $1\${NC}" >&2
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
echo -e "\${GREEN}🚀 AWS Free Tier Deployment\${NC}"
echo -e "\${GREEN}========================================\${NC}"
echo ""
info "Project: ${project.name}"
info "Project ID: ${projectId}"
echo ""

# =============================================================================
# 1. Prerequisites
# =============================================================================
echo -e "\${YELLOW}📋 Step 1: Checking prerequisites...\${NC}"

command -v terraform &>/dev/null || error_exit "Terraform not installed"
command -v aws &>/dev/null || error_exit "AWS CLI not installed"
command -v docker &>/dev/null || error_exit "Docker not installed"
docker info &>/dev/null || error_exit "Docker daemon not running"

success "All tools installed"

aws sts get-caller-identity &>/dev/null || error_exit "AWS not configured. Run: aws configure"

AWS_ACCOUNT_ID=\$(aws sts get-caller-identity --query Account --output text)
AWS_USER=\$(aws sts get-caller-identity --query Arn --output text | cut -d'/' -f2)

success "AWS authenticated: \${AWS_USER}"
info "Account ID: \${AWS_ACCOUNT_ID}"
info "Region: \${AWS_REGION}"
echo ""

# =============================================================================
# 2. Terraform Configuration
# =============================================================================
echo -e "\${YELLOW}🏗️  Step 2: Infrastructure setup...\${NC}"

[ -d "terraform" ] || error_exit "terraform/ directory not found"
cd terraform

if [ ! -f "terraform.tfvars" ]; then
    warn "terraform.tfvars not found!"
    info "Creating from example..."
    cp terraform.tfvars.example terraform.tfvars
    error_exit "Please edit terraform.tfvars with your passwords and rerun"
fi

# Check for required passwords
if grep -q "CHANGE_THIS" terraform.tfvars; then
    error_exit "Please set db_password${options.includeAuth ? ' and jwt_secret' : ''} in terraform.tfvars"
fi

success "Configuration found"

info "Initializing Terraform..."
terraform init || error_exit "Terraform init failed"
success "Terraform initialized"

info "Validating..."
terraform validate || error_exit "Validation failed"
success "Configuration valid"

info "Planning..."
terraform plan -out=tfplan || error_exit "Planning failed"
success "Plan created"

echo ""
warn "📊 Free Tier Deployment"
warn "Project ID: ${projectId}"
warn "This will create AWS resources. Review the plan above."
warn "Estimated cost: ~\$5-10/month (first year)"
echo ""
read -p "Deploy? (yes/no): " CONFIRM
[ "\$CONFIRM" = "yes" ] || error_exit "Cancelled"

info "Applying (10-15 minutes)..."
terraform apply tfplan || error_exit "Apply failed"
success "Infrastructure deployed"

ECR_URL=\$(terraform output -raw ecr_repository_url)
CLUSTER=\$(terraform output -raw ecs_cluster_name)
SERVICE=\$(terraform output -raw ecs_service_name)
ALB_DNS=\$(terraform output -raw alb_dns_name)

cd ..
echo ""

# =============================================================================
# 3. Docker Build & Push
# =============================================================================
echo -e "\${YELLOW}🐳 Step 3: Building Docker image...\${NC}"

info "Logging into ECR..."
aws ecr get-login-password --region \$AWS_REGION | \\
    docker login --username AWS --password-stdin \$ECR_URL || error_exit "ECR login failed"
success "ECR authenticated"

info "Building image..."
docker build -t \$PROJECT_NAME:latest . || error_exit "Build failed"
success "Image built"

info "Tagging..."
docker tag \$PROJECT_NAME:latest \$ECR_URL:latest
success "Tagged"

info "Pushing to ECR..."
docker push \$ECR_URL:latest || error_exit "Push failed"
success "Image pushed"
echo ""

# =============================================================================
# 4. ECS Deployment
# =============================================================================
echo -e "\${YELLOW}🚢 Step 4: Deploying to ECS...\${NC}"

info "Forcing new deployment..."
aws ecs update-service \\
  --cluster \$CLUSTER \\
  --service \$SERVICE \\
  --force-new-deployment \\
  --region \$AWS_REGION \\
  >/dev/null || error_exit "ECS update failed"
success "Deployment started"

info "Waiting for stability (5-10 min)..."
aws ecs wait services-stable \\
  --cluster \$CLUSTER \\
  --services \$SERVICE \\
  --region \$AWS_REGION 2>/dev/null && success "Service stable" || warn "Timeout (check manually)"
echo ""

# =============================================================================
# 5. Health Check
# =============================================================================
echo -e "\${YELLOW}🏥 Step 5: Health check...\${NC}"

info "Waiting 30s for ALB..."
sleep 30

HEALTH_URL="http://\${ALB_DNS}/health"
for i in {1..10}; do
    if curl -f -s -o /dev/null "\$HEALTH_URL"; then
        success "Health check passed!"
        break
    fi
    [ \$i -eq 10 ] && warn "Health check incomplete" || info "Retrying (\$i/10)..."
    sleep 10
done
echo ""

# =============================================================================
# Summary
# =============================================================================
echo -e "\${GREEN}========================================\${NC}"
echo -e "\${GREEN}✅ Deployment Complete!\${NC}"
echo -e "\${GREEN}========================================\${NC}"
echo ""
echo -e "\${BLUE}🆔 Project ID: ${projectId}\${NC}"
echo ""
echo -e "\${BLUE}🌐 URLs:\${NC}"
echo "  • App: http://\${ALB_DNS}"
echo "  • Health: http://\${ALB_DNS}/health"
echo ""
echo -e "\${BLUE}📚 Useful Commands:\${NC}"
echo ""
echo "View logs:"
echo "  aws logs tail /ecs/\${PROJECT_NAME}-\${ENVIRONMENT}-${projectId} --follow"
echo ""
echo "Service status:"
echo "  aws ecs describe-services --cluster \$CLUSTER --services \$SERVICE"
echo ""
echo "Destroy everything:"
echo "  cd terraform && terraform destroy"
echo ""
echo -e "\${YELLOW}💰 Estimated Cost: ~\$5-10/month (Free Tier)\${NC}"
echo ""`;

  return {
    path: 'deploy.sh',
    content,
    description: 'Deployment script using project ID for resource naming'
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

This directory contains Terraform configurations for deploying ${project.name} to AWS ECS(Fargate).

## 📋 Infrastructure Components

  - ** VPC **: Custom VPC with public and private subnets across 2 AZs
    - ** RDS **: PostgreSQL database in private subnets
      - ** ECR **: Docker container registry
        - ** ECS **: Fargate cluster with auto - scaling
        - ** ALB **: Application Load Balancer for traffic distribution
          - ** Security Groups **: Properly configured network security

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
   cp terraform.tfvars terraform.tfvars
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
├── terraform.tfvars   
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

