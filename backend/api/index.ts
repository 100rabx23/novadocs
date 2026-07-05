import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { json, urlencoded } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

const server = express();
let nestApp: any;

function validateEnvVariables(config: ConfigService) {
  const required = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'FRONTEND_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];
  const missing = required.filter(key => !config.get(key));
  if (missing.length > 0) {
    const errorMsg = `CRITICAL CONFIGURATION ERROR: Missing required environment variables:\n` +
                     missing.map(key => `- ${key}`).join('\n') + 
                     `\nPlease configure these variables in your Vercel Dashboard.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

async function bootstrap() {
  if (!nestApp) {
    nestApp = await NestFactory.create(AppModule, new ExpressAdapter(server));
    
    // Set global API prefix
    nestApp.setGlobalPrefix('api');

    // Request size limit extensions
    nestApp.use(json({ limit: '50mb' }));
    nestApp.use(urlencoded({ limit: '50mb', extended: true }));

    // Enable validation pipe
    nestApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    // Configure Helmet security headers
    nestApp.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      }),
    );

    // Retrieve config and validate environment variables
    const configService: ConfigService = nestApp.get(ConfigService);
    validateEnvVariables(configService);

    // Configure CORS origins dynamically
    const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    nestApp.enableCors({
      origin: [frontendUrl, 'http://localhost:5173', 'http://localhost:3000'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    await nestApp.init();
  }
  return nestApp;
}

// Export the serverless request handler
export default async (req: any, res: any) => {
  await bootstrap();
  server(req, res);
};
