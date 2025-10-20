import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'QR Menu API',
      version: '1.0.0',
      description: 'API per il sistema di menu QR code per ristoranti',
      contact: {
        name: 'QR Menu Support',
        email: 'support@qrmenu.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-domain.com' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Restaurant: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            address: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            website: { type: 'string' },
            logo: { type: 'string' },
            coverImage: { type: 'string' },
            isActive: { type: 'boolean' },
            ordersEnabled: { type: 'boolean' },
            chatbotEnabled: { type: 'boolean' },
            telegramEnabled: { type: 'boolean' },
            licenseTier: { type: 'string', enum: ['DEMO', 'BASIC', 'PREMIUM', 'ENTERPRISE'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderNumber: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'] },
            totalAmount: { type: 'number', format: 'decimal' },
            tableNumber: { type: 'string' },
            notes: { type: 'string' },
            customerInfo: { type: 'object' },
            restaurantId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/app/api/**/*.ts', // Percorso ai file API
  ]
}

export const swaggerSpec = swaggerJsdoc(options)
