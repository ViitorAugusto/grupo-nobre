import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';

describe('GET /api/v1/health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde ok quando o banco está acessível', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200, { status: 'ok' });
  });

  it('rota inexistente devolve o formato único de erro', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/nao-existe').expect(404);
    expect(res.body).toMatchObject({ statusCode: 404, error: 'NAO_ENCONTRADO' });
  });
});
