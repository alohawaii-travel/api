import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Alohawaii Tour Platform API",
      version: "0.1.0",
      description:
        "Complete API for tour booking platform with Google OAuth authentication",
      contact: {
        name: "API Support",
        email: "support@alohawaii.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development server",
      },
      {
        url: "https://api.alohawaii.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        googleOAuth: {
          type: "oauth2",
          flows: {
            authorizationCode: {
              authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
              tokenUrl: "https://oauth2.googleapis.com/token",
              scopes: {
                openid: "OpenID Connect",
                email: "User email address",
                profile: "User profile information",
              },
            },
          },
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique user identifier",
              example: "clxxxxx123456789",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
              example: "user@example.com",
            },
            name: {
              type: "string",
              description: "User full name",
              example: "John Doe",
            },
            avatar: {
              type: "string",
              format: "uri",
              description: "User profile picture URL",
              example: "https://lh3.googleusercontent.com/...",
            },
            role: {
              type: "string",
              enum: ["CUSTOMER", "ADMIN", "SUPER_ADMIN"],
              description: "User role in the system",
              example: "CUSTOMER",
            },
            domain: {
              type: "string",
              description: "Email domain (for whitelisting)",
              example: "company.com",
            },
            isActive: {
              type: "boolean",
              description: "Whether the user account is active",
              example: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp",
            },
            lastLoginAt: {
              type: "string",
              format: "date-time",
              description: "Last login timestamp",
            },
          },
          required: ["id", "email", "role", "isActive"],
        },
        ApiResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Whether the request was successful",
              example: true,
            },
            message: {
              type: "string",
              description: "Human-readable response message",
              example: "Operation completed successfully",
            },
            data: {
              type: "object",
              description: "Response data (varies by endpoint)",
            },
            error: {
              type: "string",
              description: "Error message (only present on failure)",
              example: "Authentication required",
            },
          },
          required: ["success", "message"],
        },
        HealthCheck: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "healthy",
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
            version: {
              type: "string",
              example: "0.1.0",
            },
            environment: {
              type: "string",
              example: "development",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Authentication required",
            },
            error: {
              type: "string",
              example: "UNAUTHORIZED",
            },
          },
        },
      },
    },
    security: [
      {
        googleOAuth: [],
      },
    ],
  },
  apis: ["./src/app/api/**/*.ts"], // Path to the API files
};

export const swaggerSpec = swaggerJSDoc(options);
