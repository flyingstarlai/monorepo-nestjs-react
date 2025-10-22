import { Module, Get, Controller, Res } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { Response } from 'express';
import { register, Counter, Histogram } from 'prom-client';

// Create HTTP metrics
const httpRequestCounter = new Counter({
  name: 'http_server_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: 'http_server_requests_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

@Controller()
export class MetricsController {
  @Get('metrics')
  async getMetrics(@Res() res: Response) {
    const metrics = await register.metrics();
    res.set('Content-Type', register.contentType);
    res.send(metrics);
  }
}

@Module({
  imports: [
    PrometheusModule.register({
      path: '/internal-metrics',
      defaultMetrics: {
        enabled: true,
        config: {
          labels: {
            app: 'api',
            version: process.env.npm_package_version || 'unknown',
          },
        },
      },
    }),
  ],
  controllers: [MetricsController],
  exports: [],
})
export class AppMetricsModule {
  static getHttpRequestCounter() {
    return httpRequestCounter;
  }

  static getHttpRequestDuration() {
    return httpRequestDuration;
  }
}