const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Construction Site Manager API',
      version: '1.0.0',
      description: `
        A comprehensive API for managing construction projects, estimates, and cost tracking.
        Built specifically for De'Aion Contractors.

        ## Features
        - Site Management
        - Estimate Creation & Management
        - Cost Tracking & Variance Analysis
        - PDF Report Generation
        - User Management with Role-based Access

        ## Authentication
        Most endpoints require JWT authentication. Use the /auth/login endpoint to obtain a token.
      `,
      contact: {
        name: 'De\'Aion Contractors',
        phone: '0242838007 / 0208936345'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://api.deaioncontractors.com' : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /auth/login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            user_id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'admin' },
            email: { type: 'string', format: 'email', example: 'admin@deaioncontractors.com' },
            full_name: { type: 'string', example: 'System Administrator' },
            role: { type: 'string', enum: ['admin', 'manager', 'supervisor', 'accountant'], example: 'admin' },
            is_active: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Site: {
          type: 'object',
          properties: {
            site_id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Accra Office Building' },
            location: { type: 'string', example: 'Accra, Ghana' },
            start_date: { type: 'string', format: 'date', example: '2024-01-15' },
            end_date: { type: 'string', format: 'date', example: '2024-06-15' },
            status: { type: 'string', enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'], example: 'active' },
            budget_limit: { type: 'number', format: 'decimal', example: 500000.00 },
            notes: { type: 'string', example: 'Commercial office building project' },
            created_by: { type: 'integer', example: 1 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Estimate: {
          type: 'object',
          properties: {
            estimate_id: { type: 'integer', example: 1 },
            site_id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Phase 1 - Foundation Work' },
            description: { type: 'string', example: 'Initial foundation and structural work' },
            date_created: { type: 'string', format: 'date', example: '2024-01-15' },
            version: { type: 'integer', example: 1 },
            status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected', 'archived'], example: 'draft' },
            total_estimated: { type: 'number', format: 'decimal', example: 75000.00 },
            created_by: { type: 'integer', example: 1 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        EstimateItem: {
          type: 'object',
          properties: {
            item_id: { type: 'integer', example: 1 },
            estimate_id: { type: 'integer', example: 1 },
            description: { type: 'string', example: 'Concrete for foundation' },
            category_id: { type: 'integer', example: 3 },
            quantity: { type: 'number', format: 'decimal', example: 50.000 },
            unit: { type: 'string', example: 'cubic meters' },
            unit_price: { type: 'number', format: 'decimal', example: 300.00 },
            total_estimated: { type: 'number', format: 'decimal', example: 15000.00 },
            notes: { type: 'string', example: 'High-grade concrete required' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Actual: {
          type: 'object',
          properties: {
            actual_id: { type: 'integer', example: 1 },
            item_id: { type: 'integer', example: 1 },
            actual_unit_price: { type: 'number', format: 'decimal', example: 320.00 },
            actual_quantity: { type: 'number', format: 'decimal', example: 50.000 },
            total_actual: { type: 'number', format: 'decimal', example: 16000.00 },
            variance_amount: { type: 'number', format: 'decimal', example: 1000.00 },
            variance_percentage: { type: 'number', format: 'decimal', example: 6.67 },
            date_recorded: { type: 'string', format: 'date', example: '2024-01-20' },
            notes: { type: 'string', example: 'Price increased due to material shortage' },
            recorded_by: { type: 'integer', example: 1 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            category_id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Material' },
            description: { type: 'string', example: 'Basic construction materials' },
            sort_order: { type: 'integer', example: 1 },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'admin' },
            password: { type: 'string', example: 'admin123' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
              }
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'username' },
                  message: { type: 'string', example: 'Username is required' }
                }
              }
            }
          }
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                pagination: {
                  type: 'object',
                  properties: {
                    currentPage: { type: 'integer', example: 1 },
                    totalPages: { type: 'integer', example: 5 },
                    totalRecords: { type: 'integer', example: 100 },
                    hasNext: { type: 'boolean', example: true },
                    hasPrev: { type: 'boolean', example: false }
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and profile management'
      },
      {
        name: 'Users',
        description: 'User management (admin only)'
      },
      {
        name: 'Sites',
        description: 'Construction site management'
      },
      {
        name: 'Estimates',
        description: 'Project estimate management'
      },
      {
        name: 'Estimate Items',
        description: 'Detailed estimate items with categories'
      },
      {
        name: 'Actuals',
        description: 'Actual cost tracking and variance analysis'
      },
      {
        name: 'Variance',
        description: 'Budget variance analysis and reporting'
      },
      {
        name: 'Reports',
        description: 'PDF report generation and download'
      }
    ]
  },
  apis: ['./src/routes/*.js', './server.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = specs;