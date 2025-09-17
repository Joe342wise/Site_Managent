# Construction Site Manager API

A comprehensive Node.js API for managing construction projects, estimates, and cost tracking. Built specifically for **De'Aion Contractors**, this system provides complete financial control and project management capabilities.

## Features

### Core Functionality
- **Site Management**: Complete CRUD operations for construction sites
- **Estimate Management**: Detailed project estimates with 12 specialized categories
- **Cost Tracking**: Record actual costs vs estimates with real-time variance analysis
- **User Management**: Secure authentication and role-based access control
- **PDF Reports**: Professional branded reports for estimates, variance analysis, and site summaries
- **Variance Analysis**: Advanced calculations and alerts for budget monitoring

### Business Value
- **Financial Control**: Prevent cross-contract spending and maintain budget boundaries
- **Cost Optimization**: Track actual vs estimated costs for better future planning
- **Professional Reporting**: Branded PDF reports for client presentations
- **Data-Driven Decisions**: Historical data improves estimate accuracy

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- pnpm (recommended) or npm

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd Site_Managent
   pnpm install
   ```

2. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE construction_manager;
   exit
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start the Server**
   ```bash
   # Development
   pnpm run dev

   # Production
   pnpm start
   ```

5. **Verify Installation**
   - API: http://localhost:3000
   - **Scalar Docs**: http://localhost:3000/api/docs/scalar (Modern, Interactive)
   - **Swagger UI**: http://localhost:3000/api/docs/swagger-ui (Traditional)
   - Health: http://localhost:3000/api/health

### Database Migration (If Needed)

If you encounter issues with generated columns in MySQL, the application automatically detects and fixes this issue. The system will:

1. **Detect existing databases** and run migration scripts automatically
2. **Fix generated column issues** in the `actuals` table
3. **Create triggers** to calculate totals and variances properly

Manual migration (if needed):
```bash
# Run the migration script directly in MySQL
mysql -u root -p construction_manager < src/config/migration_fix_actuals.sql

# If trigger creation fails, create them manually
mysql -u root -p construction_manager < src/config/fixed_triggers.sql
```

### Troubleshooting Trigger Issues

If you encounter MySQL syntax errors with triggers (Error Code: 1064), see the detailed guide:
- **[SETUP_TRIGGERS.md](SETUP_TRIGGERS.md)** - Complete manual trigger setup guide

Common solutions:
1. **Automatic**: The application tries to create triggers automatically
2. **Semi-automatic**: Use the fixed SQL file: `mysql -u root -p construction_manager < src/config/fixed_triggers.sql`
3. **Manual**: Follow the step-by-step guide in `SETUP_TRIGGERS.md`

## API Documentation

The API includes comprehensive interactive documentation with two interfaces:

### 📖 **Scalar Documentation** (Recommended)
- **URL**: http://localhost:3000/api/docs/scalar
- **Features**: Modern, beautiful interface with interactive examples
- **Highlights**:
  - Real-time API testing
  - Code examples in multiple languages
  - Dark/light theme support
  - Advanced filtering and search

### 📋 **Swagger UI Documentation**
- **URL**: http://localhost:3000/api/docs/swagger-ui
- **Features**: Traditional Swagger interface
- **Highlights**:
  - Try-it-out functionality
  - Schema visualization
  - Authentication support
  - Export capabilities

### 📄 **OpenAPI JSON Specification**
- **URL**: http://localhost:3000/api/docs/json
- **Use**: Import into Postman, Insomnia, or other API tools

### Authentication
All endpoints require JWT authentication except `/auth/login`.

```bash
# Login
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}

# Use the returned token in headers
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Sites Management
```bash
GET    /api/sites                 # List all sites
POST   /api/sites                 # Create new site
GET    /api/sites/:id             # Get site details
PUT    /api/sites/:id             # Update site
DELETE /api/sites/:id             # Delete site
```

#### Estimates Management
```bash
GET    /api/estimates             # List all estimates
POST   /api/estimates             # Create new estimate
GET    /api/estimates/:id         # Get estimate details
PUT    /api/estimates/:id         # Update estimate
POST   /api/estimates/:id/duplicate # Duplicate estimate
```

#### Estimate Items
```bash
GET    /api/estimate-items/categories           # Get all categories
GET    /api/estimate-items/estimate/:id         # Get items for estimate
POST   /api/estimate-items                      # Add new item
PUT    /api/estimate-items/:id                  # Update item
```

#### Actual Costs
```bash
GET    /api/actuals               # List all actuals
POST   /api/actuals               # Record actual cost
GET    /api/actuals/estimate/:id  # Get actuals for estimate
PUT    /api/actuals/:id           # Update actual cost
```

#### Variance Analysis
```bash
GET    /api/variance/analysis     # Comprehensive variance analysis
GET    /api/variance/by-site      # Variance grouped by site
GET    /api/variance/by-category  # Variance grouped by category
GET    /api/variance/trends       # Variance trends over time
GET    /api/variance/alerts       # Budget alerts and warnings
```

#### PDF Reports
```bash
GET    /api/reports/estimate/:id     # Generate estimate PDF
GET    /api/reports/variance/:site_id # Generate variance PDF
GET    /api/reports/site/:site_id     # Generate site summary PDF

# Add ?download=true to download immediately
# Add ?filename=custom_name.pdf for custom filename
```

## Database Schema

### Core Tables
- **users**: User authentication and roles
- **sites**: Construction project sites
- **estimates**: Project estimates
- **categories**: Item categories (Material, Labor, etc.)
- **estimate_items**: Detailed estimate line items
- **actuals**: Recorded actual costs with variance calculations

### Categories (12 Specialized Types)
1. Material
2. Labor
3. Masonry
4. Steel Works
5. Plumbing
6. Carpentry
7. Electrical Works
8. Air Conditioning Works
9. Utilities
10. Glass Glazing
11. Metal Works
12. POP/Aesthetics Works

## Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=construction_manager

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=development

# Company Info
COMPANY_NAME=De'Aion Contractors
COMPANY_PHONE1=0242838007
COMPANY_PHONE2=0208936345
COMPANY_CURRENCY=GHS
```

## User Roles & Permissions

- **Admin**: Full system access, user management
- **Manager**: Site and estimate management, reporting
- **Supervisor**: Site-specific access, cost recording
- **Accountant**: Financial reporting and analysis

## Example Usage

### Creating a Complete Estimate

```bash
# 1. Create a site
POST /api/sites
{
  "name": "Accra Office Building",
  "location": "Accra, Ghana",
  "start_date": "2024-01-15",
  "budget_limit": 500000
}

# 2. Create an estimate
POST /api/estimates
{
  "site_id": 1,
  "title": "Phase 1 - Foundation Work",
  "description": "Initial foundation and structural work"
}

# 3. Add estimate items
POST /api/estimate-items
{
  "estimate_id": 1,
  "description": "Concrete for foundation",
  "category_id": 3,
  "quantity": 50,
  "unit": "cubic meters",
  "unit_price": 300
}

# 4. Record actual costs
POST /api/actuals
{
  "item_id": 1,
  "actual_unit_price": 320,
  "date_recorded": "2024-01-20"
}

# 5. Generate reports
GET /api/reports/estimate/1?download=true
```

## Development

### Available Scripts
```bash
pnpm run dev        # Start development server with nodemon
pnpm start          # Start production server
pnpm test           # Run tests
```

### Project Structure
```
src/
├── config/         # Database and app configuration
├── controllers/    # Route handlers
├── middleware/     # Authentication, validation, error handling
├── models/         # Database models (if using ORM)
├── routes/         # API route definitions
├── services/       # Business logic (PDF generation, etc.)
└── utils/          # Utility functions

tests/              # Test files
temp/               # Temporary files (PDF generation)
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

## Security Features

- JWT-based authentication
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- Input validation with Joi
- SQL injection prevention
- Role-based access control

## Performance Considerations

- Database connection pooling
- Automatic variance calculations via triggers
- Generated columns for totals
- Efficient indexing on frequently queried fields
- Background PDF cleanup

## Support

For technical support or questions:
- Check the API documentation: `/api/docs`
- Review health status: `/api/health`
- Contact: De'Aion Contractors (0242838007 / 0208936345)

## License

Private - De'Aion Contractors Internal Use Only