const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Research Experiment Management System API',
      version: '1.0.0',
      description: `
        A comprehensive API for managing research experiments with OpenBCI EEG integration.
        
        This API provides endpoints for:
        - User authentication and management
        - Experiment creation and management
        - Trial and step configuration
        - EEG data collection and analysis
        - File uploads and media handling
        
        ## Authentication
        This API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:
        \`\`\`
        Authorization: Bearer <your-jwt-token>
        \`\`\`
        
        ## Roles
        - **User**: Basic access to participate in experiments
        - **Researcher**: Can create and manage experiments
        - **Admin**: Full system access including user management
      `,
      contact: {
        name: 'Research Experiment Management System',
        url: 'https://github.com/yourusername/experiment-management-system'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'http://localhost:80/api',
        description: 'Production server (Docker)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

// Also load the external OpenAPI spec if it exists
const externalSpecPath = path.join(__dirname, '../../docs/api/openapi.yaml');
let externalSpec = null;

if (fs.existsSync(externalSpecPath)) {
  try {
    const yaml = require('js-yaml');
    const fileContents = fs.readFileSync(externalSpecPath, 'utf8');
    externalSpec = yaml.load(fileContents);
  } catch (error) {
    console.warn('Could not load external OpenAPI spec:', error.message);
  }
}

// Merge external spec with JSDoc generated spec
const finalSpec = externalSpec || specs;

module.exports = {
  specs: finalSpec,
  swaggerUi,
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(finalSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Research Experiment Management System API",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }
  })
};