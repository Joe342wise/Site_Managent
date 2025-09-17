# Construction Site Manager - Full Stack Application

A comprehensive construction project management system built for **De'Aion Contractors** with Node.js backend and React frontend.

## 🎯 Project Overview

This is a complete full-stack application that provides construction contractors with tools to manage projects, track costs, and maintain financial control across multiple contracts.

### 🏗️ Architecture

```
Construction Site Manager/
├── backend/                 # Node.js + Express + MySQL
│   ├── src/
│   │   ├── config/         # Database & app configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic (PDF generation)
│   │   └── utils/          # Helper functions
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── README.md           # Backend documentation
│
└── frontend/               # React + TypeScript + Vite
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── pages/          # Page components
    │   ├── contexts/       # React contexts (Auth)
    │   ├── services/       # API communication
    │   ├── types/          # TypeScript definitions
    │   └── utils/          # Helper functions
    ├── package.json        # Frontend dependencies
    └── README.md           # Frontend documentation
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **MySQL 8.0+**
- **pnpm** (recommended) or npm

### 1. Setup Backend

```bash
# Install backend dependencies
cd Site_Managent
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# Start backend server
pnpm start
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
npm run dev
```

Frontend will be available at: **http://localhost:3001**

### 3. Login

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
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

#### Sites Management
- `GET /api/sites` - List sites
- `POST /api/sites` - Create site
- `GET /api/sites/:id` - Get site details
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site

#### Estimates Management
- `GET /api/estimates` - List estimates
- `POST /api/estimates` - Create estimate
- `GET /api/estimates/:id` - Get estimate details
- `PUT /api/estimates/:id` - Update estimate
- `POST /api/estimates/:id/duplicate` - Duplicate estimate

#### Estimate Items
- `GET /api/estimate-items/categories` - Get categories
- `GET /api/estimate-items/estimate/:id` - Get items
- `POST /api/estimate-items` - Create item
- `PUT /api/estimate-items/:id` - Update item

#### Actual Costs
- `GET /api/actuals` - List actual costs
- `POST /api/actuals` - Record actual cost
- `GET /api/actuals/estimate/:id` - Get actuals for estimate
- `PUT /api/actuals/:id` - Update actual

#### Variance Analysis
- `GET /api/variance/analysis` - Variance analysis
- `GET /api/variance/by-site` - Variance by site
- `GET /api/variance/by-category` - Variance by category
- `GET /api/variance/trends` - Variance trends
- `GET /api/variance/alerts` - Budget alerts

#### Reports
- `GET /api/reports/estimate/:id` - Generate estimate PDF
- `GET /api/reports/variance/:site_id` - Generate variance PDF
- `GET /api/reports/site/:site_id` - Generate site PDF

## 🎨 Frontend Features

### 📱 Modern React Interface
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router v6
- **State Management**: React Query + Context API
- **Forms**: React Hook Form with Zod validation

### 🔐 Authentication System
- JWT-based authentication
- Role-based access control
- Protected routes
- Automatic token refresh

### 📊 Dashboard
- Real-time project statistics
- Budget variance alerts
- Recent activity feed
- Quick action buttons

### 🏗️ Site Management
- Create, edit, delete sites
- Site status tracking
- Budget management
- Location and date tracking

### 📋 Estimates
- Detailed project estimation
- 12 specialized construction categories
- Item management
- Cost calculations

### 💰 Cost Tracking
- Record actual expenses
- Compare actuals vs estimates
- Automatic variance calculations
- Visual indicators for budget status

### 📈 Variance Analysis
- Budget performance analytics
- Variance by site and category
- Trend analysis
- Alert notifications

### 📄 Reports
- Professional PDF generation
- Company-branded reports
- Estimate reports
- Variance analysis reports
- Site summary reports

## 🗄️ Database Schema

### Core Tables
- **users** - User authentication and roles
- **sites** - Construction project sites
- **estimates** - Project estimates
- **categories** - Item categories (12 types)
- **estimate_items** - Detailed estimate items
- **actuals** - Recorded actual costs with variance

### Key Features
- Automatic variance calculations via triggers
- Foreign key relationships
- Indexed columns for performance
- Generated columns for totals

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with connection pooling
- **Authentication**: JWT with bcryptjs
- **Validation**: Joi schema validation
- **Security**: Helmet, CORS, rate limiting
- **PDF Generation**: PDFKit
- **Documentation**: OpenAPI 3.0 + Scalar + Swagger UI

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context API
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 🚀 Deployment

### Backend Deployment
```bash
# Production build
NODE_ENV=production pnpm start

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

- JWT-based authentication
- Password hashing with bcryptjs
- SQL injection prevention
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers
- Role-based access control

## 📊 Business Value

### For De'Aion Contractors
- **Financial Control**: Prevent budget mixing between contracts
- **Cost Optimization**: Maximize use of owned resources
- **Professional Image**: Branded reports for client presentations
- **Data-Driven Decisions**: Historical data improves future estimates
- **Operational Efficiency**: Centralized project management

### ROI Indicators
- Reduced material waste through better tracking
- Improved estimate accuracy from historical actuals
- Faster project setup and reporting
- Enhanced client trust through professional documentation
- Better cash flow management across multiple contracts

## 🔄 Development Workflow

1. **Backend Development**
   - API endpoint implementation
   - Database schema updates
   - Business logic in services
   - Comprehensive testing

2. **Frontend Development**
   - Component-based architecture
   - TypeScript for type safety
   - Responsive design principles
   - User experience optimization

3. **Integration**
   - API consumption in frontend
   - Error handling and loading states
   - Real-time data updates
   - Cross-browser testing

## 📝 Contributing

1. Follow existing code style and patterns
2. Use TypeScript for type safety
3. Add comprehensive error handling
4. Test on different screen sizes
5. Update documentation as needed
6. Follow security best practices

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check MySQL server is running
   - Verify credentials in .env file
   - Ensure database exists

2. **Port Conflicts**
   - Backend: Default port 3000
   - Frontend: Default port 3001
   - Change ports in configuration if needed

3. **Dependency Issues**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Use recommended package manager (pnpm)

### Getting Help
- Check the comprehensive documentation
- Review API documentation in Scalar/Swagger
- Contact: De'Aion Contractors (0242838007 / 0208936345)

---

## 📄 License

Private - De'Aion Contractors Internal Use Only

**Built with ❤️ for De'Aion Contractors**
*Professional Construction Management Made Simple*