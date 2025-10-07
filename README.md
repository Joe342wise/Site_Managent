# Construction Site Management System

A comprehensive full-stack application for managing construction projects, estimates, and cost tracking. Built specifically for **De'Aion Contractors**, this system provides complete financial control and project management capabilities with advanced variance analysis and budget alerts.

## System Architecture

### Backend (Node.js + PostgreSQL)
- **Database**: PostgreSQL 12+ with comprehensive schema
- **API**: RESTful Node.js API with Express.js
- **Authentication**: JWT-based with role-based access control
- **Email Service**: Nodemailer with Gmail SMTP integration

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with responsive design
- **State Management**: React Query for server state
- **Routing**: React Router DOM
- **Icons**: Lucide React icons

## Features

### Core Functionality
- **Site Management**: Complete CRUD operations for construction sites
- **Estimate Management**: Detailed project estimates with 12 specialized categories
- **Cost Tracking**: Record actual costs vs estimates with real-time variance analysis
- **User Management**: Secure authentication with profile management and forgot password
- **PDF Reports**: Professional branded reports for estimates, variance analysis, and site summaries
- **Variance Analysis**: Advanced calculations and alerts for budget monitoring
- **Dashboard**: Real-time overview with budget alerts and recent variances

### Business Value
- **Financial Control**: Prevent cross-contract spending and maintain budget boundaries
- **Cost Optimization**: Track actual vs estimated costs with batch-level tracking
- **Professional Reporting**: Branded PDF reports for client presentations
- **Data-Driven Decisions**: Historical data improves estimate accuracy
- **Real-time Monitoring**: Instant alerts when budgets exceed thresholds

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- pnpm (recommended) or npm

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd Site_Managent

   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

2. **Database Setup**
   ```bash
   # Create PostgreSQL database
   psql -U postgres
   CREATE DATABASE construction_manager;
   CREATE USER construction_manager WITH ENCRYPTED PASSWORD '0987654321';
   GRANT ALL PRIVILEGES ON DATABASE construction_manager TO construction_manager;
   \q
   ```

3. **Environment Configuration**
   ```bash
   # Backend configuration
   cp .env.example .env
   # Edit .env with your database credentials
   ```

   Example `.env`:
   ```bash
   # Database Configuration (PostgreSQL)
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=construction_manager
   DB_PASSWORD=0987654321
   DB_NAME=construction_manager

   # JWT Configuration
   JWT_SECRET=construction_manager_super_secret_jwt_key_2024
   JWT_EXPIRES_IN=24h

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Email Configuration (Gmail)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   SMTP_FROM=your_email@gmail.com

   # Company Information
   COMPANY_NAME=De'Aion Contractors
   COMPANY_PHONE1=0242838007
   COMPANY_PHONE2=0208936345
   COMPANY_CURRENCY=GHS
   ```

4. **Start the Application**
   ```bash
   # Development - Backend (runs on port 3000)
   npm run dev

   # In a new terminal - Frontend (runs on port 3001)
   cd frontend
   npm start
   ```

5. **Verify Installation**
   - **Frontend**: http://localhost:3001
   - **Backend API**: http://localhost:3000
   - **Scalar Docs**: http://localhost:3000/api/docs/scalar (Modern, Interactive)
   - **Swagger UI**: http://localhost:3000/api/docs/swagger-ui (Traditional)
   - **Health Check**: http://localhost:3000/api/health

### Default Login
```
Username: admin
Password: admin123
```

## System Components

### Database Schema (PostgreSQL)

#### Core Tables
- **users**: User authentication and roles with profile images
- **sites**: Construction project sites with budget limits
- **estimates**: Project estimates with status tracking
- **categories**: 12 specialized construction categories
- **estimate_items**: Detailed estimate line items
- **actuals**: Recorded actual costs with variance calculations
- **verification_codes**: Password reset verification system

#### Construction Categories (12 Types)
1. **Material** - Basic construction materials
2. **Labor** - Worker payments and contractor fees
3. **Masonry** - Brick work, concrete, foundations
4. **Steel Works** - Reinforcement, structural steel
5. **Roofing** - Roofing materials and installation
6. **Plumbing** - Water systems and fixtures
7. **Electrical** - Wiring, fixtures, electrical systems
8. **Flooring** - Flooring materials and installation
9. **Painting** - Paint and painting services
10. **Landscaping** - Outdoor and landscaping work
11. **HVAC** - Heating, ventilation, air conditioning
12. **Miscellaneous** - Other construction items

### Frontend Architecture

#### Key Components
- **Dashboard**: Overview with stats, alerts, and quick actions
- **Sites Management**: CRUD operations for construction sites
- **Estimates**: Create and manage project estimates with items
- **Actuals Entry**: Record purchase costs with batch tracking
- **Variance Analysis**: Detailed variance reports and analysis
- **User Profile**: Profile management with image upload
- **Authentication**: Login, forgot password, profile management

#### UI Enhancements
- **Category-coded Items**: Color-coded badges and borders for easy identification
- **Status Indicators**: Visual badges for purchase status and variance direction
- **Enhanced Forms**: Smart placeholders and category-based unit dropdowns
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### Variance Calculation System

#### Formula
```
Variance Amount = (Actual Unit Price × Actual Quantity) - Estimated Total
Variance Percentage = (Variance Amount / Estimated Total) × 100
```

#### Batch Tracking
- **Chronological Ordering**: Purchases ordered by date and time
- **Batch Numbering**: Sequential batch numbers (Batch #1, #2, etc.)
- **Cumulative Analysis**: Running totals and variance calculations
- **Individual Tracking**: Each purchase tracked separately

#### Budget Alerts
- **Threshold**: 10% variance triggers alerts (configurable)
- **Real-time Monitoring**: Dashboard refreshes every 5-7 minutes
- **Alert Types**:
  - High variance items (>10% deviation)
  - Budget exceeded alerts (when site budget limit exceeded)

## API Documentation

### Authentication
All endpoints require JWT authentication except `/auth/login` and `/auth/forgot-password`.

```bash
# Login
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}

# Forgot Password
POST /api/auth/forgot-password
{
  "email": "admin@deaioncontractors.com"
}

# Reset Password
POST /api/auth/reset-password
{
  "email": "admin@deaioncontractors.com",
  "verificationCode": "123456",
  "newPassword": "newPassword123"
}
```

### Core Endpoints

#### Sites Management
```bash
GET    /api/sites                 # List all sites with pagination
POST   /api/sites                 # Create new site
GET    /api/sites/:id             # Get site details
PUT    /api/sites/:id             # Update site
DELETE /api/sites/:id             # Delete site
GET    /api/sites/statistics      # Site statistics
```

#### Estimates Management
```bash
GET    /api/estimates             # List all estimates with filtering
POST   /api/estimates             # Create new estimate
GET    /api/estimates/:id         # Get estimate details
PUT    /api/estimates/:id         # Update estimate
POST   /api/estimates/:id/duplicate # Duplicate estimate
GET    /api/estimates/statistics  # Estimate statistics
```

#### Estimate Items
```bash
GET    /api/estimate-items/categories           # Get all categories
GET    /api/estimate-items/estimate/:id         # Get items for estimate
POST   /api/estimate-items                      # Add new item
PUT    /api/estimate-items/:id                  # Update item
DELETE /api/estimate-items/:id                  # Delete item
```

#### Actual Costs
```bash
GET    /api/actuals               # List all actuals with filtering
POST   /api/actuals               # Record actual cost
GET    /api/actuals/estimate/:id  # Get actuals for estimate
PUT    /api/actuals/:id           # Update actual cost
DELETE /api/actuals/:id           # Delete actual cost
GET    /api/actuals/statistics    # Actuals statistics
```

#### Variance Analysis
```bash
GET    /api/variance/analysis     # Comprehensive variance analysis
GET    /api/variance/by-site      # Variance grouped by site
GET    /api/variance/by-category  # Variance grouped by category
GET    /api/variance/trends       # Variance trends over time
GET    /api/variance/alerts       # Budget alerts and warnings
GET    /api/variance/top          # Top variances by impact
```

#### PDF Reports
```bash
GET    /api/reports/estimate/:id     # Generate estimate PDF
GET    /api/reports/variance/:site_id # Generate variance PDF
GET    /api/reports/site/:site_id     # Generate site summary PDF

# Query parameters:
# ?download=true - Download immediately
# ?filename=custom_name.pdf - Custom filename
```

## User Workflow

### 1. Site Setup
1. Create construction site with budget limit
2. Set site details (location, dates, contact info)

### 2. Estimate Creation
1. Create project estimate for the site
2. Add estimate items with categories, quantities, and unit prices
3. System automatically calculates totals

### 3. Cost Recording
1. Record actual purchases as they occur
2. Enter actual unit price and quantity (if different)
3. System calculates variance automatically
4. Track multiple batches per item chronologically

### 4. Variance Monitoring
1. View dashboard for real-time alerts
2. Analyze variance details by site or category
3. Generate PDF reports for stakeholders
4. Monitor budget compliance

## Email Features

### Forgot Password System
- **Verification Code**: 6-digit code with 10-minute expiration
- **Email Templates**: Professional branded emails
- **Fallback System**: Shows code in response if email fails
- **Retry Logic**: 3 attempts with exponential backoff

### Configuration
Requires Gmail app password for SMTP authentication:
1. Enable 2-factor authentication in Gmail
2. Generate app-specific password
3. Use app password in `SMTP_PASS` environment variable

## Development

### Available Scripts
```bash
# Backend
npm run dev        # Development server with nodemon
npm start          # Production server

# Frontend
cd frontend
npm start          # Development server (Create React App)
npm run build      # Production build
```

### Project Structure
```
Site_Managent/
├── src/                      # Backend source code
│   ├── config/              # Database and app configuration
│   │   ├── database.js      # PostgreSQL connection
│   │   └── postgresql_schema.sql # Database schema
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Authentication, validation, error handling
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic (PDF, email)
│   └── utils/               # Utility functions
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Frontend utilities
│   └── public/             # Static assets
├── temp/                   # Temporary files (PDF generation)
└── docs/                   # Documentation files
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: 100 requests per 15 minutes
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries
- **CORS Protection**: Configured for frontend domain
- **Security Headers**: Helmet.js security middleware

## Performance Considerations

- **Database Connection Pooling**: PostgreSQL connection pool
- **Query Optimization**: Efficient indexing and query structure
- **Frontend Optimization**: React Query for caching and state management
- **Background Processing**: Automatic PDF cleanup
- **Pagination**: Efficient data loading with pagination

## Troubleshooting

### Common Issues

1. **Port Conflicts**:
   - Backend: Port 3000
   - Frontend: Port 3001

2. **Database Connection Issues**:
   - Verify PostgreSQL is running
   - Check connection credentials in `.env`
   - Ensure database and user exist

3. **Email Service Issues**:
   - Verify Gmail app password is correct
   - Check SMTP configuration
   - Review server logs for detailed error messages

4. **Build Issues**:
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

## Deployment

For production deployment, see the comprehensive [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) which covers:

### Deployment Stack
- **Database**: Supabase (Managed PostgreSQL)
- **Backend API**: Render.com (Node.js hosting)
- **Frontend**: Vercel (Static site hosting)

### Key Features
- Step-by-step deployment instructions for all three services
- Environment variable configuration
- Database migration guide
- Testing and verification procedures
- Troubleshooting common deployment issues
- Cost considerations (free tier options available)
- Custom domain setup (optional)

### Quick Deployment Overview
1. **Database**: Import `postgresql_schema.sql` into Supabase
2. **Backend**: Deploy to Render using `render.yaml` configuration
3. **Frontend**: Deploy to Vercel using `vercel.json` configuration
4. **Configure**: Set environment variables for API connection

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

## Support

For technical support or questions:
- Check the API documentation: `/api/docs`
- Review health status: `/api/health`
- Contact: De'Aion Contractors (0242838007 / 0208936345)

## License

Private - De'Aion Contractors Internal Use Only