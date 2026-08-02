import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.1.0",

    info: {
      title: "SPIMS API",
      version: "1.0.0",
      description: "Smart Pharmacy Inventory Management System REST API",
    },

    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Development Server",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: ["./**/*.swagger.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
