# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
用中文回答我

## Development Commands

### Core Commands
- `npm run dev` - Start development server
- `npm run build` - Build the application (includes Prisma generate)
- `npm run lint` - Run Next.js linter
- `npm start` - Start production server

### Database & Prisma Commands
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:push` - Push schema changes to database
- `npm run prisma:studio` - Open Prisma Studio (uses .env.development)
- `npm run studio` - Open Prisma Studio

### Utility Scripts
- `npm run cron` - Run cron scheduler
- `npm run cron:once` - Run cron scheduler once
- `npm run reset:credits` - Reset user credits
- `npm run test:db` - Test database connectivity
- `npm run test:db:cleanup` - Test database with cleanup
- `npm run test:db:verbose` - Verbose database test

## Project Architecture

This is a Next.js 14+ application built with TypeScript and Prisma ORM, using PostgreSQL database. It's an AI service platform with user management, credit/token system, and payment processing.

### Key Components

**Database Layer (Prisma)**
- Schema in `prisma/schema.prisma` - comprehensive PostgreSQL schema with users, packages, orders, wallets, API keys, usage tracking
- Primary models: User, Package, Order, Wallet, ApiKey, UsageRecord, CreditTransaction
- Uses UUID primary keys and proper foreign key relationships

**Service Layer (`app/service/`)**
- `creditManager.ts` - Credit/token management and consumption
- `packageManager.ts` - Package subscription management
- `orderProcessor.ts` - Payment and order processing
- `user.ts` - User management operations
- `cronJobs.ts` - Background task scheduling

**API Layer (`app/api/`)**
- RESTful API structure with route handlers
- Admin endpoints under `app/api/admin/`
- User-facing endpoints for packages, credits, orders, dashboard
- Authentication integrated with NextAuth

**Models (`app/models/`)**
- Database model interfaces and types
- Validation and data transformation logic
- Centralized database connection management in `db.ts`

**Authentication (`app/auth/`)**
- NextAuth configuration in `config.ts`
- Email/password and OAuth provider support
- Custom user registration and login flows

### Key Features

**Credit/Token System**
- Dual token system: package tokens (subscription-based) and independent tokens
- Daily quota resets for package subscribers
- Comprehensive usage tracking and billing

**Package Management**
- Subscription packages with different credit allowances
- Package activation/renewal workflows
- Order processing and payment integration

**API Key Management**
- User-generated API keys for external access
- Usage tracking per API key
- Rate limiting and quota enforcement

**Admin Interface**
- User management and credit adjustment
- System statistics and monitoring
- Audit logging for administrative actions

### Database Notes
- Uses PostgreSQL with Supabase
- All timestamps use `@db.Timestamptz` for timezone awareness
- Proper indexing for performance-critical queries
- Comprehensive foreign key relationships with appropriate cascade behaviors

### Development Notes
- TypeScript strict mode enabled
- Environment-specific database URLs (DATABASE_URL and DIRECT_URL)
- Cron job scheduling for maintenance tasks
- Extensive error handling and logging throughout services