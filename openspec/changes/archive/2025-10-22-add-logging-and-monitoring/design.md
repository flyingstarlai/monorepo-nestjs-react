## Context

We want a simple, low-ops observability setup focused on logging and monitoring. Priorities: fast adoption, minimal infra, cost control. Tracing can come later.

## Goals / Non-Goals

- Goals:
  - Structured JSON logs from API with request correlation and redaction
  - Basic HTTP and process metrics exposed on `/metrics`
  - Visualize metrics and create simple alerts via Grafana
  - Keep local and prod setups similar
- Non-Goals:
  - Full distributed tracing (defer)
  - Centralized log storage/queries (Loki) at initial phase
  - Complex collectors/agents

## Constraints

- Self-hosted only: no external SaaS dependencies; no telemetry egress to third parties
- Disable/avoid any SDK defaults that send data externally

## Architecture (Simple)

- API (NestJS)
  - Logging: `nestjs-pino` outputs JSON to stdout
  - Request ID: middleware generates `reqId` if missing; propagate via header `x-request-id`
  - Redaction: hide `authorization`, `cookie`, and sensitive body fields
  - Metrics: `/metrics` with Prometheus format using `@willsoto/nestjs-prometheus`
- Web (React)
  - Leave console logs local in dev
  - Optionally send unhandled errors to API as structured log entries (rate limited)
  - Defer Web Vitals shipping; keep current local reporting
- Infra (Docker Compose)
  - Add Prometheus to scrape `apps/api` at `/metrics`
  - Add Grafana to visualize and alert on Prometheus data
  - No Loki/Tempo/OTel Collector in phase 1

### ASCII Diagram

```
[apps/web]
    |
    |  (optional error POST)
    v
[apps/api (Nest)] -- /metrics --> [Prometheus] --> [Grafana]
       |
       |  JSON logs to stdout (docker logs)
       v
   (operator reads via docker logs; add Loki later if needed)
```

## Decisions

- Self-hosted only: do not use SaaS telemetry services; keep all data in our infra
- Use `nestjs-pino` for structured logging and HTTP request auto-logging
- Generate and propagate `x-request-id`; include `reqId` in logs
- Redact secrets at logger level
- Expose `/metrics`; include HTTP request counters, histograms, and default Node process metrics
- Provide `prometheus.yml` and basic Grafana dashboard provisioning (optional)

## Risks / Trade-offs

- No centralized log search: debugging spans multiple containers; mitigated by adding Loki later if needed
- No tracing: limited cross-service correlation; mitigated by `reqId` and metrics
- Alert noise: start with minimal SLOs and quiet defaults

## Migration Plan (Phase 1)

1. API: integrate `nestjs-pino` with redaction, request ID
2. API: add `/metrics` with HTTP metrics and defaults
3. Compose: add Prometheus and Grafana services; mount `prometheus.yml`
4. Grafana: import a basic dashboard (HTTP p95 latency, error rate)
5. Docs: short runbook (how to check logs, hit `/metrics`, open Grafana)

## Open Questions

- Should we add a minimal endpoint for web error forwarding now, or wait?
- Do we want Grafana alerting in phase 1, or only dashboards?
- Which environment will run Grafana in prod (self-hosted cluster, single VM, or container service)?
