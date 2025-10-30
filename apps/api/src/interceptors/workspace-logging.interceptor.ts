import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class WorkspaceLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WorkspaceLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { workspace?: { id: string; slug: string } }>();
    const response = context.switchToHttp().getResponse();

    // Extract workspace information if available
    const workspaceId = request.workspace?.id;
    const workspaceSlug = request.workspace?.slug;

    // Add workspace context to request for logging
    if (workspaceId) {
      request.headers['x-workspace-id'] = workspaceId;
      if (workspaceSlug) {
        request.headers['x-workspace-slug'] = workspaceSlug;
      }
    }

    const startTime = Date.now();
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';

    // Log incoming request with workspace context
    this.logger.log({
      message: 'Incoming request',
      method,
      url,
      ip,
      userAgent,
      workspaceId: workspaceId || null,
      workspaceSlug: workspaceSlug || null,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Log successful response with workspace context
          this.logger.log({
            message: 'Request completed',
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            workspaceId: workspaceId || null,
            workspaceSlug: workspaceSlug || null,
            timestamp: new Date().toISOString(),
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode || 500;

          // Log error with workspace context
          this.logger.error({
            message: 'Request failed',
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack,
            workspaceId: workspaceId || null,
            workspaceSlug: workspaceSlug || null,
            timestamp: new Date().toISOString(),
          });
        },
      })
    );
  }
}
