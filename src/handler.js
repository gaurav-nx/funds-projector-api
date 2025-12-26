import serverlessExpress from '@vendia/serverless-express';
import app from './app.js';

// Create serverless Express handler for API Gateway HTTP API
export const handler = serverlessExpress({
  app,
  binaryMimeTypes: [
    'application/octet-stream',
    'image/*',
    'font/*'
  ]
});

