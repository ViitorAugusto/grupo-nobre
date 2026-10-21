import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import type { Env } from './config/env.js';
import { ApiExceptionFilter } from './shared/http/api-exception.filter.js';
import { createValidationPipe } from './shared/http/validation.js';

export const API_PREFIX = 'api/v1';

export function configureApp(app: INestApplication): void {
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.setGlobalPrefix(API_PREFIX);
  app.use(helmet());
  app.enableCors({ origin: config.get('CORS_ORIGIN', { infer: true }) });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('CRM Nobre Brindes')
      .setDescription('Contrato completo em docs/api/contrato-api.md')
      .setVersion('1')
      .build(),
  );
  SwaggerModule.setup(`${API_PREFIX}/docs`, app, document);
}
