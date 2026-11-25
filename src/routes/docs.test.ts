import { describe, expect, it } from 'vitest';
import { makeApp } from '../app';
import { makeMiddleware } from '../middleware';
import { Queries } from '../database/queries';
import request from 'supertest';
import pino from 'pino';

describe('docs router', () => {
  const app = makeApp({
    queries: {} as Queries,
    middleware: makeMiddleware(pino({ level: 'silent' })),
  });

  describe('GET /docs.json', () => {
    it('responds with the OpenAPI specification', async () => {
      const response = await request(app).get('/docs.json');
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.openapi).toMatch(/^3\./);
      expect(Object.keys(response.body.paths)).toEqual(
        expect.arrayContaining(['/health', '/health/deep', '/people', '/people/{id}']),
      );
    });
  });

  describe('GET /docs/', () => {
    it('serves the Swagger UI page', async () => {
      const response = await request(app).get('/docs/');
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('swagger-ui');
    });
  });
});
