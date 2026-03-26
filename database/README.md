# PeakPurse Database

This directory contains all database-related files for the PeakPurse platform.

## Structure

```
database/
├── migrations/          # TypeORM migration files
├── seeds/              # Database seed files
├── schemas/            # Database schema definitions
└── scripts/            # Utility scripts for database management
```

## Database Schema

The PeakPurse platform uses PostgreSQL as the primary database with the following key entities:

### Core Entities

- **Users** - User accounts and authentication
- **Accounts** - Bank accounts, credit cards, wallets, UPI handles
- **Transactions** - Financial transactions with categorization
- **Categories** - Hierarchical expense/income categories
- **Budgets** - Monthly spending limits per category
- **Goals** - Financial goals with feasibility analysis
- **Health Scores** - Financial health score snapshots
- **Subscriptions** - Detected recurring charges
- **Tax Profiles** - Per-FY tax information
- **CA Profiles** - Chartered accountant directory
- **Cohorts** - Benchmarking cohort definitions
- **Investment Plans** - Goal-based investment recommendations

### Relationships

- Users have multiple Accounts and Transactions
- Transactions belong to Accounts and Categories
- Budgets are per User per Category
- Goals are linked to Users and optional Categories
- Health Scores are computed per User
- Subscriptions are detected from User Transactions
- Tax Profiles are per User per Financial Year
- Investment Plans are linked to Goals

## Migration Management

### Creating a New Migration

```bash
# From backend directory
npm run migration:generate -- -n CreateNewTable
```

### Running Migrations

```bash
# Run all pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Seeding Data

```bash
# Run all seed files
npm run seed
```

## Environment Setup

Ensure your `.env` file has the correct database configuration:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=peakpurse_user
DB_PASSWORD=your_password_here
DB_DATABASE=peakpurse_dev
```

## Database Connection

The application uses TypeORM with PostgreSQL. Connection configuration is managed in the backend application.

## Development Workflow

1. Create migration file for schema changes
2. Run migration to update database
3. Update entity files in backend
4. Add seed data if needed
5. Test with development database

## Production Considerations

- Use read replicas for reporting queries
- Implement proper indexing for performance
- Set up connection pooling
- Configure backup strategies
- Monitor slow queries

## Backup and Recovery

Regular backups should be scheduled. Recovery procedures should be tested regularly.

## Performance Optimization

- Add indexes on frequently queried columns
- Use database partitioning for large tables
- Implement proper connection pooling
- Cache frequently accessed data in Redis
