# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Repository overview
- Two parts:
  - Frontend: Next.js 14 app in repository root (app/ directory).
  - Backend: Express + TypeScript API under backend/ with AWS SDK and CDK infra.
- Package managers:
  - Frontend uses pnpm (pnpm-lock.yaml at root).
  - Backend uses npm (package-lock.json under backend/).

Common commands
- Frontend (Next.js, run from repo root)
  - Install deps: pnpm install
  - Dev server: pnpm dev
  - Lint: pnpm lint
  - Build: pnpm build
  - Start (prod): pnpm start
  - AI test script (if needed): pnpm test:ai

- Backend (Express API, run from repo root without changing directories)
  - Install deps: npm install --prefix backend
  - Dev server (hot-reload): npm run --prefix backend dev
  - Lint: npm run --prefix backend lint
  - Format: npm run --prefix backend format
  - Build: npm run --prefix backend build
  - Start (prod): npm run --prefix backend start
  - Tests (Jest)
    - All tests: npm test --prefix backend
    - Single file: npx --prefix backend jest backend/src/path/to/your.test.ts
    - By name pattern: npx --prefix backend jest -t "test name substring"

- AWS CDK (infrastructure under backend/aws/cdk)
  - Bootstrap (one-time per account/region): npx --prefix backend cdk bootstrap
  - Diff: npx --prefix backend cdk diff --app "npx tsx aws/cdk/app.ts"
  - Deploy: npm run --prefix backend deploy
    - Equivalent: npx --prefix backend cdk deploy --app "npx tsx aws/cdk/app.ts"
  - Destroy (destructive): npx --prefix backend cdk destroy --app "npx tsx aws/cdk/app.ts"

High-level architecture
- Frontend (Next.js 14)
  - App Router pages under app/ (e.g., dashboard, onboarding, schema, pitchdeck, test-ai).
  - Tailwind CSS and Radix UI components are used for UI.
  - Groq-powered AI features; configure with GROQ_API_KEY in .env.local.
  - No Next.js rewrites are configured (next.config.mjs), so the app calls the backend via its URL (default http://localhost:5000).

- Backend (Express + TypeScript)
  - Entry point: backend/src/server.ts
    - Middleware: helmet, compression, cors, morgan, JSON/urlencoded parsers.
    - Custom middleware:
      - backend/src/middleware/errorHandler.ts for centralized error handling and async wrapper.
      - backend/src/middleware/rateLimiter.ts simple in-memory rate limiter with headers.
      - backend/src/middleware/authMiddleware.ts provides devAuth, authenticateToken (JWT/Cognito-ready), optionalAuth, helpers like getCurrentUserId.
    - Routes mounted under /api:
      - /api/health (backend/src/routes/health.ts): basic and detailed health checks (reports AWS/AI config presence, memory, uptime).
      - /api/auth (backend/src/routes/auth.ts): placeholders for Cognito-backed auth.
      - /api/projects (backend/src/routes/projects.ts): CRUD, search, stats, batch operations; guarded by devAuth in development.
      - /api/ai (backend/src/routes/ai.ts): text generation, streaming SSE, code/schema generation, code explanation, model listing, health.
      - /api/deployments (backend/src/routes/deployments.ts): deployment placeholders.
  - Services layer
    - AIService (backend/src/services/ai/aiService.ts): provider-agnostic orchestration across Groq, OpenAI, and AWS Bedrock with standard and streaming methods; specialized helpers for code/schema generation and explanations; health checks that probe providers.
    - DynamoService (backend/src/services/database/dynamoService.ts): typed operations for Users, Projects, Schemas, Deployments using DynamoDBDocumentClient; includes batch, search, stats, and health checks.
  - AWS config and constants
    - backend/src/utils/awsConfig.ts centralizes AWS clients (DynamoDB, S3, Cognito, Bedrock, SQS, SNS), table/bucket/queue/topic names, and Bedrock/Cognito config, all driven by environment variables.
    - backend/src/utils/validateEnv.ts validates required and warns on optional variables at startup.
  - Types and contracts
    - backend/src/types/index.ts defines domain models (User, Project, Schema, Deployment, enums), AI request/response contracts, and request typing (AuthenticatedRequest).

- Infrastructure as Code (AWS CDK)
  - Location: backend/aws/cdk
  - App: app.ts wires the RhinoBackStack with tags and env.
  - Stack: rhinoback-stack.ts provisions:
    - DynamoDB tables (projects, users, schemas, deployments) with pay-per-request and practical keys.
    - S3 bucket for storage with CORS and lifecycle suited for dev.
    - Cognito User Pool + Client.
    - SQS queues (code-generation with DLQ, deployment).
    - SNS topic for deployment notifications.
    - IAM role with policies for backend access to DynamoDB, S3, Bedrock, SQS, SNS.
  - CDK CfnOutputs expose IDs to copy into backend/.env.

Environment configuration
- Frontend (root)
  - Copy .env.example to .env.local and set:
    - GROQ_API_KEY (required for AI features in the UI)
    - Optional tuning: AI_MODEL, AI_TEMPERATURE, AI_MAX_TOKENS, AI_TOP_P (as documented in README.md)

- Backend (backend/)
  - Copy backend/.env.example to backend/.env
  - Required minimum for local dev per validateEnv():
    - AWS_REGION
    - JWT_SECRET
  - Common/optional variables used across services (see backend/README.md and awsConfig.ts):
    - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
    - GROQ_API_KEY, OPENAI_API_KEY
    - BEDROCK_MODEL_ID, BEDROCK_REGION
    - DYNAMODB_* table names, S3_* bucket config
    - COGNITO_* identifiers
    - SQS_* queue URLs, SNS_* topic names
  - CORS default: http://localhost:3000 (configured in server.ts)

Important docs to reference
- Frontend: README.md (root) — setup, pnpm, env vars, and deployment notes.
- Backend:
  - backend/README.md — commands, endpoints, env vars, and AWS services list.
  - backend/AWS_SETUP.md — step-by-step AWS and CDK setup.
  - backend/IMPLEMENTATION_STATUS.md — what’s complete vs. pending.
  - backend/NEXT_STEPS.md — immediate next actions and dev workflow.

Notes for future automation in Warp
- Prefer using pnpm for frontend tasks at repo root; use npm (or --prefix) for backend tasks.
- When running both apps locally during development:
  - Frontend: http://localhost:3000 (pnpm dev)
  - Backend API: http://localhost:5000 (npm run --prefix backend dev)
- Jest tests are scoped to the backend. Use the --prefix pattern above to target that workspace.
