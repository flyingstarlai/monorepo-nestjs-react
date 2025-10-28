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
    const request = context.switchToHttp().getRequest<Request & { workspace?: { id: string } }>();
    const response = context.switchToHttp().getResponse<Response>();
    const method = request.method;
    const route = this.getRoutePattern(request);
    const controller = request.route?.path?.split('/')[1] || 'unknown';
    
    // Extract workspace ID if available
    const workspaceId = request.workspace?.id;
    
    // Capture start time
    const startTime = Date.now();

    // Prepare labels
    const baseLabels = {
      method,
      route,
      status_code: '', // Will be set in tap handlers
    };

    // Add workspace_id if available
    const labels = workspaceId 
      ? { ...baseLabels, workspace_id: workspaceId.toString() }
      : baseLabels;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - startTime) / 1000; // Convert to seconds
          const statusCode = response.statusCode.toString();

          // Record metrics with workspace ID if available
          const finalLabels = workspaceId 
            ? { ...labels, status_code: statusCode }
            : { ...baseLabels, status_code: statusCode };

          AppMetricsModule.getHttpRequestCounter().inc(finalLabels);
          AppMetricsModule.getHttpRequestDuration().observe(
            finalLabels,
            duration
          );
        },
        error: () => {
          const duration = (Date.now() - startTime) / 1000; // Convert to seconds
          const statusCode = response.statusCode?.toString() || '500';

          // Record metrics with workspace ID if available
          const finalLabels = workspaceId 
            ? { ...labels, status_code: statusCode }
            : { ...baseLabels, status_code: statusCode };

          AppMetricsModule.getHttpRequestCounter().inc(finalLabels);
          AppMetricsModule.getHttpRequestDuration().observe(
            finalLabels,
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
