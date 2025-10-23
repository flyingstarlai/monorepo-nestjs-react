import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppMetricsModule } from '../modules/metrics/metrics.module';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Get route pattern (not raw path with IDs)
    const route = this.getRoutePattern(request);
    const method = request.method;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - startTime) / 1000; // Convert to seconds
          const statusCode = response.statusCode.toString();

          // Record metrics
          AppMetricsModule.getHttpRequestCounter().inc({
            method,
            route,
            status_code: statusCode,
          });
          AppMetricsModule.getHttpRequestDuration().observe(
            { method, route, status_code: statusCode },
            duration
          );
        },
        error: () => {
          const duration = (Date.now() - startTime) / 1000; // Convert to seconds
          const statusCode = response.statusCode?.toString() || '500';

          // Record metrics
          AppMetricsModule.getHttpRequestCounter().inc({
            method,
            route,
            status_code: statusCode,
          });
          AppMetricsModule.getHttpRequestDuration().observe(
            { method, route, status_code: statusCode },
            duration
          );
        },
      })
    );
  }

  private getRoutePattern(request: Request): string {
    // Extract route pattern from request
    const path = request.route?.path || request.path;

    // Convert numeric IDs to placeholder
    return path.replace(/\/\d+/g, '/{id}');
  }
}
