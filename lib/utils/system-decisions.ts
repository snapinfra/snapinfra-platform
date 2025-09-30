import { SystemArchitecture } from '@/lib/types/architecture'
import { SystemDecisionsSummary, SystemDecision, ToolRecommendation } from '@/lib/types/system-decisions'

// Comprehensive enterprise tool recommendation database
const toolDatabase: Record<string, ToolRecommendation[]> = {
  'database': [
    {
      id: 'postgresql',
      category: 'Database',
      component: 'database',
      name: 'PostgreSQL',
      type: 'open-source',
      description: 'Advanced open-source relational database with excellent ACID compliance and extensibility',
      pros: ['ACID compliant', 'Rich feature set', 'Strong community', 'Excellent performance', 'JSON support'],
      cons: ['Memory intensive', 'Complex configuration', 'Steeper learning curve'],
      pricing: { model: 'free', details: 'Free to use, hosting costs vary' },
      complexity: 'medium',
      popularity: 95,
      documentation: 'Excellent',
      alternatives: ['MySQL', 'Amazon RDS PostgreSQL', 'Azure Database for PostgreSQL'],
      integration: { effort: 'low', timeEstimate: '1-2 days', dependencies: ['Node.js driver', 'Connection pooling'] },
      metadata: { github: 'https://github.com/postgres/postgres', website: 'https://postgresql.org' }
    },
    {
      id: 'amazon-rds-postgresql',
      category: 'Database',
      component: 'database',
      name: 'Amazon RDS PostgreSQL',
      type: 'managed-service',
      description: 'Fully managed PostgreSQL service with automated backups, scaling, and maintenance',
      pros: ['Fully managed', 'Automated backups', 'Easy scaling', 'Multi-AZ deployment', 'Point-in-time recovery'],
      cons: ['Higher cost', 'AWS vendor lock-in', 'Limited customization'],
      pricing: { model: 'usage-based', cost: '$50-500+/month', details: 'Based on instance size and storage' },
      complexity: 'low',
      popularity: 88,
      documentation: 'Excellent',
      alternatives: ['Google Cloud SQL', 'Azure Database for PostgreSQL'],
      integration: { effort: 'low', timeEstimate: '4-8 hours', dependencies: ['AWS SDK', 'VPC configuration'] },
      metadata: { website: 'https://aws.amazon.com/rds/postgresql/', cloudProvider: 'AWS' }
    },
    {
      id: 'mongodb',
      category: 'Database',
      component: 'database',
      name: 'MongoDB',
      type: 'open-source',
      description: 'Document-oriented NoSQL database with flexible schema and horizontal scaling',
      pros: ['Schema flexibility', 'Horizontal scaling', 'Rich query language', 'Strong ecosystem'],
      cons: ['Memory usage', 'No ACID transactions across documents', 'Learning curve'],
      pricing: { model: 'freemium', details: 'Community edition free, Enterprise features paid' },
      complexity: 'medium',
      popularity: 89,
      documentation: 'Excellent',
      alternatives: ['Amazon DocumentDB', 'Azure Cosmos DB', 'CouchDB'],
      integration: { effort: 'low', timeEstimate: '1-2 days', dependencies: ['MongoDB driver', 'Schema design'] },
      metadata: { github: 'https://github.com/mongodb/mongo', website: 'https://www.mongodb.com' }
    },
    {
      id: 'amazon-aurora',
      category: 'Database',
      component: 'database',
      name: 'Amazon Aurora',
      type: 'managed-service',
      description: 'Cloud-native relational database with MySQL/PostgreSQL compatibility and 5x performance',
      pros: ['High performance', 'Auto-scaling storage', 'Multi-AZ', 'Continuous backup', 'Serverless option'],
      cons: ['AWS vendor lock-in', 'Higher cost than RDS', 'Complex pricing'],
      pricing: { model: 'usage-based', cost: '$100-1000+/month', details: 'Pay for compute, storage, and I/O separately' },
      complexity: 'low',
      popularity: 82,
      documentation: 'Excellent',
      alternatives: ['Google Cloud Spanner', 'Azure SQL Database'],
      integration: { effort: 'low', timeEstimate: '1-2 days', dependencies: ['AWS VPC', 'Parameter groups'] },
      metadata: { website: 'https://aws.amazon.com/aurora/', cloudProvider: 'AWS' }
    },
    {
      id: 'cassandra',
      category: 'Database',
      component: 'database',
      name: 'Apache Cassandra',
      type: 'open-source',
      description: 'Highly scalable, distributed NoSQL database designed for high availability',
      pros: ['Linear scalability', 'No single point of failure', 'Multi-datacenter support', 'High availability'],
      cons: ['Complex operations', 'Eventual consistency', 'Limited query flexibility'],
      pricing: { model: 'free', details: 'Free to use, operational costs for infrastructure' },
      complexity: 'high',
      popularity: 72,
      documentation: 'Good',
      alternatives: ['Amazon Keyspaces', 'Azure Cosmos DB', 'ScyllaDB'],
      integration: { effort: 'high', timeEstimate: '2-4 weeks', dependencies: ['Cluster setup', 'Data modeling', 'Operations training'] },
      metadata: { github: 'https://github.com/apache/cassandra', website: 'https://cassandra.apache.org' }
    }
  ],
  'api-gateway': [
    {
      id: 'kong',
      category: 'API Gateway',
      component: 'api-gateway',
      name: 'Kong Gateway',
      type: 'open-source',
      description: 'Open-source API gateway and microservices management layer',
      pros: ['Plugin ecosystem', 'High performance', 'Kubernetes native', 'Active community'],
      cons: ['Complex setup', 'Resource intensive', 'Learning curve'],
      pricing: { model: 'freemium', details: 'Free tier available, enterprise features require license' },
      complexity: 'high',
      popularity: 82,
      documentation: 'Good',
      alternatives: ['AWS API Gateway', 'Azure API Management', 'Nginx'],
      integration: { effort: 'high', timeEstimate: '1-2 weeks', dependencies: ['Database', 'Load balancer', 'SSL certificates'] },
      metadata: { github: 'https://github.com/Kong/kong', website: 'https://konghq.com', dockerImage: 'kong:latest' }
    },
    {
      id: 'aws-api-gateway',
      category: 'API Gateway',
      component: 'api-gateway',
      name: 'AWS API Gateway',
      type: 'managed-service',
      description: 'Fully managed service for creating, publishing, and managing APIs at scale',
      pros: ['Fully managed', 'Auto-scaling', 'Built-in monitoring', 'AWS integration', 'Pay-per-use'],
      cons: ['AWS vendor lock-in', 'Cold start latency', 'Limited customization'],
      pricing: { model: 'usage-based', cost: '$1-10+/million requests', details: 'Pay per API call + data transfer' },
      complexity: 'low',
      popularity: 90,
      documentation: 'Excellent',
      alternatives: ['Kong', 'Zuul', 'Envoy'],
      integration: { effort: 'low', timeEstimate: '2-4 days', dependencies: ['AWS account', 'Lambda functions', 'IAM roles'] },
      metadata: { website: 'https://aws.amazon.com/api-gateway/', cloudProvider: 'AWS' }
    }
  ],
  'monitoring': [
    {
      id: 'prometheus-grafana',
      category: 'Monitoring',
      component: 'monitoring',
      name: 'Prometheus + Grafana',
      type: 'open-source',
      description: 'Powerful monitoring stack with metrics collection and visualization',
      pros: ['Highly customizable', 'Strong query language', 'Great visualization', 'Active community'],
      cons: ['Complex setup', 'Resource intensive', 'Storage challenges at scale'],
      pricing: { model: 'free', details: 'Free to use, infrastructure costs vary' },
      complexity: 'high',
      popularity: 87,
      documentation: 'Good',
      alternatives: ['Datadog', 'New Relic', 'AWS CloudWatch'],
      integration: { effort: 'high', timeEstimate: '1-2 weeks', dependencies: ['Kubernetes/Docker', 'Service discovery'] },
      metadata: { github: 'https://github.com/prometheus/prometheus', website: 'https://prometheus.io' }
    },
    {
      id: 'datadog',
      category: 'Monitoring',
      component: 'monitoring',
      name: 'Datadog',
      type: 'commercial',
      description: 'Comprehensive monitoring and analytics platform for applications and infrastructure',
      pros: ['Easy setup', 'Rich dashboards', 'AI-powered insights', 'Extensive integrations'],
      cons: ['Expensive at scale', 'Vendor lock-in', 'Data retention limits'],
      pricing: { model: 'subscription', cost: '$15-23/host/month', details: 'Per host pricing with different tiers' },
      complexity: 'low',
      popularity: 92,
      documentation: 'Excellent',
      alternatives: ['New Relic', 'Prometheus + Grafana', 'AWS CloudWatch'],
      integration: { effort: 'low', timeEstimate: '1-2 days', dependencies: ['Agent installation', 'API keys'] },
      metadata: { website: 'https://www.datadoghq.com/', supportLevel: 'commercial' }
    }
  ],
  'cache': [
    {
      id: 'redis',
      category: 'Cache',
      component: 'cache',
      name: 'Redis',
      type: 'open-source',
      description: 'In-memory data structure store used as database, cache, and message broker',
      pros: ['Extremely fast', 'Rich data types', 'Pub/Sub messaging', 'Persistence options'],
      cons: ['Memory intensive', 'Single-threaded', 'Data loss risk'],
      pricing: { model: 'free', details: 'Free to use, hosting/memory costs vary' },
      complexity: 'medium',
      popularity: 93,
      documentation: 'Excellent',
      alternatives: ['Memcached', 'Amazon ElastiCache', 'Azure Cache for Redis'],
      integration: { effort: 'medium', timeEstimate: '2-3 days', dependencies: ['Redis client', 'Connection pooling'] },
      metadata: { github: 'https://github.com/redis/redis', website: 'https://redis.io' }
    },
    {
      id: 'aws-elasticache-redis',
      category: 'Cache',
      component: 'cache',
      name: 'Amazon ElastiCache for Redis',
      type: 'managed-service',
      description: 'Fully managed Redis service with automated failover and backup',
      pros: ['Fully managed', 'Auto-scaling', 'Multi-AZ support', 'Automated backups'],
      cons: ['AWS vendor lock-in', 'Higher cost', 'Limited configuration'],
      pricing: { model: 'usage-based', cost: '$15-200+/month', details: 'Based on node type and data transfer' },
      complexity: 'low',
      popularity: 85,
      documentation: 'Excellent',
      alternatives: ['Redis on EC2', 'Azure Cache for Redis'],
      integration: { effort: 'low', timeEstimate: '4-8 hours', dependencies: ['AWS VPC', 'Security groups'] },
      metadata: { website: 'https://aws.amazon.com/elasticache/redis/', cloudProvider: 'AWS' }
    }
  ],
  'ci-cd': [
    {
      id: 'github-actions',
      category: 'CI/CD',
      component: 'ci-cd',
      name: 'GitHub Actions',
      type: 'freemium',
      description: 'Integrated CI/CD platform built into GitHub repositories',
      pros: ['Tight GitHub integration', 'Easy setup', 'Rich marketplace', 'Free tier for public repos'],
      cons: ['GitHub dependency', 'Limited for complex workflows', 'Pricing for private repos'],
      pricing: { model: 'freemium', cost: '$0.008/minute', details: 'Free for public repos, pay-per-use for private' },
      complexity: 'low',
      popularity: 91,
      documentation: 'Excellent',
      alternatives: ['Jenkins', 'GitLab CI/CD', 'AWS CodePipeline'],
      integration: { effort: 'low', timeEstimate: '1-2 days', dependencies: ['GitHub repository', 'YAML configuration'] },
      metadata: { website: 'https://github.com/features/actions', supportLevel: 'commercial' }
    },
    {
      id: 'jenkins',
      category: 'CI/CD',
      component: 'ci-cd',
      name: 'Jenkins',
      type: 'open-source',
      description: 'Leading open-source automation server for building CI/CD pipelines',
      pros: ['Highly customizable', 'Vast plugin ecosystem', 'Self-hosted', 'Active community'],
      cons: ['Complex setup', 'Maintenance overhead', 'UI feels dated', 'Security concerns'],
      pricing: { model: 'free', details: 'Free to use, infrastructure costs for hosting' },
      complexity: 'high',
      popularity: 78,
      documentation: 'Good',
      alternatives: ['GitHub Actions', 'GitLab CI/CD', 'TeamCity'],
      integration: { effort: 'high', timeEstimate: '1-2 weeks', dependencies: ['Server setup', 'Plugin configuration', 'Security hardening'] },
      metadata: { github: 'https://github.com/jenkinsci/jenkins', website: 'https://www.jenkins.io' }
    },
    {
      id: 'gitlab-cicd',
      category: 'CI/CD',
      component: 'ci-cd',
      name: 'GitLab CI/CD',
      type: 'freemium',
      description: 'Integrated DevOps platform with built-in CI/CD, security scanning, and deployment',
      pros: ['Complete DevOps platform', 'Built-in security scanning', 'Kubernetes integration', 'Self-hosted option'],
      cons: ['Resource intensive', 'Complex for simple projects', 'Learning curve'],
      pricing: { model: 'freemium', cost: '$19-99/user/month', details: 'Free tier available, paid plans for advanced features' },
      complexity: 'medium',
      popularity: 85,
      documentation: 'Excellent',
      alternatives: ['GitHub Actions', 'Azure DevOps', 'CircleCI'],
      integration: { effort: 'medium', timeEstimate: '3-5 days', dependencies: ['GitLab repository', 'Runners setup'] },
      metadata: { website: 'https://about.gitlab.com/stages-devops-lifecycle/continuous-integration/', supportLevel: 'commercial' }
    },
    {
      id: 'aws-codepipeline',
      category: 'CI/CD',
      component: 'ci-cd',
      name: 'AWS CodePipeline',
      type: 'managed-service',
      description: 'Fully managed continuous delivery service for fast and reliable application updates',
      pros: ['AWS native integration', 'Visual workflow', 'Parallel execution', 'Third-party integrations'],
      cons: ['AWS vendor lock-in', 'Limited flexibility', 'Pricing complexity'],
      pricing: { model: 'usage-based', cost: '$1/pipeline/month + $0.002/action', details: 'Pay per active pipeline and action executions' },
      complexity: 'low',
      popularity: 79,
      documentation: 'Excellent',
      alternatives: ['Azure DevOps', 'Google Cloud Build', 'CircleCI'],
      integration: { effort: 'low', timeEstimate: '2-3 days', dependencies: ['AWS services', 'IAM roles', 'S3 buckets'] },
      metadata: { website: 'https://aws.amazon.com/codepipeline/', cloudProvider: 'AWS' }
    }
  ],
  
  // Cloud Infrastructure
  'cloud-provider': [
    {
      id: 'aws',
      category: 'Cloud Infrastructure',
      component: 'cloud-provider',
      name: 'Amazon Web Services (AWS)',
      type: 'managed-service',
      description: 'Leading cloud platform with comprehensive services for computing, storage, and analytics',
      pros: ['Largest service portfolio', 'Global presence', 'Mature ecosystem', 'Enterprise-grade security'],
      cons: ['Complex pricing', 'Steep learning curve', 'Vendor lock-in potential'],
      pricing: { model: 'usage-based', cost: 'Variable', details: 'Pay-as-you-go for most services, reserved instances for discounts' },
      complexity: 'high',
      popularity: 94,
      documentation: 'Excellent',
      alternatives: ['Google Cloud Platform', 'Microsoft Azure', 'Digital Ocean'],
      integration: { effort: 'medium', timeEstimate: '1-2 weeks', dependencies: ['AWS account', 'IAM setup', 'Network configuration'] },
      metadata: { website: 'https://aws.amazon.com', supportLevel: 'enterprise' }
    },
    {
      id: 'gcp',
      category: 'Cloud Infrastructure',
      component: 'cloud-provider',
      name: 'Google Cloud Platform',
      type: 'managed-service',
      description: 'Google\'s cloud platform with strong AI/ML capabilities and competitive pricing',
      pros: ['Strong AI/ML services', 'Competitive pricing', 'Good Kubernetes support', 'BigQuery analytics'],
      cons: ['Smaller ecosystem than AWS', 'Less enterprise adoption', 'Frequent service changes'],
      pricing: { model: 'usage-based', cost: 'Variable', details: 'Generally 20-30% cheaper than AWS for compute and storage' },
      complexity: 'medium',
      popularity: 78,
      documentation: 'Good',
      alternatives: ['AWS', 'Microsoft Azure', 'IBM Cloud'],
      integration: { effort: 'medium', timeEstimate: '1-2 weeks', dependencies: ['GCP account', 'Service accounts', 'VPC setup'] },
      metadata: { website: 'https://cloud.google.com', supportLevel: 'enterprise' }
    },
    {
      id: 'azure',
      category: 'Cloud Infrastructure',
      component: 'cloud-provider',
      name: 'Microsoft Azure',
      type: 'managed-service',
      description: 'Microsoft\'s cloud platform with strong enterprise integration and hybrid capabilities',
      pros: ['Excellent Microsoft integration', 'Strong hybrid cloud', 'Enterprise-focused', 'Good compliance'],
      cons: ['Complex portal interface', 'Service reliability issues', 'Pricing complexity'],
      pricing: { model: 'usage-based', cost: 'Variable', details: 'Competitive with AWS, good discounts for Microsoft customers' },
      complexity: 'medium',
      popularity: 82,
      documentation: 'Good',
      alternatives: ['AWS', 'Google Cloud Platform', 'Oracle Cloud'],
      integration: { effort: 'medium', timeEstimate: '1-2 weeks', dependencies: ['Azure subscription', 'Resource groups', 'Active Directory'] },
      metadata: { website: 'https://azure.microsoft.com', supportLevel: 'enterprise' }
    }
  ],
  
  // Container Orchestration
  'container-orchestration': [
    {
      id: 'kubernetes',
      category: 'Container Orchestration',
      component: 'container-orchestration',
      name: 'Kubernetes',
      type: 'open-source',
      description: 'Industry-standard container orchestration platform for automating deployment and scaling',
      pros: ['Industry standard', 'Highly scalable', 'Cloud agnostic', 'Rich ecosystem'],
      cons: ['Complex setup', 'Steep learning curve', 'Operational overhead'],
      pricing: { model: 'free', details: 'Free to use, managed services have additional costs' },
      complexity: 'high',
      popularity: 96,
      documentation: 'Excellent',
      alternatives: ['Docker Swarm', 'Amazon ECS', 'Azure Container Instances'],
      integration: { effort: 'high', timeEstimate: '2-4 weeks', dependencies: ['Container registry', 'Networking setup', 'Monitoring'] },
      metadata: { github: 'https://github.com/kubernetes/kubernetes', website: 'https://kubernetes.io' }
    },
    {
      id: 'aws-eks',
      category: 'Container Orchestration',
      component: 'container-orchestration',
      name: 'Amazon EKS',
      type: 'managed-service',
      description: 'Fully managed Kubernetes service that makes it easy to run Kubernetes on AWS',
      pros: ['Fully managed control plane', 'AWS integration', 'Auto-scaling', 'Security best practices'],
      cons: ['AWS vendor lock-in', 'Higher cost', 'Still requires Kubernetes knowledge'],
      pricing: { model: 'usage-based', cost: '$0.10/hour per cluster + node costs', details: 'Pay for control plane and worker nodes separately' },
      complexity: 'medium',
      popularity: 88,
      documentation: 'Excellent',
      alternatives: ['Google GKE', 'Azure AKS', 'Self-managed Kubernetes'],
      integration: { effort: 'medium', timeEstimate: '1-2 weeks', dependencies: ['AWS VPC', 'IAM roles', 'Node groups'] },
      metadata: { website: 'https://aws.amazon.com/eks/', cloudProvider: 'AWS' }
    },
    {
      id: 'docker-swarm',
      category: 'Container Orchestration',
      component: 'container-orchestration',
      name: 'Docker Swarm',
      type: 'open-source',
      description: 'Native clustering and orchestration solution for Docker containers',
      pros: ['Simple setup', 'Docker native', 'Easy learning curve', 'Good for small clusters'],
      cons: ['Limited features vs Kubernetes', 'Smaller ecosystem', 'Less enterprise adoption'],
      pricing: { model: 'free', details: 'Free with Docker Engine' },
      complexity: 'low',
      popularity: 65,
      documentation: 'Good',
      alternatives: ['Kubernetes', 'Amazon ECS', 'Nomad'],
      integration: { effort: 'low', timeEstimate: '2-3 days', dependencies: ['Docker Engine', 'Swarm cluster setup'] },
      metadata: { website: 'https://docs.docker.com/engine/swarm/', supportLevel: 'community' }
    }
  ],
  
  // Security Tools
  'security': [
    {
      id: 'vault',
      category: 'Security',
      component: 'security',
      name: 'HashiCorp Vault',
      type: 'open-source',
      description: 'Tool for secrets management, encryption as a service, and privileged access management',
      pros: ['Comprehensive secrets management', 'Encryption as service', 'Multi-cloud support', 'Audit logging'],
      cons: ['Complex setup', 'Learning curve', 'Operational overhead'],
      pricing: { model: 'freemium', details: 'Open source free, enterprise features require license' },
      complexity: 'high',
      popularity: 84,
      documentation: 'Excellent',
      alternatives: ['AWS Secrets Manager', 'Azure Key Vault', 'Google Secret Manager'],
      integration: { effort: 'high', timeEstimate: '2-3 weeks', dependencies: ['High availability setup', 'Unsealing process', 'Backend storage'] },
      metadata: { github: 'https://github.com/hashicorp/vault', website: 'https://www.vaultproject.io' }
    },
    {
      id: 'aws-secrets-manager',
      category: 'Security',
      component: 'security',
      name: 'AWS Secrets Manager',
      type: 'managed-service',
      description: 'Fully managed service for storing and retrieving secrets throughout their lifecycle',
      pros: ['Fully managed', 'Automatic rotation', 'AWS integration', 'Fine-grained access control'],
      cons: ['AWS vendor lock-in', 'Higher cost per secret', 'Limited to AWS ecosystem'],
      pricing: { model: 'usage-based', cost: '$0.40/secret/month + API calls', details: 'Pay per secret stored and API requests' },
      complexity: 'low',
      popularity: 81,
      documentation: 'Excellent',
      alternatives: ['HashiCorp Vault', 'Azure Key Vault', 'Parameter Store'],
      integration: { effort: 'low', timeEstimate: '1-2 days', dependencies: ['AWS SDK', 'IAM policies'] },
      metadata: { website: 'https://aws.amazon.com/secrets-manager/', cloudProvider: 'AWS' }
    },
    {
      id: 'sonarqube',
      category: 'Security',
      component: 'security',
      name: 'SonarQube',
      type: 'freemium',
      description: 'Continuous code quality and security analysis platform',
      pros: ['Comprehensive code analysis', 'Security vulnerability detection', 'Quality gates', 'IDE integration'],
      cons: ['Resource intensive', 'Learning curve for rules', 'False positives'],
      pricing: { model: 'freemium', details: 'Community edition free, commercial editions from $150/year' },
      complexity: 'medium',
      popularity: 87,
      documentation: 'Good',
      alternatives: ['CodeClimate', 'Veracode', 'Checkmarx'],
      integration: { effort: 'medium', timeEstimate: '3-5 days', dependencies: ['Database', 'CI/CD integration', 'Scanner setup'] },
      metadata: { github: 'https://github.com/SonarSource/sonarqube', website: 'https://www.sonarqube.org' }
    }
  ],
  
  // Message Queues
  'message-queue': [
    {
      id: 'rabbitmq',
      category: 'Message Queue',
      component: 'message-queue',
      name: 'RabbitMQ',
      type: 'open-source',
      description: 'Reliable and mature message broker supporting multiple messaging protocols',
      pros: ['Mature and stable', 'Multiple protocols', 'Rich management UI', 'Clustering support'],
      cons: ['Performance limitations', 'Memory usage', 'Complex clustering'],
      pricing: { model: 'free', details: 'Free to use, commercial support available' },
      complexity: 'medium',
      popularity: 86,
      documentation: 'Excellent',
      alternatives: ['Apache Kafka', 'Amazon SQS', 'Redis Pub/Sub'],
      integration: { effort: 'medium', timeEstimate: '2-4 days', dependencies: ['Erlang runtime', 'Clustering setup', 'Message routing'] },
      metadata: { github: 'https://github.com/rabbitmq/rabbitmq-server', website: 'https://www.rabbitmq.com' }
    },
    {
      id: 'apache-kafka',
      category: 'Message Queue',
      component: 'message-queue',
      name: 'Apache Kafka',
      type: 'open-source',
      description: 'Distributed streaming platform designed for high-throughput, fault-tolerant messaging',
      pros: ['High throughput', 'Fault tolerant', 'Stream processing', 'Horizontal scaling'],
      cons: ['Complex setup', 'Operational overhead', 'Learning curve'],
      pricing: { model: 'free', details: 'Free to use, managed services available from cloud providers' },
      complexity: 'high',
      popularity: 91,
      documentation: 'Good',
      alternatives: ['Amazon Kinesis', 'Google Pub/Sub', 'RabbitMQ'],
      integration: { effort: 'high', timeEstimate: '2-4 weeks', dependencies: ['Zookeeper', 'Cluster setup', 'Topic management'] },
      metadata: { github: 'https://github.com/apache/kafka', website: 'https://kafka.apache.org' }
    },
    {
      id: 'aws-sqs',
      category: 'Message Queue',
      component: 'message-queue',
      name: 'Amazon SQS',
      type: 'managed-service',
      description: 'Fully managed message queuing service for decoupling distributed software systems',
      pros: ['Fully managed', 'Scalable', 'Integrated with AWS', 'Pay per use'],
      cons: ['AWS vendor lock-in', 'Limited message size', 'No message ordering in standard queues'],
      pricing: { model: 'usage-based', cost: '$0.40/million requests', details: 'Pay per request, first million requests free monthly' },
      complexity: 'low',
      popularity: 83,
      documentation: 'Excellent',
      alternatives: ['Azure Service Bus', 'Google Pub/Sub', 'RabbitMQ'],
      integration: { effort: 'low', timeEstimate: '1-2 days', dependencies: ['AWS SDK', 'IAM policies'] },
      metadata: { website: 'https://aws.amazon.com/sqs/', cloudProvider: 'AWS' }
    }
  ],
  
  // Search Engine
  'search-engine': [
    {
      id: 'elasticsearch',
      category: 'Search Engine',
      component: 'search-engine',
      name: 'Elasticsearch',
      type: 'freemium',
      description: 'Distributed search and analytics engine built on Apache Lucene',
      pros: ['Powerful search capabilities', 'Real-time analytics', 'Scalable', 'Rich query DSL'],
      cons: ['Memory intensive', 'Complex operations', 'License changes'],
      pricing: { model: 'freemium', details: 'Basic features free, advanced features require subscription' },
      complexity: 'high',
      popularity: 89,
      documentation: 'Good',
      alternatives: ['Apache Solr', 'Amazon OpenSearch', 'Algolia'],
      integration: { effort: 'high', timeEstimate: '2-3 weeks', dependencies: ['JVM setup', 'Cluster configuration', 'Index management'] },
      metadata: { github: 'https://github.com/elastic/elasticsearch', website: 'https://www.elastic.co' }
    },
    {
      id: 'algolia',
      category: 'Search Engine',
      component: 'search-engine',
      name: 'Algolia',
      type: 'commercial',
      description: 'Hosted search API that delivers fast search experiences for web and mobile applications',
      pros: ['Extremely fast', 'Easy integration', 'Great UX features', 'Global CDN'],
      cons: ['Expensive at scale', 'Vendor lock-in', 'Limited customization'],
      pricing: { model: 'freemium', cost: '$0.50/1K searches', details: 'Free tier up to 10K records, pay per search after' },
      complexity: 'low',
      popularity: 76,
      documentation: 'Excellent',
      alternatives: ['Elasticsearch', 'Amazon CloudSearch', 'Swiftype'],
      integration: { effort: 'low', timeEstimate: '2-3 days', dependencies: ['API keys', 'Index configuration'] },
      metadata: { website: 'https://www.algolia.com', supportLevel: 'commercial' }
    }
  ],
  
  // Analytics & Data
  'analytics': [
    {
      id: 'google-analytics',
      category: 'Analytics',
      component: 'analytics',
      name: 'Google Analytics',
      type: 'freemium',
      description: 'Comprehensive web analytics service for tracking website traffic and user behavior',
      pros: ['Comprehensive tracking', 'Free tier generous', 'Google ecosystem integration', 'Rich reporting'],
      cons: ['Privacy concerns', 'Complex interface', 'Data sampling in free tier'],
      pricing: { model: 'freemium', details: 'Free up to 10M hits/month, GA360 starts at $150K/year' },
      complexity: 'medium',
      popularity: 95,
      documentation: 'Excellent',
      alternatives: ['Adobe Analytics', 'Mixpanel', 'Amplitude'],
      integration: { effort: 'low', timeEstimate: '1-2 days', dependencies: ['Tracking code', 'Goal setup'] },
      metadata: { website: 'https://analytics.google.com', supportLevel: 'commercial' }
    },
    {
      id: 'mixpanel',
      category: 'Analytics',
      component: 'analytics',
      name: 'Mixpanel',
      type: 'freemium',
      description: 'Advanced analytics platform focused on user behavior and product analytics',
      pros: ['Event-based tracking', 'Advanced segmentation', 'Real-time data', 'A/B testing'],
      cons: ['Expensive for high volume', 'Learning curve', 'Limited free tier'],
      pricing: { model: 'freemium', cost: '$20+/month', details: 'Free up to 100K monthly tracked users' },
      complexity: 'medium',
      popularity: 79,
      documentation: 'Good',
      alternatives: ['Amplitude', 'Google Analytics', 'Adobe Analytics'],
      integration: { effort: 'medium', timeEstimate: '3-5 days', dependencies: ['Event tracking', 'User identification', 'Funnel setup'] },
      metadata: { website: 'https://mixpanel.com', supportLevel: 'commercial' }
    }
  ],
  
  // Load Balancers
  'load-balancer': [
    {
      id: 'nginx',
      category: 'Load Balancer',
      component: 'load-balancer',
      name: 'NGINX',
      type: 'open-source',
      description: 'High-performance HTTP server and reverse proxy, also functions as load balancer',
      pros: ['High performance', 'Low resource usage', 'Flexible configuration', 'SSL termination'],
      cons: ['Configuration complexity', 'Limited built-in monitoring', 'Manual scaling'],
      pricing: { model: 'free', details: 'Free open source version, NGINX Plus has commercial features' },
      complexity: 'medium',
      popularity: 92,
      documentation: 'Excellent',
      alternatives: ['HAProxy', 'AWS ALB', 'Cloudflare Load Balancing'],
      integration: { effort: 'medium', timeEstimate: '3-5 days', dependencies: ['Server setup', 'SSL certificates', 'Health checks'] },
      metadata: { github: 'https://github.com/nginx/nginx', website: 'https://nginx.org' }
    },
    {
      id: 'aws-alb',
      category: 'Load Balancer',
      component: 'load-balancer',
      name: 'AWS Application Load Balancer',
      type: 'managed-service',
      description: 'Layer 7 load balancer that automatically distributes incoming application traffic',
      pros: ['Fully managed', 'Auto scaling', 'Advanced routing', 'AWS integration'],
      cons: ['AWS vendor lock-in', 'Cost at high traffic', 'Limited customization'],
      pricing: { model: 'usage-based', cost: '$16.20/month + $0.008/LCU-hour', details: 'Fixed monthly cost plus usage-based pricing' },
      complexity: 'low',
      popularity: 87,
      documentation: 'Excellent',
      alternatives: ['NGINX', 'Google Cloud Load Balancer', 'Azure Load Balancer'],
      integration: { effort: 'low', timeEstimate: '1-2 days', dependencies: ['Target groups', 'Security groups', 'SSL certificates'] },
      metadata: { website: 'https://aws.amazon.com/elasticloadbalancing/', cloudProvider: 'AWS' }
    }
  ],
  
  // Content Delivery Network
  'cdn': [
    {
      id: 'cloudflare',
      category: 'CDN',
      component: 'cdn',
      name: 'Cloudflare',
      type: 'freemium',
      description: 'Global CDN with security, performance, and reliability services',
      pros: ['Global network', 'DDoS protection', 'SSL/TLS', 'DNS management', 'Free tier'],
      cons: ['Limited free tier features', 'Complex pricing tiers', 'Potential single point of failure'],
      pricing: { model: 'freemium', cost: '$20-200+/month', details: 'Free tier available, paid plans for advanced features' },
      complexity: 'low',
      popularity: 90,
      documentation: 'Excellent',
      alternatives: ['AWS CloudFront', 'Azure CDN', 'Google Cloud CDN'],
      integration: { effort: 'low', timeEstimate: '1-2 days', dependencies: ['DNS changes', 'SSL setup'] },
      metadata: { website: 'https://www.cloudflare.com', supportLevel: 'commercial' }
    },
    {
      id: 'aws-cloudfront',
      category: 'CDN',
      component: 'cdn',
      name: 'Amazon CloudFront',
      type: 'managed-service',
      description: 'Fast content delivery network service that securely delivers data and applications globally',
      pros: ['AWS integration', 'Edge locations worldwide', 'Origin Shield', 'Real-time metrics'],
      cons: ['AWS vendor lock-in', 'Complex configuration', 'Pricing complexity'],
      pricing: { model: 'usage-based', cost: '$0.085/GB + requests', details: 'Pay for data transfer out and requests' },
      complexity: 'medium',
      popularity: 84,
      documentation: 'Excellent',
      alternatives: ['Cloudflare', 'Azure CDN', 'Google Cloud CDN'],
      integration: { effort: 'medium', timeEstimate: '2-3 days', dependencies: ['S3 origins', 'Distribution setup', 'Cache behaviors'] },
      metadata: { website: 'https://aws.amazon.com/cloudfront/', cloudProvider: 'AWS' }
    }
  ]
}

// Enterprise context for better decision making
interface EnterpriseContext {
  teamSize: 'small' | 'medium' | 'large' | 'enterprise'
  budget: 'startup' | 'growth' | 'established' | 'enterprise'
  complianceNeeds: string[]
  timeToMarket: 'urgent' | 'standard' | 'planned'
  scalabilityNeeds: 'low' | 'medium' | 'high' | 'massive'
  maintenanceCapability: 'limited' | 'moderate' | 'strong'
  riskTolerance: 'low' | 'medium' | 'high'
  existingStack: string[]
}

export function generateSystemDecisions(
  architecture: SystemArchitecture,
  projectData: any
): SystemDecisionsSummary {
  // Analyze project context like a lead architect would
  const enterpriseContext = analyzeEnterpriseContext(architecture, projectData)
  const decisions: SystemDecision[] = []
  
  // Generate decisions for each component
  architecture.nodes.forEach(node => {
    const tools = toolDatabase[node.type] || []
    if (tools.length > 0) {
      const selectedTool = selectRecommendedTool(tools, architecture, projectData, enterpriseContext)
      
      decisions.push({
        id: `decision-${node.type}`,
        title: `${getComponentDisplayName(node.type)} Selection`,
        description: `Choose the best ${node.type} solution for your architecture based on enterprise requirements`,
        category: getCategoryForComponent(node.type),
        component: node.type,
        recommendations: tools.map(tool => ({
          ...tool,
          // Add enterprise scoring
          enterpriseScore: calculateEnterpriseScore(tool, enterpriseContext)
        })),
        selectedTool: selectedTool.id,
        reasoning: generateArchitectReasoning(selectedTool, architecture, projectData, enterpriseContext),
        impact: getImpactLevel(node.type),
        urgency: getUrgencyLevel(node.type, enterpriseContext)
      })
    }
  })

  // Add cross-cutting concerns that every enterprise needs
  const crossCuttingDecisions = generateCrossCuttingDecisions(enterpriseContext, architecture)
  decisions.push(...crossCuttingDecisions)

  // Calculate comprehensive estimates
  const complexity = calculateComplexity(architecture)
  const costEstimate = calculateEnterpriseEstimate(decisions, enterpriseContext)
  const timeline = calculateEnterpriseTimeline(complexity, architecture.nodes.length, enterpriseContext)

  return {
    projectName: projectData.projectName || 'Your Project',
    architecture: {
      complexity,
      components: architecture.nodes.length,
      estimatedCost: {
        development: formatCurrency(costEstimate.development),
        monthly: formatCurrency(costEstimate.monthlyOperational),
        annual: formatCurrency(costEstimate.annualOperational)
      },
      timeline
    },
    decisions,
    integrationPlan: generateEnterpriseIntegrationPlan(decisions, enterpriseContext),
    totalCostEstimate: costEstimate,
    riskAssessment: generateEnterpriseRiskAssessment(decisions, architecture, enterpriseContext)
  }
}

function analyzeEnterpriseContext(architecture: SystemArchitecture, projectData: any): EnterpriseContext {
  // Analyze project characteristics to determine enterprise context
  const nodeCount = architecture.nodes.length
  const description = projectData.description || ''
  
  return {
    teamSize: nodeCount > 15 ? 'enterprise' : nodeCount > 8 ? 'large' : nodeCount > 4 ? 'medium' : 'small',
    budget: detectBudgetTier(description, nodeCount),
    complianceNeeds: detectComplianceRequirements(description),
    timeToMarket: detectTimeToMarket(description),
    scalabilityNeeds: detectScalabilityNeeds(description, nodeCount),
    maintenanceCapability: detectMaintenanceCapability(nodeCount),
    riskTolerance: detectRiskTolerance(description),
    existingStack: detectExistingStack(description)
  }
}

function selectRecommendedTool(
  tools: ToolRecommendation[], 
  architecture: SystemArchitecture,
  projectData: any,
  context: EnterpriseContext
): ToolRecommendation {
  // Score each tool based on enterprise context
  const scoredTools = tools.map(tool => ({
    tool,
    score: calculateEnterpriseScore(tool, context)
  }))
  
  // Sort by score and return the best match
  scoredTools.sort((a, b) => b.score - a.score)
  return scoredTools[0].tool
}

function calculateEnterpriseScore(tool: ToolRecommendation, context: EnterpriseContext): number {
  let score = tool.popularity || 50 // Base score from popularity
  
  // Team size considerations
  if (context.teamSize === 'small' || context.teamSize === 'medium') {
    if (tool.type === 'managed-service') score += 20
    if (tool.complexity === 'low') score += 15
  } else {
    if (tool.type === 'open-source') score += 10
    if (tool.complexity === 'high' && tool.popularity > 80) score += 15
  }
  
  // Budget considerations
  if (context.budget === 'startup') {
    if (tool.pricing.model === 'free') score += 25
    if (tool.pricing.model === 'freemium') score += 15
    if (tool.type === 'open-source') score += 20
  } else if (context.budget === 'enterprise') {
    if (tool.type === 'commercial' || tool.type === 'managed-service') score += 15
    if (tool.metadata.supportLevel === 'enterprise') score += 20
  }
  
  // Compliance considerations
  if (context.complianceNeeds.length > 0) {
    if (tool.type === 'managed-service') score += 15 // Usually better compliance
    if (tool.metadata.cloudProvider) score += 10 // Cloud providers often have compliance certifications
  }
  
  // Time to market
  if (context.timeToMarket === 'urgent') {
    if (tool.complexity === 'low') score += 20
    if (tool.integration.effort === 'low') score += 15
    if (tool.type === 'managed-service') score += 15
  }
  
  // Scalability needs
  if (context.scalabilityNeeds === 'high' || context.scalabilityNeeds === 'massive') {
    if (tool.type === 'managed-service') score += 15
    if (tool.metadata.cloudProvider) score += 10
  }
  
  // Maintenance capability
  if (context.maintenanceCapability === 'limited') {
    if (tool.type === 'managed-service') score += 25
    if (tool.complexity === 'low') score += 15
  }
  
  // Risk tolerance
  if (context.riskTolerance === 'low') {
    if (tool.popularity > 85) score += 15
    if (tool.type === 'managed-service') score += 10
    if (tool.documentation === 'Excellent') score += 10
  }
  
  return Math.max(0, Math.min(100, score))
}

// Helper functions for enterprise context detection
function detectBudgetTier(description: string, nodeCount: number): EnterpriseContext['budget'] {
  if (/startup|mvp|bootstrap|limited budget/i.test(description)) return 'startup'
  if (/enterprise|large company|corporation/i.test(description)) return 'enterprise'
  if (/scale|growth|expanding/i.test(description)) return 'growth'
  return nodeCount > 12 ? 'enterprise' : nodeCount > 6 ? 'established' : 'startup'
}

function detectComplianceRequirements(description: string): string[] {
  const compliance = []
  if (/hipaa|health|medical/i.test(description)) compliance.push('HIPAA')
  if (/pci|payment|financial|banking/i.test(description)) compliance.push('PCI DSS')
  if (/soc2|security|audit/i.test(description)) compliance.push('SOC 2')
  if (/gdpr|privacy|europe/i.test(description)) compliance.push('GDPR')
  if (/iso|compliance|regulation/i.test(description)) compliance.push('ISO 27001')
  return compliance
}

function detectTimeToMarket(description: string): EnterpriseContext['timeToMarket'] {
  if (/urgent|asap|quickly|fast|rush/i.test(description)) return 'urgent'
  if (/planned|roadmap|future|long.term/i.test(description)) return 'planned'
  return 'standard'
}

function detectScalabilityNeeds(description: string, nodeCount: number): EnterpriseContext['scalabilityNeeds'] {
  if (/massive|millions|global|huge/i.test(description)) return 'massive'
  if (/scale|high.traffic|load|performance/i.test(description)) return 'high'
  if (/small|simple|basic/i.test(description)) return 'low'
  return nodeCount > 10 ? 'high' : nodeCount > 6 ? 'medium' : 'low'
}

function detectMaintenanceCapability(nodeCount: number): EnterpriseContext['maintenanceCapability'] {
  return nodeCount > 12 ? 'strong' : nodeCount > 6 ? 'moderate' : 'limited'
}

function detectRiskTolerance(description: string): EnterpriseContext['riskTolerance'] {
  if (/safe|stable|reliable|proven/i.test(description)) return 'low'
  if (/experiment|innovative|cutting.edge/i.test(description)) return 'high'
  return 'medium'
}

function detectExistingStack(description: string): string[] {
  const stack = []
  if (/aws|amazon/i.test(description)) stack.push('AWS')
  if (/azure|microsoft/i.test(description)) stack.push('Azure')
  if (/gcp|google cloud/i.test(description)) stack.push('GCP')
  if (/kubernetes|k8s/i.test(description)) stack.push('Kubernetes')
  if (/docker/i.test(description)) stack.push('Docker')
  return stack
}

function generateCrossCuttingDecisions(context: EnterpriseContext, architecture: SystemArchitecture): SystemDecision[] {
  const decisions: SystemDecision[] = []
  
  // Every enterprise needs these
  const essentialComponents = [
    'cloud-provider',
    'container-orchestration',
    'security',
    'message-queue',
    'analytics'
  ]
  
  essentialComponents.forEach(component => {
    const existingNode = architecture.nodes.find(n => n.type === component)
    if (!existingNode && toolDatabase[component]) {
      const tools = toolDatabase[component]
      const selectedTool = selectRecommendedTool(tools, architecture, {}, context)
      
      decisions.push({
        id: `decision-${component}`,
        title: `${getComponentDisplayName(component)} Selection`,
        description: `Essential ${component} component for enterprise architecture`,
        category: getCategoryForComponent(component),
        component,
        recommendations: tools.map(tool => ({
          ...tool,
          enterpriseScore: calculateEnterpriseScore(tool, context)
        })),
        selectedTool: selectedTool.id,
        reasoning: generateArchitectReasoning(selectedTool, architecture, {}, context),
        impact: getImpactLevel(component),
        urgency: getUrgencyLevel(component, context)
      })
    }
  })
  
  return decisions
}

function generateArchitectReasoning(
  tool: ToolRecommendation,
  architecture: SystemArchitecture,
  projectData: any,
  context: EnterpriseContext
): string {
  const reasons = []
  
  // Team-based reasoning
  if (context.teamSize === 'small' && tool.type === 'managed-service') {
    reasons.push(`Managed service reduces operational overhead for ${context.teamSize} teams`)
  } else if (context.teamSize === 'large' && tool.type === 'open-source') {
    reasons.push(`Open-source solution provides flexibility needed for ${context.teamSize} engineering teams`)
  }
  
  // Budget-based reasoning
  if (context.budget === 'startup' && tool.pricing.model === 'free') {
    reasons.push('Cost-effective solution aligned with startup budget constraints')
  } else if (context.budget === 'enterprise' && tool.metadata.supportLevel === 'enterprise') {
    reasons.push('Enterprise-grade support and SLAs justify the investment')
  }
  
  // Compliance reasoning
  if (context.complianceNeeds.length > 0) {
    reasons.push(`Meets ${context.complianceNeeds.join(', ')} compliance requirements`)
  }
  
  // Time to market
  if (context.timeToMarket === 'urgent' && tool.complexity === 'low') {
    reasons.push('Quick setup enables faster time to market')
  }
  
  // Scalability
  if (context.scalabilityNeeds === 'high' && tool.type === 'managed-service') {
    reasons.push('Auto-scaling capabilities handle high-traffic demands')
  }
  
  // Risk tolerance
  if (context.riskTolerance === 'low' && tool.popularity > 85) {
    reasons.push('Proven solution with strong community and track record')
  }
  
  if (reasons.length === 0) {
    return `Selected based on balanced evaluation of technical requirements and enterprise constraints.`
  }
  
  return reasons.join('. ') + '.'
}

function calculateEnterpriseEstimate(decisions: SystemDecision[], context: EnterpriseContext) {
  let baseDevelopmentCost = context.teamSize === 'enterprise' ? 50000 : 
                            context.teamSize === 'large' ? 30000 : 
                            context.teamSize === 'medium' ? 15000 : 8000
  
  let baseOperationalCost = context.budget === 'enterprise' ? 500 : 
                            context.budget === 'established' ? 200 : 
                            context.budget === 'growth' ? 100 : 50
  
  decisions.forEach(decision => {
    const selectedTool = decision.recommendations.find(r => r.id === decision.selectedTool)
    if (selectedTool) {
      // Development cost multipliers
      const effortMultiplier = selectedTool.integration.effort === 'high' ? 1.5 : 
                              selectedTool.integration.effort === 'medium' ? 1.2 : 1.0
      
      baseDevelopmentCost *= effortMultiplier
      
      // Operational cost additions
      if (selectedTool.pricing.model === 'subscription' && selectedTool.pricing.cost) {
        const match = selectedTool.pricing.cost.match(/\$(\d+)/)
        if (match) baseOperationalCost += parseInt(match[1]) * 0.8 // Enterprise discounts
      } else if (selectedTool.pricing.model === 'usage-based') {
        baseOperationalCost += context.scalabilityNeeds === 'massive' ? 200 : 
                              context.scalabilityNeeds === 'high' ? 100 : 30
      }
    }
  })
  
  return {
    development: Math.round(baseDevelopmentCost),
    monthlyOperational: Math.round(baseOperationalCost),
    annualOperational: Math.round(baseOperationalCost * 12 * 0.9) // Annual discount
  }
}

function calculateEnterpriseTimeline(
  complexity: string, 
  componentCount: number, 
  context: EnterpriseContext
) {
  let baseWeeks = complexity === 'simple' ? 6 : complexity === 'moderate' ? 12 : 24
  
  // Adjust for team size
  const teamMultiplier = context.teamSize === 'enterprise' ? 0.7 : 
                        context.teamSize === 'large' ? 0.8 : 
                        context.teamSize === 'medium' ? 1.0 : 1.3
  
  // Adjust for urgency
  const urgencyMultiplier = context.timeToMarket === 'urgent' ? 0.8 : 
                           context.timeToMarket === 'planned' ? 1.2 : 1.0
  
  baseWeeks = Math.round(baseWeeks * teamMultiplier * urgencyMultiplier)
  
  return {
    mvp: `${baseWeeks} weeks`,
    production: `${baseWeeks + Math.floor(componentCount / 2)} weeks`,
    scale: `${baseWeeks + componentCount} weeks`
  }
}

function generateEnterpriseIntegrationPlan(decisions: SystemDecision[], context: EnterpriseContext) {
  const critical = decisions.filter(d => d.urgency === 'critical' || 
    ['database', 'cloud-provider', 'security'].includes(d.component)).map(d => d.title)
  
  const recommended = decisions.filter(d => d.urgency === 'recommended' || 
    ['monitoring', 'ci-cd', 'container-orchestration'].includes(d.component)).map(d => d.title)
  
  const optional = decisions.filter(d => !critical.includes(d.title) && 
    !recommended.includes(d.title)).map(d => d.title)
  
  return {
    phase1: critical.slice(0, 5), // Focus on essentials first
    phase2: recommended.slice(0, 6),
    phase3: [...optional, ...critical.slice(5), ...recommended.slice(6)]
  }
}

function generateEnterpriseRiskAssessment(
  decisions: SystemDecision[], 
  architecture: SystemArchitecture, 
  context: EnterpriseContext
) {
  const technical = []
  const operational = []
  const financial = []
  
  // Compliance risks
  if (context.complianceNeeds.length > 0) {
    const hasCompliantTools = decisions.some(d => 
      d.recommendations.find(r => r.id === d.selectedTool)?.type === 'managed-service'
    )
    if (!hasCompliantTools) {
      technical.push('Self-managed tools may not meet compliance requirements')
      operational.push('Additional compliance audits and certifications needed')
    }
  }
  
  // Vendor lock-in risks
  const cloudProviders = new Set()
  decisions.forEach(d => {
    const tool = d.recommendations.find(r => r.id === d.selectedTool)
    if (tool?.metadata.cloudProvider) cloudProviders.add(tool.metadata.cloudProvider)
  })
  
  if (cloudProviders.size === 1) {
    operational.push(`Single cloud provider dependency creates vendor lock-in risk`)
    financial.push('Pricing changes from single vendor could impact costs significantly')
  }
  
  // Team capability risks
  if (context.teamSize === 'small' || context.maintenanceCapability === 'limited') {
    const complexTools = decisions.filter(d => 
      d.recommendations.find(r => r.id === d.selectedTool)?.complexity === 'high'
    )
    if (complexTools.length > 2) {
      technical.push('Multiple complex tools may exceed team maintenance capacity')
      operational.push('Consider managed alternatives to reduce operational burden')
    }
  }
  
  // Budget and scaling risks
  if (context.budget === 'startup' && context.scalabilityNeeds === 'high') {
    financial.push('Rapid scaling may lead to unexpected cost increases')
    operational.push('Plan for cost monitoring and budget alerts')
  }
  
  return { technical, operational, financial }
}

function calculateComplexity(architecture: SystemArchitecture): 'simple' | 'moderate' | 'complex' {
  const nodeCount = architecture.nodes.length
  const edgeCount = architecture.edges.length
  
  if (nodeCount <= 6 && edgeCount <= 8) return 'simple'
  if (nodeCount <= 12 && edgeCount <= 18) return 'moderate'
  return 'complex'
}

function calculateCostEstimate(decisions: SystemDecision[]) {
  let developmentCost = 20000 // Base development cost
  let monthlyOperational = 100 // Base operational cost
  
  decisions.forEach(decision => {
    const selectedTool = decision.recommendations.find(r => r.id === decision.selectedTool)
    if (selectedTool) {
      // Add development cost based on integration effort
      if (selectedTool.integration.effort === 'high') developmentCost += 5000
      else if (selectedTool.integration.effort === 'medium') developmentCost += 2000
      else developmentCost += 500
      
      // Add operational cost (rough estimates)
      if (selectedTool.pricing.model === 'subscription' && selectedTool.pricing.cost) {
        const match = selectedTool.pricing.cost.match(/\$(\d+)/)
        if (match) monthlyOperational += parseInt(match[1])
      } else if (selectedTool.pricing.model === 'usage-based' && selectedTool.pricing.cost) {
        monthlyOperational += 50 // Estimated usage cost
      }
    }
  })
  
  return {
    development: developmentCost,
    monthlyOperational,
    annualOperational: monthlyOperational * 12
  }
}

function calculateTimeline(complexity: string, componentCount: number) {
  const baseWeeks = complexity === 'simple' ? 4 : complexity === 'moderate' ? 8 : 16
  const additionalWeeks = Math.floor(componentCount / 3)
  
  return {
    mvp: `${baseWeeks} weeks`,
    production: `${baseWeeks + additionalWeeks} weeks`,
    scale: `${baseWeeks + additionalWeeks + 4} weeks`
  }
}

function generateIntegrationPlan(decisions: SystemDecision[]) {
  const critical = decisions.filter(d => d.urgency === 'critical').map(d => d.title)
  const recommended = decisions.filter(d => d.urgency === 'recommended').map(d => d.title)
  const optional = decisions.filter(d => d.urgency === 'optional').map(d => d.title)
  
  return {
    phase1: critical,
    phase2: recommended,
    phase3: optional
  }
}

function generateRiskAssessment(decisions: SystemDecision[], architecture: SystemArchitecture) {
  const technical = []
  const operational = []
  const financial = []
  
  const hasOpenSource = decisions.some(d => 
    d.recommendations.find(r => r.id === d.selectedTool)?.type === 'open-source'
  )
  
  if (hasOpenSource) {
    technical.push('Open-source tools require more maintenance and expertise')
    operational.push('Community support may have limitations')
  }
  
  if (architecture.nodes.length > 10) {
    technical.push('Complex architecture increases integration challenges')
    operational.push('More components mean more potential failure points')
    financial.push('Scaling costs may increase rapidly')
  }
  
  return { technical, operational, financial }
}

function generateReasoning(tool: ToolRecommendation, architecture: SystemArchitecture, projectData: any): string {
  const complexity = calculateComplexity(architecture)
  
  if (tool.type === 'managed-service') {
    return `Recommended for ${complexity} projects due to reduced operational overhead and built-in scaling capabilities.`
  } else if (tool.type === 'open-source') {
    return `Selected for flexibility and cost-effectiveness, suitable for ${complexity} architectures with technical expertise.`
  } else {
    return `Balanced choice offering good features with commercial support for reliable operations.`
  }
}

function getComponentDisplayName(type: string): string {
  const names = {
    'database': 'Database',
    'api-gateway': 'API Gateway',
    'monitoring': 'Monitoring Solution',
    'cache': 'Caching Layer',
    'ci-cd': 'CI/CD Pipeline',
    'logging': 'Logging System',
    'search-engine': 'Search Engine',
    'cloud-provider': 'Cloud Infrastructure',
    'container-orchestration': 'Container Orchestration',
    'security': 'Security & Secrets Management',
    'message-queue': 'Message Queue',
    'analytics': 'Analytics Platform',
    'load-balancer': 'Load Balancer',
    'cdn': 'Content Delivery Network'
  }
  return names[type as keyof typeof names] || type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function getCategoryForComponent(type: string): SystemDecision['category'] {
  const categoryMap = {
    'database': 'database',
    'api-gateway': 'infrastructure',
    'monitoring': 'monitoring',
    'cache': 'infrastructure',
    'ci-cd': 'deployment',
    'logging': 'monitoring',
    'search-engine': 'database',
    'cloud-provider': 'infrastructure',
    'container-orchestration': 'infrastructure',
    'security': 'security',
    'message-queue': 'infrastructure',
    'analytics': 'analytics',
    'load-balancer': 'infrastructure',
    'cdn': 'infrastructure'
  } as const
  
  return categoryMap[type as keyof typeof categoryMap] || 'infrastructure'
}

function getImpactLevel(type: string): 'low' | 'medium' | 'high' {
  const highImpact = ['database', 'api-gateway', 'monitoring', 'cloud-provider', 'security']
  const mediumImpact = ['cache', 'ci-cd', 'logging', 'container-orchestration', 'message-queue']
  
  if (highImpact.includes(type)) return 'high'
  if (mediumImpact.includes(type)) return 'medium'
  return 'low'
}

function getUrgencyLevel(type: string, context?: EnterpriseContext): 'optional' | 'recommended' | 'critical' {
  const critical = ['database', 'cloud-provider']
  const recommended = ['monitoring', 'ci-cd', 'cache', 'security', 'api-gateway']
  
  // Adjust urgency based on enterprise context
  if (context) {
    if (context.complianceNeeds.length > 0 && type === 'security') return 'critical'
    if (context.scalabilityNeeds === 'high' && type === 'container-orchestration') return 'critical'
    if (context.timeToMarket === 'urgent' && type === 'ci-cd') return 'critical'
  }
  
  if (critical.includes(type)) return 'critical'
  if (recommended.includes(type)) return 'recommended'
  return 'optional'
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}