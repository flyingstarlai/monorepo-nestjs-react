import { beforeEach, describe, it } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it('/metrics (GET)', () => {
    return request(app.getHttpServer())
      .get('/metrics')
      .expect(200)
      .expect((res) => {
        // Verify it's Prometheus format
        expect(res.text).toContain('# HELP');
        expect(res.text).toContain('# TYPE');
        // Verify basic metrics are present
        expect(res.text).toContain('process_resident_memory_bytes');
        expect(res.text).toContain('nodejs_heap_size_used_bytes');
      });
  });
});
