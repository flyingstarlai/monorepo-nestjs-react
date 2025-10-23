## 0. Self-Hosted Policy

- [x] Enforce self-hosted only: no telemetry egress to third parties; disable any SDK default exporters
- [x] Use only self-hosted Prometheus and Grafana; no managed services
- [x] Validate containers/network rules prevent outbound telemetry endpoints

## 1. Implementation

- [x] 1.1 API Logging: Add `nestjs-pino` to `apps/api`
  - [x] Configure JSON logging to stdout
  - [x] Add request ID middleware (use `x-request-id` header; generate if missing)
  - [x] Configure redaction for `authorization`, `cookie`, and body fields like `password`
  - [x] Add minimal docs on log levels and sampling
- [x] 1.2 API Metrics: Add Prometheus endpoint `/metrics`
  - [x] Install `@willsoto/nestjs-prometheus` and expose default node/process metrics
  - [x] Add HTTP server metrics: request count, duration histogram, status labels, path templating
  - [x] Verify `/metrics` returns valid exposition format
- [x] 1.3 Docker Compose: Add Prometheus and Grafana
  - [x] Add `prometheus` service and `prometheus.yml` with scrape target for API
  - [x] Add `grafana` service with anonymous auth disabled; set admin credentials via env
  - [x] Document ports and basic usage
- [x] 1.4 Grafana Dashboard
  - [x] Import a basic dashboard for HTTP latency (p50/p95), error rate, throughput
  - [x] (Optional) Create a simple alert on error rate > 1% over 5m
- [x] 1.5 Docs (Runbook)
  - [x] How to tail logs (docker logs), how to view `/metrics`
  - [x] How to open Grafana and read the dashboard

## 2. Quality

- [x] 2.1 E2E test: `/metrics` endpoint responds 200 and includes standard metrics
- [x] 2.2 Logging redaction sanity: ensure tokens not present in logs during auth flows

## Status: COMPLETE ✅

All logging and monitoring implementation is complete and operational.
