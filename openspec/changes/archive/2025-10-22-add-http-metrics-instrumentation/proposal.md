## Why

The current API metrics setup is incomplete - while Prometheus and Grafana are properly configured, the API only exposes basic process metrics. The Grafana dashboard expects HTTP-specific metrics (request latency, rate, error rate) that are missing, causing three out of four dashboard panels to show "No data". This limits our ability to monitor API performance, track SLOs, and detect issues proactively.

## What Changes

- Add HTTP request metrics instrumentation to the NestJS API using existing `@willsoto/nestjs-prometheus` package
- Implement proper HTTP metrics collection that matches the Grafana dashboard expectations:
  - `http_server_requests_duration_seconds_bucket` for latency histograms (p50, p95)
  - `http_server_requests_total` for request counters with method/route/status labels
  - Proper bucket configuration for meaningful latency percentiles
- Add route-based labeling instead of raw paths to avoid cardinality explosion
- Ensure metrics include standard labels: method, route, status_code
- Configure appropriate histogram buckets for API response times (5ms to 10s range)

## Impact

- Affected specs: observability/metrics (extend existing implementation)
- Affected code: `apps/api/src/app.module.ts`, potentially add new interceptor or middleware
- Benefits: Complete observability picture, all Grafana dashboard panels functional
- Risks: Minimal - uses existing dependencies, just adds proper configuration
- Breaking changes: None - only adds new metrics, doesn't modify existing behavior
