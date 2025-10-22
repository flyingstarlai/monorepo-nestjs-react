## Why

We lack consistent, structured observability across apps (API and Web). Today, debugging production issues is slow (no correlation IDs, minimal context), and we cannot measure SLOs (latency, error rate) or proactively detect regressions. A unified Logging + Metrics + Tracing approach improves reliability, speeds incident response, and enables data-driven performance improvements.

## What Changes

- Add cross-cutting Observability capability across API (NestJS) and Web (React), with OSS-first, self-hosted defaults
- Self-Hosted Only Policy: No external telemetry egress; all logs, metrics, and traces remain within our infrastructure
- Logging (API):
  - Adopt structured JSON logging via `nestjs-pino` (or `pino` + custom interceptor)
  - Request/trace correlation: inject `requestId` on every request; propagate via headers
  - Redaction policies for PII/secrets (headers: `authorization`, `cookie`, body fields like `password`)
  - Log levels and sampling guidance; standard fields: `ts`, `level`, `msg`, `reqId`, `userId`, `method`, `path`, `status`, `durMs`
  - Container output to stdout; ship to Loki via Promtail in Docker environments
- Logging (Web):
  - Capture unhandled errors and promise rejections; forward to backend with throttling and PII scrubbing
  - Keep console noise local in dev; no info/debug shipping by default
- Metrics (API):
  - Expose Prometheus metrics at `/metrics` using `prom-client` via `@willsoto/nestjs-prometheus` (or equivalent)
  - Default metrics: process, event-loop, memory, GC; HTTP server metrics (req count, latency, status); DB timings if available
  - Define SLI baselines: `http_server_requests_seconds_bucket`, `http_server_requests_seconds_count`, error rate, p95 latency
- Tracing (API) [Phase 2 optional]:
  - Integrate OpenTelemetry SDK with auto-instrumentation (HTTP, Nest, and DB driver where supported)
  - Export traces via OTLP to OTel Collector; store/visualize in Tempo (Grafana)
  - Propagate trace context to downstream calls and logs (trace/span ids)
- Frontend Metrics/Tracing (Web):
  - Use existing `report-web-vitals.ts` to capture CLS/LCP/FCP/TTFB; keep local in Phase 1; optional shipping via OTel Web SDK to self-hosted Collector in Phase 2; tag by route and build version
  - Optional web tracing (navigation, data-fetch spans) via OTel Web SDK; correlate with API traces through W3C trace headers
- Dashboards & Alerts:
  - Provide Grafana dashboards: API latency (p50/p95), error rate, throughput, DB, and resource usage; Web Core Web Vitals
  - Define alert policies (page/route error rate, p95 latency SLO breaches, 5xx spike) with sensible defaults, disabled until configured
- Local & Prod Tooling (Docker-first):
  - docker-compose: add `grafana` and `prometheus` services with prewired configs; provide `prometheus.yml` scrape config for API
  - Production: optional compose profile; document self-hosted deployment; no external vendors or telemetry egress
- Config & Security:
  - New env vars: `LOG_LEVEL`, `LOG_REDACT_KEYS`, `ENABLE_METRICS`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `REQUEST_ID_HEADER`
  - Ensure logs never contain secrets or sensitive personal data; scoped retention guidance; rotate at infra layer
- Documentation:
  - Runbooks: how to view logs, dashboards, traces; common queries; incident checklist
  - Contribution guidelines: logging patterns, when/what to log, metrics naming conventions, trace span naming

### Recommended Option (Phase 1 default)
- Open-source stack: Prometheus + Grafana only (Phase 1)
- Reasons: simplest to operate, fast adoption, fully self-hosted, easy upgrade path to LGTM later



## Impact

- Affected specs: observability/logging (new), observability/metrics (new), observability/tracing (planned, phase 2), deployment, development-setup
- Affected code:
  - API: `apps/api/src/main.ts`, Nest modules (logger/guards/interceptors), DB provider for timings, health/metrics module
  - Web: `apps/web/src/report-web-vitals.ts`, network layer to propagate trace headers, error boundary
  - Infra: `docker-compose.yml`, `docker-compose.prod.yml`, `nginx/nginx.conf` (access logs); new observability services configs
- Risks:
  - Over-logging -> cost/perf; mitigated by levels/sampling
  - PII leakage -> mitigated by redaction and code review checks
  - Added containers/resources -> provide profiles and opt-in in prod
- Breaking/Behavioral changes:
  - New `/metrics` endpoint on API; additional ports/services in local compose
  - Log format changes to structured JSON (downstream log consumers must adapt)
