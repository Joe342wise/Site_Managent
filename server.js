const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const { apiReference } = require('@scalar/express-api-reference');
require('dotenv').config();

const { testConnection, pool } = require('./src/config/database');
const { initializeDatabase } = require('./src/config/initDatabase');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const swaggerSpec = require('./src/config/swagger');

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const siteRoutes = require('./src/routes/sites');
const estimateRoutes = require('./src/routes/estimates');
const estimateItemRoutes = require('./src/routes/estimateItems');
const actualRoutes = require('./src/routes/actuals');
const varianceRoutes = require('./src/routes/variance');
const reportRoutes = require('./src/routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100 to 500 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(helmet());
app.use(cors());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Construction Site Manager API',
    version: '1.0.0',
    company: process.env.COMPANY_NAME || 'De\'Aion Contractors',
    documentation: {
      scalar: '/api/docs/scalar',
      swagger: '/api/docs/swagger-ui',
      json: '/api/docs/json'
    },
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      sites: '/api/sites',
      estimates: '/api/estimates',
      items: '/api/estimate-items',
      actuals: '/api/actuals',
      variance: '/api/variance',
      reports: '/api/reports'
    }
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbConnected ? 'connected' : 'disconnected',
        api: 'running'
      },
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API Documentation Routes
app.use('/api/docs/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Construction Site Manager API',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showRequestHeaders: true
  }
}));

// Scalar API Reference (Modern, Interactive Documentation)
app.use('/api/docs/scalar',
  apiReference({
    theme: 'default',
    spec: {
      content: swaggerSpec,
    },
    metaData: {
      title: 'Construction Site Manager API - Scalar Docs',
      description: 'Interactive API documentation for De\'Aion Contractors construction management system'
    },
    customCss: `
      .scalar-app {
        --scalar-color-1: #2d3748;
        --scalar-color-2: #4a5568;
        --scalar-color-3: #718096;
        --scalar-color-accent: #3182ce;
      }
    `
  })
);

// Default docs redirect to Scalar (more modern)
app.get('/api/docs', (req, res) => {
  res.redirect('/api/docs/scalar');
});

// Legacy JSON docs endpoint
app.get('/api/docs/json', (req, res) => {
  res.json(swaggerSpec);
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/estimates', estimateRoutes);
app.use('/api/estimate-items', estimateItemRoutes);
app.use('/api/actuals', actualRoutes);
app.use('/api/variance', varianceRoutes);
app.use('/api/reports', reportRoutes);

app.use('/api/*', notFoundHandler);
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    console.log('🚀 Starting Construction Site Manager API...');
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'CONNECTION_STRING' : 'ENV_VARS'}`);

    let dbConnected = false;
    let retries = 3;

    while (retries > 0 && !dbConnected) {
      console.log(`🔄 Attempting database connection... (${4 - retries}/3)`);
      dbConnected = await testConnection();

      if (!dbConnected) {
        retries--;
        if (retries > 0) {
          console.log(`⏳ Retrying in 5 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    if (!dbConnected) {
      console.error('❌ Failed to connect to database after 3 attempts.');
      console.error('🔧 Suggestions:');
      console.error('  1. Check DATABASE_URL format');
      console.error('  2. Verify Supabase credentials');
      console.error('  3. Check network connectivity');
      process.exit(1);
    }

    console.log('✅ Database connected successfully');

    try {
      await initializeDatabase();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('⚠️  Database initialization warning:', error.message);
    }

    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📖 Scalar Docs (Modern): http://localhost:${PORT}/api/docs/scalar`);
      console.log(`📋 Swagger UI: http://localhost:${PORT}/api/docs/swagger-ui`);
      console.log(`📄 OpenAPI JSON: http://localhost:${PORT}/api/docs/json`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🏢 Company: ${process.env.COMPANY_NAME || 'De\'Aion Contractors'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    const gracefulShutdown = () => {
      console.log('\n📴 Shutting down gracefully...');
      server.close(() => {
        console.log('✅ HTTP server closed');
        pool.end(() => {
          console.log('✅ Database connections closed');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;