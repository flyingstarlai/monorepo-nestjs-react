# Observability Runbook

This guide covers how to use the logging and monitoring infrastructure for the dashboard application.

## Quick Start

### Starting the Observability Stack

```bash
# Start the full stack with observability
docker-compose --profile observability up -d

# Or start individual services
docker-compose up -d api db
docker-compose --profile observability up -d prometheus grafana
```

### Access Points

- **API**: http://localhost:3000
- **API Metrics**: http://localhost:3000/metrics
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin123)

## Logs

### Viewing API Logs

```bash
# Follow logs in real-time
docker logs -f dashboard-api-dev

# View last 100 lines
docker logs --tail 100 dashboard-api-dev

# Filter by log level
docker logs dashboard-api-dev | grep '"level":"error"'
```

### Log Format

Logs are structured JSON with the following fields:
- `ts`: Timestamp
- `level`: Log level (trace, debug, info, warn, error, fatal)
- `msg`: Log message
- `reqId`: Request correlation ID
- `method`: HTTP method
- `url`: Request URL
- `statusCode`: Response status code
- `responseTime`: Request duration in milliseconds

### Request Correlation

Each request gets a unique `reqId` that's included in logs and propagated via the `x-request-id` header. Use this to trace requests across the system.

### Searching Logs

```bash
# Find all logs for a specific request
docker logs dashboard-api-dev | grep '"reqId":"<request-id>"'

# Find slow requests (>1000ms)
docker logs dashboard-api-dev | grep '"responseTime":[0-9]\{4,\}'

# Find error responses
docker logs dashboard-api-dev | grep '"statusCode":[45][0-9][0-9]'
```

## Metrics

### Accessing Metrics

Visit http://localhost:3000/metrics to see the raw Prometheus metrics output.

### Key Metrics

#### HTTP Metrics
- `http_server_requests_total`: Total HTTP requests by method, status, and route
- `http_server_requests_duration_seconds`: Request duration histogram
- `http_server_requests_duration_seconds_bucket`: Duration percentiles

**Metric Labels:**
- `method`: HTTP method (GET, POST, PUT, DELETE)
- `route`: Route pattern (e.g., `/users/{id}` instead of `/users/123`)
- `status_code`: HTTP status code (200, 404, 500, etc.)

**Route Pattern Normalization:**
Numeric IDs in URLs are automatically converted to `{id}` placeholders to group metrics by route pattern rather than specific resources.

#### Process Metrics
- `process_resident_memory_bytes`: Memory usage
- `process_cpu_seconds_total`: CPU usage
- `nodejs_heap_size_used_bytes`: Node.js heap usage

### Prometheus Queries

#### Latency
```promql
# 95th percentile latency
histogram_quantile(0.95, rate(http_server_requests_duration_seconds_bucket[5m]))

# 50th percentile latency
histogram_quantile(0.50, rate(http_server_requests_duration_seconds_bucket[5m]))
```

#### Request Rate
```promql
# Requests per second by status
rate(http_server_requests_total[5m])

# Error rate
rate(http_server_requests_total{status=~"5.."}[5m]) / rate(http_server_requests_total[5m]) * 100
```

#### Resource Usage
```promql
# Memory usage
process_resident_memory_bytes

# CPU usage
rate(process_cpu_seconds_total[5m])
```

## Grafana

### Accessing Grafana

1. Go to http://localhost:3001
2. Login with admin/admin123
3. The "API Metrics" dashboard is pre-configured

### Dashboard Features

The API Metrics dashboard includes:
- **HTTP Request Latency**: p50 and p95 response times
- **HTTP Request Rate**: Requests per second by status
- **HTTP Error Rate**: Percentage of 5xx responses
- **Memory Usage**: Process memory consumption

### Creating Alerts

1. Go to the dashboard panel
2. Click the alert icon (bell)
3. Set conditions (e.g., error rate > 1% for 5 minutes)
4. Configure notification channels

## Troubleshooting

### Common Issues

#### Metrics Not Available
```bash
# Check if API is running
curl http://localhost:3000/metrics

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets
```

#### Grafana Can't Connect to Prometheus
1. Verify Prometheus is running: `docker ps | grep prometheus`
2. Check Prometheus configuration: `docker exec dashboard-prometheus-dev cat /etc/prometheus/prometheus.yml`
3. Test connection: `curl http://localhost:9090/api/v1/query?query=up`

#### High Memory Usage
```bash
# Check container resource usage
docker stats

# Check API memory metrics
curl -s http://localhost:3000/metrics | grep process_resident_memory_bytes
```

### Performance Investigation

1. **Identify Slow Requests**:
   ```bash
   docker logs dashboard-api-dev | grep '"responseTime":[0-9]\{4\}' | head -10
   ```

2. **Check Error Patterns**:
   ```promql
   # Top error endpoints
   topk(10, rate(http_server_requests_total{status=~"5.."}[5m]))
   ```

3. **Monitor Resource Usage**:
   ```promql
   # Memory trend
   rate(process_resident_memory_bytes[1h])
   ```

## Security Considerations

### Log Redaction
The following fields are automatically redacted in logs:
- `authorization` headers
- `cookie` headers
- `password` fields in request body
- `token` fields in request body
- `secret` fields in request body

### Access Control
- Change default Grafana credentials in production
- Use environment variables for sensitive configuration
- Restrict access to metrics endpoints in production

## Environment Variables

### Logging
- `LOG_LEVEL`: Set log level (trace, debug, info, warn, error, fatal)
- `NODE_ENV`: Set to production for JSON logs (no pretty printing)

### Metrics
- `ENABLE_METRICS`: Enable/disable metrics endpoint (default: true)

## Production Deployment

### Docker Compose Production
```bash
# Use production compose file
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile observability up -d
```

### Monitoring Checklist
- [ ] Update default passwords
- [ ] Configure log retention policies
- [ ] Set up backup for Grafana dashboards
- [ ] Configure alerting
- [ ] Monitor disk usage for metrics storage
- [ ] Set up log rotation

## Incident Response

### High Error Rate
1. Check Grafana error rate panel
2. Filter logs by error status codes
3. Identify affected endpoints
4. Check recent deployments

### High Latency
1. Review p95 latency in Grafana
2. Check for slow database queries
3. Monitor resource utilization
4. Look for memory leaks

### Service Down
1. Check container status: `docker ps`
2. Review container logs: `docker logs <container>`
3. Verify resource availability
4. Check configuration changes