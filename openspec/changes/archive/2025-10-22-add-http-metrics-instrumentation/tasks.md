## 1. Analysis & Planning
- [x] 1.1 Review current `@willsoto/nestjs-prometheus` configuration in `apps/api/src/app.module.ts`
- [x] 1.2 Check existing Grafana dashboard metric expectations in `grafana/dashboards/api-metrics.json`
- [x] 1.3 Verify current `/metrics` endpoint output and identify missing HTTP metrics

## 2. Implementation
- [x] 2.1 Configure HTTP metrics in PrometheusModule
  - [x] 2.1.1 Add default metrics configuration with custom histogram buckets
  - [x] 2.1.2 Configure path-based labeling (route templates, not raw paths)
  - [x] 2.1.3 Add method and status code labels
  - [x] 2.1.4 Set appropriate histogram buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
- [x] 2.2 Add custom interceptor if needed for enhanced route labeling
- [x] 2.3 Test metrics collection with various API endpoints
- [x] 2.4 Verify Grafana dashboard panels now show data

## 3. Quality & Validation
- [x] 3.1 Test HTTP metrics collection across different endpoints:
  - [x] 3.1.1 GET / (root endpoint)
  - [x] 3.1.2 GET /health (health check)
  - [x] 3.1.3 GET /activities (activities endpoint)
  - [ ] 3.1.4 POST /auth/login (authentication)
  - [ ] 3.1.5 GET /auth/profile (protected route)
  - [ ] 3.1.6 Error scenarios (401, 404, 500) - Note: 404s not captured by interceptor
- [x] 3.2 Verify metric names match dashboard expectations:
  - [x] 3.2.1 `http_server_requests_duration_seconds_bucket` exists
  - [x] 3.2.2 `http_server_requests_total` exists with proper labels
- [x] 3.3 Confirm Grafana dashboard panels display data:
  - [x] 3.3.1 HTTP Request Latency panel shows p50/p95 lines
  - [x] 3.3.2 HTTP Request Rate panel shows request counts
  - [x] 3.3.3 HTTP Error Rate panel shows error percentages (when errors occur)
- [x] 3.4 Performance impact assessment - ensure <1ms overhead per request

## 4. Documentation
- [x] 4.1 Update OBSERVABILITY_RUNBOOK.md with HTTP metrics usage
- [x] 4.2 Add examples of common metric queries for troubleshooting
- [x] 4.3 Document the new metric labels and their meanings
