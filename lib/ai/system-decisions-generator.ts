import { generateText } from 'ai';
import { groq, AI_CONFIG } from './groq-client';
import { SystemArchitecture } from '@/lib/types/architecture';
import { SystemDecisionsSummary } from '@/lib/types/system-decisions';

export interface GenerateSystemDecisionsOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateSystemDecisionsRequest {
  architecture: SystemArchitecture;
  projectData: {
    projectName?: string;
    description?: string;
    schemas?: any[];
    endpoints?: any[];
    analysis?: any;
  };
  options?: GenerateSystemDecisionsOptions;
}

const SYSTEM_DECISIONS_PROMPT = `You are a senior solutions architect and enterprise technology consultant with deep expertise in tool selection, infrastructure design, and technology decision-making. Your task is to generate comprehensive system decisions and tool recommendations for a software project based on its architecture and requirements.

CRITICAL REQUIREMENTS:
- Respond with ONLY valid JSON. No other text, no markdown, no code blocks, no explanations.
- Output must be parseable by JSON.parse() without any modifications.
- Do not wrap the JSON in markdown code blocks (no \`\`\`json or \`\`\`).
- ALL fields in the output structure are REQUIRED - do not omit any field.
- Generate tool recommendations for EVERY component in the architecture.
- Include at least 3-5 alternative tools for each component.

Required JSON Output Structure:
{
  "projectName": "string",
  "architecture": {
    "complexity": "simple" | "moderate" | "complex",
    "components": number,
    "estimatedCost": {
      "development": "string (formatted currency)",
      "monthly": "string (formatted currency)",
      "annual": "string (formatted currency)"
    },
    "timeline": {
      "mvp": "string (weeks)",
      "production": "string (weeks)",
      "scale": "string (weeks)"
    }
  },
  "decisions": [
    {
      "id": "string (unique decision ID)",
      "title": "string (decision title)",
      "description": "string (detailed description)",
      "category": "database" | "infrastructure" | "security" | "monitoring" | "deployment" | "analytics",
      "component": "string (component type from architecture)",
      "recommendations": [
        {
          "id": "string (tool ID)",
          "category": "string",
          "component": "string",
          "name": "string (tool name)",
          "type": "open-source" | "commercial" | "managed-service" | "freemium",
          "description": "string (detailed description)",
          "pros": ["string"],
          "cons": ["string"],
          "pricing": {
            "model": "free" | "freemium" | "subscription" | "usage-based",
            "cost": "string (optional cost info)",
            "details": "string"
          },
          "complexity": "low" | "medium" | "high",
          "popularity": number (0-100),
          "documentation": "Excellent" | "Good" | "Fair",
          "alternatives": ["string"],
          "integration": {
            "effort": "low" | "medium" | "high",
            "timeEstimate": "string",
            "dependencies": ["string"]
          },
          "metadata": {
            "website": "string (optional)",
            "github": "string (optional)",
            "cloudProvider": "string (optional)",
            "supportLevel": "string (optional)"
          },
          "enterpriseScore": number (0-100)
        }
      ],
      "selectedTool": "string (ID of recommended tool)",
      "reasoning": "string (detailed reasoning for the recommendation)",
      "impact": "low" | "medium" | "high",
      "urgency": "optional" | "recommended" | "critical"
    }
  ],
  "integrationPlan": {
    "phase1": ["string (decision titles)"],
    "phase2": ["string (decision titles)"],
    "phase3": ["string (decision titles)"]
  },
  "totalCostEstimate": {
    "development": number,
    "monthlyOperational": number,
    "annualOperational": number
  },
  "riskAssessment": {
    "technical": ["string (technical risks)"],
    "operational": ["string (operational risks)"],
    "financial": ["string (financial risks)"]
  }
}

ANALYSIS GUIDELINES:

1. COMPONENT IDENTIFICATION:
   - Analyze all nodes in the provided architecture
   - For each component type (database, api-gateway, monitoring, cache, etc.), generate comprehensive tool recommendations
   - Include both explicit components from architecture and essential cross-cutting concerns
   - Essential components to always consider: cloud-provider, container-orchestration, security, ci-cd, monitoring

2. TOOL RECOMMENDATIONS:
   - Provide 3-5 alternative tools for each component
   - Include mix of: open-source, managed services, commercial options
   - Analyze based on: popularity, complexity, cost, integration effort, team capabilities
   - Calculate enterpriseScore (0-100) based on:
     * Popularity and community support (30%)
     * Ease of integration and complexity (25%)
     * Cost-effectiveness (20%)
     * Documentation quality (15%)
     * Enterprise features and support (10%)

3. DECISION REASONING:
   - Provide detailed, context-aware reasoning for each recommendation
   - Consider project complexity, team size, budget, time-to-market
   - Address scalability, reliability, security, and compliance needs
   - Explain trade-offs between alternatives

4. COST ESTIMATION:
   - Development cost: Based on integration complexity and number of components
   - Monthly operational cost: Sum of tool subscription/usage costs
   - Annual operational cost: Monthly × 12 with volume discounts
   - Simple projects: $8K-15K dev, $50-100/mo operational
   - Moderate projects: $15K-30K dev, $100-300/mo operational
   - Complex projects: $30K-100K dev, $300-1000/mo operational

5. TIMELINE ESTIMATION:
   - MVP: Minimum viable product with core features
   - Production: Full featured, production-ready system
   - Scale: Optimized for high-traffic and scaling
   - Simple: 4-8 weeks MVP, 8-12 weeks production, 12-16 weeks scale
   - Moderate: 8-12 weeks MVP, 12-20 weeks production, 20-28 weeks scale
   - Complex: 12-24 weeks MVP, 24-40 weeks production, 40-52 weeks scale

6. RISK ASSESSMENT:
   - Technical risks: Architecture complexity, tool maturity, integration challenges
   - Operational risks: Team expertise, maintenance burden, vendor lock-in
   - Financial risks: Cost overruns, scaling costs, licensing changes

7. INTEGRATION PLAN:
   - Phase 1 (Critical): database, cloud-provider, security - essential foundation
   - Phase 2 (Recommended): monitoring, ci-cd, cache, api-gateway - core operations
   - Phase 3 (Optional): analytics, search, message-queue - enhancement features

CONTEXT AWARENESS:
- Detect team size from component count: <5 components = small, 5-10 = medium, 10-15 = large, >15 = enterprise
- Detect budget tier from description keywords: startup/mvp = startup, scale/growth = growth, enterprise/large = enterprise
- Detect compliance needs from keywords: hipaa, pci, gdpr, soc2, iso
- Detect urgency from keywords: urgent, asap, quickly = urgent; planned, roadmap = planned
- Adjust recommendations based on these context signals

TOOL CATEGORIES & EXAMPLES:
- Database: PostgreSQL, MySQL, MongoDB, Amazon Aurora, DynamoDB
- API Gateway: Kong, AWS API Gateway, Nginx, Envoy
- Monitoring: Prometheus+Grafana, Datadog, New Relic, AWS CloudWatch
- Cache: Redis, Memcached, Amazon ElastiCache
- CI/CD: GitHub Actions, Jenkins, GitLab CI/CD, AWS CodePipeline
- Cloud Provider: AWS, Google Cloud, Azure, DigitalOcean
- Container Orchestration: Kubernetes, AWS EKS, Docker Swarm, Azure AKS
- Security: HashiCorp Vault, AWS Secrets Manager, SonarQube
- Message Queue: RabbitMQ, Apache Kafka, Amazon SQS, Google Pub/Sub
- Search Engine: Elasticsearch, Algolia, Amazon OpenSearch
- Analytics: Google Analytics, Mixpanel, Amplitude
- Load Balancer: NGINX, AWS ALB, HAProxy, Cloudflare
- CDN: Cloudflare, AWS CloudFront, Fastly, Azure CDN

EXHAUSTIVE JSON SAMPLE - USE THIS AS YOUR TEMPLATE:

{
  "projectName": "E-Commerce Platform",
  "architecture": {
    "complexity": "moderate",
    "components": 8,
    "estimatedCost": {
      "development": "$25,000",
      "monthly": "$250",
      "annual": "$2,700"
    },
    "timeline": {
      "mvp": "10 weeks",
      "production": "16 weeks",
      "scale": "24 weeks"
    }
  },
  "decisions": [
    {
      "id": "decision-database",
      "title": "Database Selection",
      "description": "Choose the best database solution for storing product data, user information, orders, and transaction history with strong ACID compliance and query performance",
      "category": "database",
      "component": "database",
      "recommendations": [
        {
          "id": "postgresql",
          "category": "Database",
          "component": "database",
          "name": "PostgreSQL",
          "type": "open-source",
          "description": "Advanced open-source relational database with excellent ACID compliance, rich feature set including JSON support, full-text search, and extensibility through custom functions and extensions",
          "pros": [
            "ACID compliant for transaction safety",
            "Rich feature set with JSON and JSONB support",
            "Strong community and extensive documentation",
            "Excellent performance for complex queries",
            "Free and open-source"
          ],
          "cons": [
            "Memory intensive for large datasets",
            "Complex configuration and tuning required",
            "Steeper learning curve compared to MySQL"
          ],
          "pricing": {
            "model": "free",
            "cost": "",
            "details": "Free to use, hosting and infrastructure costs vary"
          },
          "complexity": "medium",
          "popularity": 95,
          "documentation": "Excellent",
          "alternatives": ["MySQL", "Amazon RDS PostgreSQL", "Azure Database for PostgreSQL"],
          "integration": {
            "effort": "low",
            "timeEstimate": "1-2 days",
            "dependencies": ["Node.js pg driver", "Connection pooling library", "Database migration tool"]
          },
          "metadata": {
            "website": "https://postgresql.org",
            "github": "https://github.com/postgres/postgres",
            "cloudProvider": "",
            "supportLevel": "community"
          },
          "enterpriseScore": 88
        },
        {
          "id": "amazon-aurora",
          "category": "Database",
          "component": "database",
          "name": "Amazon Aurora",
          "type": "managed-service",
          "description": "Cloud-native relational database with MySQL and PostgreSQL compatibility, offering 5x performance improvement with automated backups, auto-scaling storage, and multi-AZ deployments",
          "pros": [
            "High performance with 5x MySQL throughput",
            "Auto-scaling storage up to 128TB",
            "Continuous backup to S3",
            "Multi-AZ high availability",
            "Serverless option available"
          ],
          "cons": [
            "AWS vendor lock-in",
            "Higher cost than standard RDS",
            "Complex pricing model",
            "Limited to AWS ecosystem"
          ],
          "pricing": {
            "model": "usage-based",
            "cost": "$100-500/month",
            "details": "Pay for compute, storage, and I/O separately. Costs scale with usage."
          },
          "complexity": "low",
          "popularity": 82,
          "documentation": "Excellent",
          "alternatives": ["Google Cloud Spanner", "Azure SQL Database", "CockroachDB"],
          "integration": {
            "effort": "low",
            "timeEstimate": "1-2 days",
            "dependencies": ["AWS VPC configuration", "Parameter groups", "Security groups", "IAM roles"]
          },
          "metadata": {
            "website": "https://aws.amazon.com/aurora/",
            "github": "",
            "cloudProvider": "AWS",
            "supportLevel": "enterprise"
          },
          "enterpriseScore": 91
        },
        {
          "id": "mongodb",
          "category": "Database",
          "component": "database",
          "name": "MongoDB",
          "type": "open-source",
          "description": "Document-oriented NoSQL database with flexible schema design, horizontal scaling capabilities, and rich query language for handling unstructured data",
          "pros": [
            "Schema flexibility for rapid iteration",
            "Horizontal scaling with sharding",
            "Rich query language with aggregation",
            "Strong ecosystem and tooling",
            "Good for unstructured data"
          ],
          "cons": [
            "Higher memory usage",
            "No ACID transactions across documents",
            "Learning curve for query optimization",
            "Potential data consistency issues"
          ],
          "pricing": {
            "model": "freemium",
            "cost": "",
            "details": "Community edition free, Enterprise features and Atlas managed service paid"
          },
          "complexity": "medium",
          "popularity": 89,
          "documentation": "Excellent",
          "alternatives": ["Amazon DocumentDB", "Azure Cosmos DB", "CouchDB"],
          "integration": {
            "effort": "low",
            "timeEstimate": "1-2 days",
            "dependencies": ["MongoDB driver", "Schema design", "Index optimization"]
          },
          "metadata": {
            "website": "https://www.mongodb.com",
            "github": "https://github.com/mongodb/mongo",
            "cloudProvider": "",
            "supportLevel": "commercial"
          },
          "enterpriseScore": 84
        },
        {
          "id": "mysql",
          "category": "Database",
          "component": "database",
          "name": "MySQL",
          "type": "open-source",
          "description": "Popular open-source relational database known for reliability, ease of use, and wide adoption in web applications with strong read performance",
          "pros": [
            "Easy to learn and use",
            "Wide adoption and support",
            "Good read performance",
            "Mature replication features",
            "Large community"
          ],
          "cons": [
            "Limited advanced features vs PostgreSQL",
            "Weaker support for complex queries",
            "Less flexible indexing options"
          ],
          "pricing": {
            "model": "free",
            "cost": "",
            "details": "Free and open-source, hosting costs vary"
          },
          "complexity": "low",
          "popularity": 93,
          "documentation": "Excellent",
          "alternatives": ["MariaDB", "Amazon RDS MySQL", "Percona Server"],
          "integration": {
            "effort": "low",
            "timeEstimate": "1 day",
            "dependencies": ["MySQL driver", "Connection pooling"]
          },
          "metadata": {
            "website": "https://www.mysql.com",
            "github": "https://github.com/mysql/mysql-server",
            "cloudProvider": "",
            "supportLevel": "community"
          },
          "enterpriseScore": 86
        }
      ],
      "selectedTool": "postgresql",
      "reasoning": "PostgreSQL is recommended for this e-commerce platform due to its strong ACID compliance ensuring data integrity for transactions, excellent support for complex queries needed for product searches and analytics, and JSON support for flexible product attributes. The open-source nature keeps costs low while providing enterprise-grade features. Strong community support and extensive documentation reduce development risk.",
      "impact": "high",
      "urgency": "critical"
    },
    {
      "id": "decision-cloud-provider",
      "title": "Cloud Infrastructure Selection",
      "description": "Select the cloud platform that will host the entire application infrastructure, providing compute, storage, networking, and managed services",
      "category": "infrastructure",
      "component": "cloud-provider",
      "recommendations": [
        {
          "id": "aws",
          "category": "Cloud Infrastructure",
          "component": "cloud-provider",
          "name": "Amazon Web Services (AWS)",
          "type": "managed-service",
          "description": "Leading cloud platform with the most comprehensive service portfolio including EC2, S3, RDS, Lambda, and 200+ services for building scalable applications",
          "pros": [
            "Largest service portfolio in the industry",
            "Global presence with 30+ regions",
            "Mature ecosystem with extensive tooling",
            "Enterprise-grade security and compliance",
            "Strong marketplace and partner network"
          ],
          "cons": [
            "Complex pricing can be difficult to predict",
            "Steep learning curve for beginners",
            "Potential vendor lock-in",
            "Can become expensive without optimization"
          ],
          "pricing": {
            "model": "usage-based",
            "cost": "Variable",
            "details": "Pay-as-you-go for most services, reserved instances available for cost savings"
          },
          "complexity": "high",
          "popularity": 94,
          "documentation": "Excellent",
          "alternatives": ["Google Cloud Platform", "Microsoft Azure", "DigitalOcean"],
          "integration": {
            "effort": "medium",
            "timeEstimate": "1-2 weeks",
            "dependencies": ["AWS account setup", "IAM roles and policies", "VPC network configuration", "Security groups"]
          },
          "metadata": {
            "website": "https://aws.amazon.com",
            "github": "",
            "cloudProvider": "AWS",
            "supportLevel": "enterprise"
          },
          "enterpriseScore": 92
        },
        {
          "id": "gcp",
          "category": "Cloud Infrastructure",
          "component": "cloud-provider",
          "name": "Google Cloud Platform",
          "type": "managed-service",
          "description": "Google's cloud platform with strong AI/ML capabilities, competitive pricing, and excellent Kubernetes support through GKE",
          "pros": [
            "Strong AI/ML services and BigQuery",
            "Competitive pricing (20-30% cheaper than AWS)",
            "Excellent Kubernetes support with GKE",
            "Simple and predictable pricing",
            "Strong focus on developer experience"
          ],
          "cons": [
            "Smaller service ecosystem than AWS",
            "Less enterprise adoption",
            "Frequent service changes and deprecations",
            "Smaller partner ecosystem"
          ],
          "pricing": {
            "model": "usage-based",
            "cost": "Variable",
            "details": "Generally 20-30% cheaper than AWS for compute and storage with sustained use discounts"
          },
          "complexity": "medium",
          "popularity": 78,
          "documentation": "Good",
          "alternatives": ["AWS", "Microsoft Azure", "IBM Cloud"],
          "integration": {
            "effort": "medium",
            "timeEstimate": "1-2 weeks",
            "dependencies": ["GCP account", "Service accounts", "VPC setup", "IAM policies"]
          },
          "metadata": {
            "website": "https://cloud.google.com",
            "github": "",
            "cloudProvider": "GCP",
            "supportLevel": "enterprise"
          },
          "enterpriseScore": 85
        },
        {
          "id": "azure",
          "category": "Cloud Infrastructure",
          "component": "cloud-provider",
          "name": "Microsoft Azure",
          "type": "managed-service",
          "description": "Microsoft's cloud platform with excellent enterprise integration, strong hybrid cloud capabilities, and deep integration with Microsoft products",
          "pros": [
            "Excellent Microsoft product integration",
            "Strong hybrid cloud capabilities",
            "Enterprise-focused features",
            "Good compliance certifications",
            "Active Directory integration"
          ],
          "cons": [
            "Complex portal interface",
            "Service reliability concerns",
            "Pricing complexity",
            "Inconsistent API design"
          ],
          "pricing": {
            "model": "usage-based",
            "cost": "Variable",
            "details": "Competitive with AWS, good discounts for Microsoft customers with Enterprise Agreements"
          },
          "complexity": "medium",
          "popularity": 82,
          "documentation": "Good",
          "alternatives": ["AWS", "Google Cloud Platform", "Oracle Cloud"],
          "integration": {
            "effort": "medium",
            "timeEstimate": "1-2 weeks",
            "dependencies": ["Azure subscription", "Resource groups", "Active Directory setup", "Virtual networks"]
          },
          "metadata": {
            "website": "https://azure.microsoft.com",
            "github": "",
            "cloudProvider": "Azure",
            "supportLevel": "enterprise"
          },
          "enterpriseScore": 87
        }
      ],
      "selectedTool": "aws",
      "reasoning": "AWS is recommended as the cloud provider due to its comprehensive service portfolio that can support all components of the e-commerce platform, mature ecosystem with proven reliability at scale, and strong marketplace for third-party integrations. While pricing is complex, the extensive documentation and large community make it easier to optimize costs. The global presence ensures low latency for customers worldwide.",
      "impact": "high",
      "urgency": "critical"
    },
    {
      "id": "decision-ci-cd",
      "title": "CI/CD Pipeline Selection",
      "description": "Choose the continuous integration and deployment platform for automating build, test, and deployment workflows",
      "category": "deployment",
      "component": "ci-cd",
      "recommendations": [
        {
          "id": "github-actions",
          "category": "CI/CD",
          "component": "ci-cd",
          "name": "GitHub Actions",
          "type": "freemium",
          "description": "Integrated CI/CD platform built into GitHub with workflow automation, rich marketplace of actions, and seamless integration with repositories",
          "pros": [
            "Tight GitHub integration",
            "Easy setup with YAML workflows",
            "Rich marketplace of pre-built actions",
            "Free for public repositories",
            "Matrix builds for multiple environments"
          ],
          "cons": [
            "Requires GitHub as source control",
            "Limited for complex enterprise workflows",
            "Pricing for private repos can add up",
            "Less flexible than Jenkins"
          ],
          "pricing": {
            "model": "freemium",
            "cost": "$0.008/minute",
            "details": "Free for public repos, pay-per-use for private repos (2,000 free minutes/month)"
          },
          "complexity": "low",
          "popularity": 91,
          "documentation": "Excellent",
          "alternatives": ["Jenkins", "GitLab CI/CD", "AWS CodePipeline"],
          "integration": {
            "effort": "low",
            "timeEstimate": "1-2 days",
            "dependencies": ["GitHub repository", "YAML workflow files", "Secrets configuration"]
          },
          "metadata": {
            "website": "https://github.com/features/actions",
            "github": "",
            "cloudProvider": "",
            "supportLevel": "commercial"
          },
          "enterpriseScore": 89
        },
        {
          "id": "gitlab-cicd",
          "category": "CI/CD",
          "component": "ci-cd",
          "name": "GitLab CI/CD",
          "type": "freemium",
          "description": "Integrated DevOps platform with built-in CI/CD, security scanning, container registry, and comprehensive deployment capabilities",
          "pros": [
            "Complete DevOps platform",
            "Built-in security scanning",
            "Kubernetes integration",
            "Self-hosted option available",
            "Auto DevOps for automatic pipelines"
          ],
          "cons": [
            "Resource intensive",
            "Complex for simple projects",
            "Learning curve for advanced features",
            "Runner management overhead"
          ],
          "pricing": {
            "model": "freemium",
            "cost": "$19-99/user/month",
            "details": "Free tier available, paid plans for advanced features (400 CI/CD minutes free)"
          },
          "complexity": "medium",
          "popularity": 85,
          "documentation": "Excellent",
          "alternatives": ["GitHub Actions", "Azure DevOps", "CircleCI"],
          "integration": {
            "effort": "medium",
            "timeEstimate": "3-5 days",
            "dependencies": ["GitLab repository", "Runners setup", "Pipeline configuration"]
          },
          "metadata": {
            "website": "https://about.gitlab.com",
            "github": "",
            "cloudProvider": "",
            "supportLevel": "commercial"
          },
          "enterpriseScore": 87
        },
        {
          "id": "jenkins",
          "category": "CI/CD",
          "component": "ci-cd",
          "name": "Jenkins",
          "type": "open-source",
          "description": "Leading open-source automation server with extensive plugin ecosystem for building complex CI/CD pipelines",
          "pros": [
            "Highly customizable",
            "Vast plugin ecosystem (1800+ plugins)",
            "Self-hosted control",
            "Active community",
            "Free and open-source"
          ],
          "cons": [
            "Complex setup and maintenance",
            "Maintenance overhead",
            "Dated UI",
            "Security concerns with plugins",
            "Requires dedicated infrastructure"
          ],
          "pricing": {
            "model": "free",
            "cost": "",
            "details": "Free to use, infrastructure costs for hosting servers"
          },
          "complexity": "high",
          "popularity": 78,
          "documentation": "Good",
          "alternatives": ["GitHub Actions", "GitLab CI/CD", "TeamCity"],
          "integration": {
            "effort": "high",
            "timeEstimate": "1-2 weeks",
            "dependencies": ["Server setup", "Plugin installation", "Pipeline configuration", "Security hardening"]
          },
          "metadata": {
            "website": "https://www.jenkins.io",
            "github": "https://github.com/jenkinsci/jenkins",
            "cloudProvider": "",
            "supportLevel": "community"
          },
          "enterpriseScore": 75
        }
      ],
      "selectedTool": "github-actions",
      "reasoning": "GitHub Actions is recommended for its seamless integration with GitHub repositories, ease of setup with YAML-based workflows, and rich marketplace of pre-built actions. The low complexity and excellent documentation enable rapid implementation. Free tier for private repos provides cost-effective starting point, and the platform scales well as the project grows.",
      "impact": "medium",
      "urgency": "recommended"
    }
  ],
  "integrationPlan": {
    "phase1": [
      "Database Selection",
      "Cloud Infrastructure Selection"
    ],
    "phase2": [
      "CI/CD Pipeline Selection",
      "Monitoring Solution",
      "Caching Layer"
    ],
    "phase3": [
      "CDN Selection",
      "Analytics Platform"
    ]
  },
  "totalCostEstimate": {
    "development": 25000,
    "monthlyOperational": 250,
    "annualOperational": 2700
  },
  "riskAssessment": {
    "technical": [
      "PostgreSQL requires careful query optimization to maintain performance at scale",
      "Complex AWS service integration may require specialized expertise",
      "Database migration complexity if switching from development to production database"
    ],
    "operational": [
      "AWS vendor lock-in makes it difficult to migrate to other cloud providers",
      "Team needs training on AWS services and best practices",
      "CI/CD pipeline maintenance requires ongoing attention"
    ],
    "financial": [
      "AWS costs can increase rapidly with traffic growth without proper monitoring",
      "Database storage costs will scale with data volume",
      "Need to implement cost monitoring and alerts to prevent budget overruns"
    ]
  }
}

IMPORTANT: Use the sample above as your template. Generate a response that follows this EXACT structure with ALL fields populated. Adapt the content to match the specific project architecture and requirements provided. Remember: Output ONLY the JSON structure. No explanatory text before or after.`;

// Step 1: Analyze project context
async function analyzeProjectContext(
  architecture: SystemArchitecture,
  projectData: any,
  options: GenerateSystemDecisionsOptions
) {
  const context = {
    architecture: {
      nodes: architecture.nodes.map(n => ({
        id: n.id,
        type: n.type,
        label: n.data.label,
      })),
      edges: architecture.edges.map(e => ({
        source: e.source,
        target: e.target,
        label: e.label,
      })),
      componentCount: architecture.nodes.length,
    },
    project: {
      name: projectData.projectName || 'Your Project',
      description: projectData.description || '',
      hasSchemas: !!projectData.schemas?.length,
      hasEndpoints: !!projectData.endpoints?.length,
      schemaCount: projectData.schemas?.length || 0,
      endpointCount: projectData.endpoints?.length || 0,
    },
  };

  const prompt = `Analyze this project and determine:
1. Complexity level (simple/moderate/complex)
2. Team size estimation (small/medium/large/enterprise)
3. Budget tier (startup/growth/established/enterprise)
4. All required component types from architecture
5. Essential cross-cutting components to add

Project Context:
${JSON.stringify(context, null, 2)}

Respond with ONLY this JSON structure:
{
  "projectName": "string",
  "complexity": "simple" | "moderate" | "complex",
  "teamSize": "small" | "medium" | "large" | "enterprise",
  "budgetTier": "startup" | "growth" | "established" | "enterprise",
  "componentTypes": ["database", "api-gateway", ...],
  "estimatedComponents": number
}`;

  const { text } = await generateText({
    model: groq(AI_CONFIG.model),
    prompt,
    temperature: options.temperature ?? 0.3,
    maxTokens: options.maxTokens ?? 8000,
  });

  return JSON.parse(text.trim().replace(/^```json\s*/, '').replace(/\s*```$/, ''));
}

// Step 2: Generate tool recommendations for a specific component
async function generateComponentDecision(
  component: string,
  projectContext: any,
  options: GenerateSystemDecisionsOptions
) {
  const prompt = `Generate tool recommendations for: ${component}

Project Context:
${JSON.stringify(projectContext, null, 2)}

Provide 3-5 alternative tools with complete analysis.

Respond with ONLY this JSON structure:
{
  "id": "decision-${component}",
  "title": "string",
  "description": "string",
  "category": "database" | "infrastructure" | "security" | "monitoring" | "deployment" | "analytics",
  "component": "${component}",
  "recommendations": [
    {
      "id": "string",
      "category": "string",
      "component": "${component}",
      "name": "string",
      "type": "open-source" | "commercial" | "managed-service" | "freemium",
      "description": "string (detailed)",
      "pros": ["string", "string", "string"],
      "cons": ["string", "string", "string"],
      "pricing": {
        "model": "free" | "freemium" | "subscription" | "usage-based",
        "cost": "string",
        "details": "string"
      },
      "complexity": "low" | "medium" | "high",
      "popularity": number (0-100),
      "documentation": "Excellent" | "Good" | "Fair",
      "alternatives": ["string"],
      "integration": {
        "effort": "low" | "medium" | "high",
        "timeEstimate": "string",
        "dependencies": ["string"]
      },
      "metadata": {
        "website": "string",
        "github": "string",
        "cloudProvider": "string",
        "supportLevel": "string"
      },
      "enterpriseScore": number (0-100)
    }
  ],
  "selectedTool": "string (ID of best tool)",
  "reasoning": "string (detailed context-aware reasoning)",
  "impact": "low" | "medium" | "high",
  "urgency": "optional" | "recommended" | "critical"
}

Example for database:
{
  "id": "decision-database",
  "title": "Database Selection",
  "description": "Choose database for storing application data",
  "category": "database",
  "component": "database",
  "recommendations": [
    {
      "id": "postgresql",
      "category": "Database",
      "component": "database",
      "name": "PostgreSQL",
      "type": "open-source",
      "description": "Advanced open-source relational database with ACID compliance",
      "pros": ["ACID compliant", "JSON support", "Strong community"],
      "cons": ["Memory intensive", "Complex configuration"],
      "pricing": {"model": "free", "cost": "", "details": "Free, hosting costs vary"},
      "complexity": "medium",
      "popularity": 95,
      "documentation": "Excellent",
      "alternatives": ["MySQL", "Amazon Aurora"],
      "integration": {"effort": "low", "timeEstimate": "1-2 days", "dependencies": ["pg driver"]},
      "metadata": {"website": "https://postgresql.org", "github": "https://github.com/postgres/postgres", "cloudProvider": "", "supportLevel": "community"},
      "enterpriseScore": 88
    }
  ],
  "selectedTool": "postgresql",
  "reasoning": "Best for ACID compliance and complex queries",
  "impact": "high",
  "urgency": "critical"
}`;

  const { text } = await generateText({
    model: groq(AI_CONFIG.model),
    prompt,
    temperature: options.temperature ?? 0.7,
    maxTokens: options.maxTokens ?? 8000,
  });

  return JSON.parse(text.trim().replace(/^```json\s*/, '').replace(/\s*```$/, ''));
}

// Step 3: Generate cost and timeline estimates
async function generateEstimates(
  projectContext: any,
  decisions: any[],
  options: GenerateSystemDecisionsOptions
) {
  const prompt = `Generate cost and timeline estimates.

Project: ${projectContext.projectName}
Complexity: ${projectContext.complexity}
Components: ${projectContext.estimatedComponents}
Decisions: ${decisions.length}

Respond with ONLY this JSON:
{
  "architecture": {
    "complexity": "${projectContext.complexity}",
    "components": ${projectContext.estimatedComponents},
    "estimatedCost": {
      "development": "$X,XXX",
      "monthly": "$XXX",
      "annual": "$X,XXX"
    },
    "timeline": {
      "mvp": "X weeks",
      "production": "X weeks",
      "scale": "X weeks"
    }
  },
  "totalCostEstimate": {
    "development": number,
    "monthlyOperational": number,
    "annualOperational": number
  }
}

Guidelines:
- Simple: $8K-15K dev, $50-100/mo, 4-8 weeks MVP
- Moderate: $15K-30K dev, $100-300/mo, 8-12 weeks MVP
- Complex: $30K-100K dev, $300-1000/mo, 12-24 weeks MVP`;

  const { text } = await generateText({
    model: groq(AI_CONFIG.model),
    prompt,
    temperature: options.temperature ?? 0.5,
    maxTokens: options.maxTokens ?? 8000,
  });

  return JSON.parse(text.trim().replace(/^```json\s*/, '').replace(/\s*```$/, ''));
}

// Step 4: Generate integration plan
async function generateIntegrationPlan(
  decisions: any[],
  options: GenerateSystemDecisionsOptions
) {
  const decisionTitles = decisions.map(d => `${d.title} (${d.urgency})`);
  
  const prompt = `Create a 3-phase integration plan.

Decisions:
${decisionTitles.join('\n')}

Respond with ONLY this JSON:
{
  "integrationPlan": {
    "phase1": ["Decision Title 1", "Decision Title 2"],
    "phase2": ["Decision Title 3", "Decision Title 4"],
    "phase3": ["Decision Title 5"]
  }
}

Rules:
- Phase 1: Critical infrastructure (database, cloud, security)
- Phase 2: Core operations (monitoring, ci-cd, cache, api-gateway)
- Phase 3: Enhancements (analytics, search, cdn)`;

  const { text } = await generateText({
    model: groq(AI_CONFIG.model),
    prompt,
    temperature: options.temperature ?? 0.3,
    maxTokens: options.maxTokens ?? 8000,
  });

  return JSON.parse(text.trim().replace(/^```json\s*/, '').replace(/\s*```$/, ''));
}

// Step 5: Generate risk assessment
async function generateRiskAssessment(
  projectContext: any,
  decisions: any[],
  options: GenerateSystemDecisionsOptions
) {
  const selectedTools = decisions.map(d => `${d.component}: ${d.selectedTool}`);
  
  const prompt = `Assess risks for this technology stack.

Project: ${projectContext.projectName}
Complexity: ${projectContext.complexity}
Tools:
${selectedTools.join('\n')}

Respond with ONLY this JSON:
{
  "riskAssessment": {
    "technical": [
      "Specific technical risk 1",
      "Specific technical risk 2"
    ],
    "operational": [
      "Specific operational risk 1",
      "Specific operational risk 2"
    ],
    "financial": [
      "Specific financial risk 1",
      "Specific financial risk 2"
    ]
  }
}

Provide 2-4 specific, actionable risks per category.`;

  const { text } = await generateText({
    model: groq(AI_CONFIG.model),
    prompt,
    temperature: options.temperature ?? 0.6,
    maxTokens: options.maxTokens ?? 8000,
  });

  return JSON.parse(text.trim().replace(/^```json\s*/, '').replace(/\s*```$/, ''));
}

// Main orchestrator function - simplified to a single AI call to reduce failures
export async function generateSystemDecisions(
  request: GenerateSystemDecisionsRequest
): Promise<SystemDecisionsSummary> {
  try {
    const { architecture, projectData, options = {} } = request;

    console.log('Generating complete system decisions in one AI call...');
    
    const context = {
      architecture: {
        nodes: architecture.nodes.map(n => ({ id: n.id, type: n.type, label: n.data.label })),
        edges: architecture.edges.map(e => ({ source: e.source, target: e.target, label: e.label })),
        componentCount: architecture.nodes.length,
      },
      project: {
        name: projectData.projectName || 'Your Project',
        description: projectData.description || '',
        hasSchemas: !!projectData.schemas?.length,
        hasEndpoints: !!projectData.endpoints?.length,
      },
    };

    const prompt = `${SYSTEM_DECISIONS_PROMPT}\n\nProject Context:\n${JSON.stringify(context, null, 2)}\n\nGenerate a complete system decisions analysis with all tool recommendations, cost estimates, timeline, integration plan, and risk assessment. Output ONLY valid JSON matching the required structure.`;

    const { text } = await generateText({
      model: groq(AI_CONFIG.model),
      prompt,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 8192,
    });

    const cleanedText = text.trim()
      .replace(/^```json\s*/, '')
      .replace(/\s*```$/, '')
      .replace(/^```\s*/, '')
      .trim();

    // Debug logging
    console.log('AI response length:', text.length);
    console.log('Cleaned text preview:', cleanedText.substring(0, 200));
    console.log('Cleaned text ending:', cleanedText.substring(cleanedText.length - 200));

    let result: SystemDecisionsSummary;
    try {
      result = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse text (first 500 chars):', cleanedText.substring(0, 500));
      console.error('Failed to parse text (last 500 chars):', cleanedText.substring(cleanedText.length - 500));
      throw new Error('AI returned incomplete or invalid JSON. The response was cut off. Try reducing the complexity of your architecture or try again.');
    }

    // Basic validation
    if (!result.projectName || !result.architecture || !result.decisions || !result.integrationPlan || !result.totalCostEstimate || !result.riskAssessment) {
      throw new Error('AI response missing required top-level fields');
    }

    return result;
  } catch (error) {
    console.error('System Decisions Generation Error:', error);
    throw new Error(`Failed to generate system decisions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateSystemDecisions(decisions: SystemDecisionsSummary): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!decisions.projectName) errors.push('Missing projectName');
  if (!decisions.architecture) errors.push('Missing architecture');
  if (!decisions.decisions || decisions.decisions.length === 0) {
    errors.push('No decisions generated');
  }
  if (!decisions.integrationPlan) errors.push('Missing integrationPlan');
  if (!decisions.totalCostEstimate) errors.push('Missing totalCostEstimate');
  if (!decisions.riskAssessment) errors.push('Missing riskAssessment');

  decisions.decisions?.forEach((decision, index) => {
    if (!decision.recommendations || decision.recommendations.length < 3) {
      errors.push(`Decision ${index} has fewer than 3 tool recommendations`);
    }
    if (!decision.selectedTool) {
      errors.push(`Decision ${index} (${decision.title}) has no selected tool`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
