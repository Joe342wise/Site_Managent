# Construction Site Manager - Full Stack Application

A comprehensive construction project management system built for **De'Aion Contractors** with Node.js/PostgreSQL backend and React/TypeScript frontend.

## 🎯 Project Overview

This is a complete full-stack application that provides construction contractors with tools to manage projects, track costs, and maintain financial control across multiple contracts with advanced variance analysis and real-time budget alerts.

### 🏗️ Architecture

```
Construction Site Manager/
├── src/                     # Node.js Backend (Port 3000)
│   ├── config/             # Database & app configuration
│   │   ├── database.js     # PostgreSQL connection pool
│   │   └── postgresql_schema.sql # Database schema
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth, validation, error handling
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic (PDF, email)
│   └── utils/              # Helper functions
├── server.js               # Main server file
├── package.json            # Backend dependencies
│
└── frontend/               # React Frontend (Port 3001)
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── pages/          # Page components (Dashboard, Sites, etc.)
    │   ├── services/       # API communication layer
    │   ├── types/          # TypeScript definitions
    │   └── utils/          # Helper functions
    ├── package.json        # Frontend dependencies
    └── public/             # Static assets
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **PostgreSQL 12+**
- **npm** or **pnpm**

### 1. Setup Backend

```bash
# Install backend dependencies
cd Site_Managent
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Start backend server
npm run dev
```

Backend will be available at: **http://localhost:3000**
- API Docs (Scalar): http://localhost:3000/api/docs/scalar
- API Docs (Swagger): http://localhost:3000/api/docs/swagger-ui
- Health Check: http://localhost:3000/api/health

### 2. Setup Frontend

```bash
# Install frontend dependencies
cd frontend
npm install

# Start frontend development server
npm start
```

Frontend will be available at: **http://localhost:3001**

### 3. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE construction_manager;
CREATE USER construction_manager WITH ENCRYPTED PASSWORD '0987654321';
GRANT ALL PRIVILEGES ON DATABASE construction_manager TO construction_manager;
\q
```

### 4. Login

- **Username**: `admin`
- **Password**: `admin123`

## 📚 API Documentation

The backend provides comprehensive API documentation with two interfaces:

### 🔗 Interactive Documentation
- **Scalar (Modern)**: http://localhost:3000/api/docs/scalar
- **Swagger UI**: http://localhost:3000/api/docs/swagger-ui
- **OpenAPI JSON**: http://localhost:3000/api/docs/json

### 🔌 API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile with image upload
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Send password reset code
- `POST /api/auth/reset-password` - Reset password with code

#### Sites Management
- `GET /api/sites` - List sites with pagination
- `POST /api/sites` - Create site
- `GET /api/sites/:id` - Get site details
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site
- `GET /api/sites/statistics` - Get site statistics

#### Estimates Management
- `GET /api/estimates` - List estimates with filtering
- `POST /api/estimates` - Create estimate
- `GET /api/estimates/:id` - Get estimate details
- `PUT /api/estimates/:id` - Update estimate
- `POST /api/estimates/:id/duplicate` - Duplicate estimate
- `GET /api/estimates/statistics` - Get estimate statistics

#### Estimate Items
- `GET /api/estimate-items/categories` - Get all 12 categories
- `GET /api/estimate-items/estimate/:id` - Get items for estimate
- `POST /api/estimate-items` - Create item
- `PUT /api/estimate-items/:id` - Update item
- `DELETE /api/estimate-items/:id` - Delete item

#### Actual Costs
- `GET /api/actuals` - List actual costs with filtering
- `POST /api/actuals` - Record actual cost (batch tracking)
- `GET /api/actuals/estimate/:id` - Get actuals for estimate
- `PUT /api/actuals/:id` - Update actual
- `DELETE /api/actuals/:id` - Delete actual
- `GET /api/actuals/statistics` - Get actuals statistics

#### Variance Analysis
- `GET /api/variance/analysis` - Comprehensive variance analysis
- `GET /api/variance/by-site` - Variance grouped by site
- `GET /api/variance/by-category` - Variance grouped by category
- `GET /api/variance/trends` - Variance trends over time
- `GET /api/variance/alerts` - Budget alerts (>10% variance)
- `GET /api/variance/top` - Top variances by impact

#### Reports
- `GET /api/reports/estimate/:id` - Generate estimate PDF
- `GET /api/reports/variance/:site_id` - Generate variance PDF
- `GET /api/reports/site/:site_id` - Generate site PDF

## 🎨 Frontend Features

### 📱 Modern React Interface
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with responsive design
- **Icons**: Lucide React
- **Routing**: React Router v6
- **State Management**: React Query + Context API
- **Forms**: Enhanced forms with smart placeholders

### 🔐 Authentication System
- JWT-based authentication
- Role-based access control
- Protected routes
- Profile management with image upload
- Forgot password with email verification

### 📊 Dashboard
- Real-time project statistics (refreshes every 5-7 minutes)
- Budget variance alerts (threshold-based)
- Recent activity feed showing top variances
- Quick action buttons
- Overview cards with key metrics

### 🏗️ Site Management
- Create, edit, delete sites
- Site status tracking
- Budget limit management
- Location and date tracking
- Site statistics overview

### 📋 Estimates
- Detailed project estimation
- 12 specialized construction categories
- Item management with category-based units
- Automatic cost calculations
- Estimate duplication functionality

### 💰 Cost Tracking (Enhanced)
- Record actual expenses with batch tracking
- Compare actuals vs estimates
- Automatic variance calculations
- Visual indicators for budget status
- Chronological batch ordering
- Cumulative variance tracking

### 📈 Variance Analysis (Advanced)
- Budget performance analytics
- Variance by site and category
- Trend analysis over time
- Real-time alert notifications
- Batch-level variance analysis
- Color-coded status indicators

### 📄 Reports
- Professional PDF generation
- Company-branded reports
- Estimate reports
- Variance analysis reports
- Site summary reports

### 🎨 UI Enhancements
- **Category Color Coding**: Each of the 12 categories has unique colors
- **Status Badges**: Visual indicators for purchase status and variance
- **Enhanced Item Cards**: Better visual hierarchy and identification
- **Smart Forms**: Category-based unit dropdowns, placeholders instead of pre-filled values
- **Improved Spacing**: Better visual separation between items

## 🗄️ Database Schema (PostgreSQL)

### Core Tables
- **users** - User authentication, roles, and profile images
- **sites** - Construction project sites with budget limits
- **estimates** - Project estimates with status tracking
- **categories** - 12 specialized construction categories
- **estimate_items** - Detailed estimate items
- **actuals** - Recorded actual costs with batch tracking
- **verification_codes** - Password reset verification system

### 12 Construction Categories
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

### Key Features
- Proper PostgreSQL data types
- Foreign key relationships
- Indexed columns for performance
- Connection pooling
- Transaction support

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with pg (node-postgres)
- **Authentication**: JWT with bcryptjs
- **Validation**: Joi schema validation
- **Security**: Helmet, CORS, rate limiting
- **Email Service**: Nodemailer with Gmail SMTP
- **PDF Generation**: PDFKit
- **Documentation**: OpenAPI 3.0 + Scalar + Swagger UI

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Create React App
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context API
- **Routing**: React Router v6
- **Forms**: Enhanced form handling
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 🚀 Deployment

### Backend Deployment
```bash
# Production build
NODE_ENV=production npm start

# Or with PM2
pm2 start server.js --name "construction-api"
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Serve with nginx or static hosting
```

## 🔐 Security Features

- JWT-based authentication with secure tokens
- Password hashing with bcryptjs (12 salt rounds)
- SQL injection prevention with parameterized queries
- Input validation and sanitization
- Rate limiting (100 requests per 15 minutes)
- CORS protection configured for frontend
- Helmet security headers
- Role-based access control
- Email verification for password reset

## 📊 Business Value

### For De'Aion Contractors
- **Financial Control**: Prevent budget mixing between contracts
- **Cost Optimization**: Track actual vs estimated costs at batch level
- **Professional Image**: Branded reports for client presentations
- **Data-Driven Decisions**: Historical data improves future estimates
- **Operational Efficiency**: Centralized project management
- **Real-time Monitoring**: Instant budget alerts and variance tracking

### Advanced Features
- **Batch Tracking**: Monitor multiple purchases per item chronologically
- **Variance Alerts**: Automatic alerts when variance exceeds 10%
- **Email Integration**: Password reset and notification system
- **Dashboard Analytics**: Real-time overview with key metrics
- **Enhanced UX**: Color-coded categories and intuitive interface

### ROI Indicators
- Reduced material waste through better tracking
- Improved estimate accuracy from historical actuals
- Faster project setup and reporting
- Enhanced client trust through professional documentation
- Better cash flow management across multiple contracts
- Proactive budget management with real-time alerts

## 🔄 Development Workflow

1. **Backend Development**
   - PostgreSQL database with proper schema
   - RESTful API endpoints with comprehensive documentation
   - Business logic in controllers and services
   - Comprehensive error handling and validation

2. **Frontend Development**
   - Component-based React architecture
   - TypeScript for type safety
   - Responsive design with Tailwind CSS
   - Real-time data updates with React Query

3. **Integration**
   - Seamless API consumption in frontend
   - Error handling and loading states
   - Real-time data synchronization
   - Cross-browser compatibility

## 📝 Contributing

1. Follow existing code style and patterns
2. Use TypeScript for type safety
3. Add comprehensive error handling
4. Test on different screen sizes
5. Update documentation as needed
6. Follow security best practices
7. Maintain database consistency

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check PostgreSQL server is running
   - Verify credentials in .env file
   - Ensure database and user exist
   - Check connection pool configuration

2. **Port Conflicts**
   - Backend: Default port 3000
   - Frontend: Default port 3001
   - Change ports in configuration if needed

3. **Email Service Issues**
   - Verify Gmail app password is correct
   - Check SMTP configuration in .env
   - Review server logs for detailed error messages

4. **Dependency Issues**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Use recommended package managers

### Getting Help
- Check the comprehensive documentation
- Review API documentation in Scalar/Swagger
- Check server logs for detailed error messages
- Contact: De'Aion Contractors (0242838007 / 0208936345)

---

## 📄 License

Private - De'Aion Contractors Internal Use Only

**Built with ❤️ for De'Aion Contractors**
*Professional Construction Management Made Simple*