# Database Migration Guide: MySQL to PostgreSQL

This document describes the migration from MySQL to PostgreSQL and the current database implementation.

## 🔄 Migration Overview

The Construction Site Management System has been **migrated from MySQL to PostgreSQL** for better compatibility with modern deployment platforms like Supabase.

## 📊 Current Database System

### PostgreSQL Implementation
- **Database**: PostgreSQL 12+
- **Connection**: pg (node-postgres) with connection pooling
- **Schema**: Automatically initialized on startup
- **Variance Calculations**: Handled in application logic (controllers)

### Key Changes from MySQL

1. **No Database Triggers**: Variance calculations moved to application controllers
2. **PostgreSQL Syntax**: All queries use PostgreSQL-specific syntax ($1, $2 placeholders)
3. **Connection Pooling**: Proper PostgreSQL connection pool management
4. **Data Types**: PostgreSQL-native data types (SERIAL, TIMESTAMP, etc.)

## 🗄️ Database Schema

### Schema Location
- **File**: `src/config/postgresql_schema.sql`
- **Auto-initialization**: Schema created automatically on first startup

### Core Tables
```sql
-- Users with profile image support
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'manager',
    is_active BOOLEAN DEFAULT TRUE,
    profile_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sites with budget limits
CREATE TABLE IF NOT EXISTS sites (
    site_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    budget_limit DECIMAL(15,2),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12 Construction Categories
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 1
);

-- Estimates with status tracking
CREATE TABLE IF NOT EXISTS estimates (
    estimate_id SERIAL PRIMARY KEY,
    site_id INTEGER REFERENCES sites(site_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Estimate items with categories
CREATE TABLE IF NOT EXISTS estimate_items (
    item_id SERIAL PRIMARY KEY,
    estimate_id INTEGER REFERENCES estimates(estimate_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(category_id),
    description TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_estimated DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Actuals with variance calculations
CREATE TABLE IF NOT EXISTS actuals (
    actual_id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES estimate_items(item_id) ON DELETE CASCADE,
    actual_unit_price DECIMAL(12,2) NOT NULL,
    actual_quantity DECIMAL(10,3),
    total_actual DECIMAL(15,2),
    variance_amount DECIMAL(15,2),
    variance_percentage DECIMAL(8,3),
    date_recorded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset verification
CREATE TABLE IF NOT EXISTS verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('password_reset', 'email_change', 'account_verification')),
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## ⚙️ Variance Calculation Logic

### Application-Level Calculations
Instead of database triggers, variance calculations are performed in the application:

```javascript
// In actualController.js
const calculateVariance = (actualUnitPrice, actualQuantity, estimatedTotal, estimatedUnitPrice) => {
    const unitPriceVariance = actualUnitPrice - estimatedUnitPrice;
    const varianceAmount = unitPriceVariance * actualQuantity;
    const variancePercentage = estimatedUnitPrice > 0
        ? (unitPriceVariance / estimatedUnitPrice) * 100
        : 0;

    return {
        totalActual: actualUnitPrice * actualQuantity,
        varianceAmount,
        variancePercentage
    };
};
```

### Batch Tracking
- **Sequential Numbering**: ROW_NUMBER() for proper batch ordering
- **Chronological Order**: Ordered by date_recorded ASC
- **Cumulative Analysis**: Running totals and variance calculations

## 🔧 Database Setup

### 1. Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS with Homebrew
brew install postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### 2. Create Database and User
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE construction_manager;
CREATE USER construction_manager WITH ENCRYPTED PASSWORD '0987654321';
GRANT ALL PRIVILEGES ON DATABASE construction_manager TO construction_manager;

# Exit
\q
```

### 3. Configure Environment
```bash
# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=construction_manager
DB_PASSWORD=0987654321
DB_NAME=construction_manager
```

### 4. Start Application
```bash
npm run dev
```

The application will automatically:
1. Connect to PostgreSQL
2. Initialize the schema if not exists
3. Insert default categories and admin user
4. Set up database triggers for updated_at columns

## 🚀 Benefits of PostgreSQL Migration

### Technical Benefits
- **Better JSON Support**: Native JSON data types
- **Advanced Queries**: Window functions, CTEs, array operations
- **Extensibility**: Custom functions and extensions
- **Standards Compliance**: Full SQL standard compliance
- **Performance**: Better query optimization and indexing

### Deployment Benefits
- **Supabase Ready**: Direct compatibility with Supabase
- **Cloud Native**: Better cloud platform support
- **Scalability**: Horizontal and vertical scaling options
- **Reliability**: ACID compliance and robust concurrency

### Development Benefits
- **No Trigger Issues**: Application-level calculations are easier to debug
- **Better Error Messages**: More descriptive error reporting
- **Type Safety**: Stricter type checking
- **Modern Syntax**: Support for latest SQL features

## 🔍 Verification

### Check Database Connection
```javascript
// Health check endpoint
GET /api/health

// Response
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### Verify Schema
```sql
-- Connect to database
psql -U construction_manager -d construction_manager

-- List all tables
\dt

-- Check table structure
\d users
\d sites
\d estimates
\d estimate_items
\d actuals
\d categories
\d verification_codes
```

### Test Variance Calculations
1. Create a site and estimate via the frontend
2. Add estimate items
3. Record actual costs
4. Verify variance calculations are correct in the database

## 🐛 Troubleshooting

### Common Issues

#### Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection
psql -U construction_manager -d construction_manager -h localhost -p 5432
```

#### Permission Issues
```sql
-- Grant additional permissions if needed
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO construction_manager;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO construction_manager;
```

#### Schema Issues
- Delete database and recreate if schema is corrupted
- Application will recreate schema automatically on startup

### Log Analysis
```bash
# Check application logs
npm run dev

# Look for:
✅ Database connected successfully
📋 Initializing database schema...
🔄 Existing database detected, schema already initialized
```

## 📞 Support

For database-related issues:
1. Check PostgreSQL server status
2. Verify connection credentials in `.env`
3. Review application logs for detailed error messages
4. Contact: De'Aion Contractors (0242838007 / 0208936345)

---

## 📝 Migration Notes

This system has been successfully migrated from MySQL to PostgreSQL with the following improvements:
- ✅ Better variance calculation logic
- ✅ Proper batch tracking and numbering
- ✅ Enhanced email service with retry logic
- ✅ Comprehensive frontend with React + TypeScript
- ✅ Real-time dashboard with budget alerts
- ✅ Professional UI with category color coding
- ✅ Forgot password functionality with email verification

**No manual trigger setup required** - all calculations are handled in application logic for better maintainability and debugging.