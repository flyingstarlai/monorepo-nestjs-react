## 0. Self-Hosted Policy
- [ ] Enforce self-hosted only: no telemetry egress to third parties; disable any SDK default exporters
- [ ] Use only self-hosted Prometheus and Grafana; no managed services
- [ ] Validate containers/network rules prevent outbound telemetry endpoints

## 1. Implementation
- [ ] 1.1 API Logging: Add `nestjs-pino` to `apps/api`
  - [ ] Configure JSON logging to stdout
  - [ ] Add request ID middleware (use `x-request-id` header; generate if missing)
  - [ ] Configure redaction for `authorization`, `cookie`, and body fields like `password`
  - [ ] Add minimal docs on log levels and sampling
- [ ] 1.2 API Metrics: Add Prometheus endpoint `/metrics`
  - [ ] Install `@willsoto/nestjs-prometheus` and expose default node/process metrics
  - [ ] Add HTTP server metrics: request count, duration histogram, status labels, path templating
  - [ ] Verify `/metrics` returns valid exposition format
- [ ] 1.3 Docker Compose: Add Prometheus and Grafana
  - [ ] Add `prometheus` service and `prometheus.yml` with scrape target for API
  - [ ] Add `grafana` service with anonymous auth disabled; set admin credentials via env
  - [ ] Document ports and basic usage
- [ ] 1.4 Grafana Dashboard
  - [ ] Import a basic dashboard for HTTP latency (p50/p95), error rate, throughput
  - [ ] (Optional) Create a simple alert on error rate > 1% over 5m
- [ ] 1.5 Docs (Runbook)
  - [ ] How to tail logs (docker logs), how to view `/metrics`
  - [ ] How to open Grafana and read the dashboard

## 2. Quality
- [ ] 2.1 E2E test: `/metrics` endpoint responds 200 and includes standard metrics
- [ ] 2.2 Logging redaction sanity: ensure tokens not present in logs during auth flows

## 3. Follow-ups (Phase 2+)
- [ ] 3.1 Add Loki/Promtail for centralized log search (optional)
- [ ] 3.2 Add OpenTelemetry tracing and propagation
- [ ] 3.3 Web: ship Core Web Vitals and capture unhandled errors with throttling
