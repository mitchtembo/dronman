import { NextResponse } from 'next/server';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Drone Pilot Management API',
      version: '1.0.0',
      description: 'API documentation for the Drone Pilot Management application.',
    },
    servers: [
      {
        url: '/api', // Base path for your API routes
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required or invalid token.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Unauthorized' },
                },
              },
            },
          },
        },
        Forbidden: {
          description: 'Access denied. Insufficient permissions.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Forbidden' },
                },
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Not Found' },
                },
              },
            },
          },
        },
        BadRequest: {
          description: 'Invalid request payload or parameters.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Bad Request' },
                },
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Internal Server Error' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/app/api/**/*.js'], // Path to files containing OpenAPI annotations
};

export async function GET() {
  const spec = swaggerJsdoc(options);
  return NextResponse.json(spec);
}
