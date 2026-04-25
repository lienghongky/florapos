import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';

/**
 * Bootstrap the NestJS application with security, validation, CORS, and Swagger.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe — auto-transforms payloads to DTO instances
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // CORS — allow local dev and Docker origins
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:5173',
      'http://localhost',
    ],
    credentials: true,
  });

  // Security headers
  app.use(helmet());

  // Swagger API docs (available at /api)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SaaS POS API')
    .setDescription('Multi-tenant Point of Sale system API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('stores', 'Store management')
    .addTag('products', 'Product & Inventory management')
    .addTag('expenses', 'Expense tracking')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
}

bootstrap();
