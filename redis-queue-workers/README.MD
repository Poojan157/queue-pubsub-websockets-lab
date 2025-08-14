# redis-queue-workers implementation

Simple Redis-based job queue system with HTTP producer and multiple worker consumers.

![Architecture](https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F085e8ad8-528e-47d7-8922-a23dc4016453%2F1a563dff-974c-4442-bcca-732b4b17a17f%2FScreenshot_2024-04-07_at_5.41.38_PM.png?table=block&id=1deded56-46a6-4185-b309-36dd27a8c384&cache=v2)

## Overview

This project demonstrates a basic job queue implementation using:
- HTTP server that accepts submissions and pushes them to Redis queue
- Multiple worker processes that consume jobs from the queue
- Docker setup for easy scaling

## How it works

1. HTTP server receives POST requests with code submissions
2. Server pushes job to Redis list using `LPUSH problems`
3. Workers block on Redis queue using `BRPOP problems 0`
4. Workers process jobs and simulate execution (1 second delay)

## Files

```
├── index.js           # HTTP server (producer)
├── worker.js          # Job consumer
├── Dockerfile         # Container build
├── docker-compose.yml # Multi-service setup
├── package.json
└── package-lock.json
```

## Message Format

Jobs are JSON strings stored in Redis:

```json
{
  "problemId": "123",
  "code": "print('hello')",
  "language": "python"
}
```

## Quick Start

### With Docker (recommended)

1. Start all services:
```bash
docker-compose up --build
```

2. Scale workers (optional):
```bash
docker-compose up --build --scale worker=4
```

3. Test submission:
```bash
curl -X POST http://localhost:3000/submit \
  -H "Content-Type: application/json" \
  -d '{"problemId":"1","code":"print(1)","language":"python"}'
```

4. Check logs:
```bash
docker-compose logs -f worker
```

### Without Docker

1. Start Redis:
```bash
redis-server
```

2. Install dependencies:
```bash
npm install
```

3. Start server:
```bash
node index.js
```

4. Start workers (separate terminals):
```bash
node worker.js
```

## Redis Operations

- **Producer**: `LPUSH problems` (adds jobs to queue)
- **Consumer**: `BRPOP problems 0` (blocks until job available)
- **Queue name**: `problems`

## Environment Variables

- `REDIS_URL`: Redis connection string (default: `redis://redis:6379`)

## Scaling

Add more workers by scaling the service:

```bash
docker-compose up --scale worker=8
```

Each worker runs independently and Redis distributes jobs among them.

## Development

Watch logs during development:

```bash
# Server logs
docker-compose logs -f app

# Worker logs  
docker-compose logs -f worker

# All logs
docker-compose logs -f
```

Check Redis queue status:
```bash
# Connect to redis container
docker exec -it my_redis redis-cli

# Check queue length
LLEN problems

# View jobs in queue
LRANGE problems 0 -1
```

## Notes

- Workers process jobs one at a time with simulated 1-second delay
- No job persistence - if worker crashes during processing, job is lost
- No pub/sub or WebSocket features in this implementation
- Container names can be customized in docker-compose.yml

## Credits

Based on tutorial: https://www.youtube.com/watch?v=IJkYipYNEtI
