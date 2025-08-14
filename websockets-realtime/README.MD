# Real-time Submission Processing (WebSocket + Redis Queue + Workers)

> Simple, Dockerized demo showing a WebSocket + HTTP server that accepts code submissions, a Redis-backed queue consumed by multiple workers, and real-time status updates via Redis Pub/Sub forwarded over WebSocket.

![Architecture](https://camo.githubusercontent.com/95fd8cff858073ab8441db7f2be2d8b5216ee5751a8f569ec11aea22f189c8f8/68747470733a2f2f7777772e6e6f74696f6e2e736f2f696d6167652f687474707325334125324625324670726f642d66696c65732d7365637572652e73332e75732d776573742d322e616d617a6f6e6177732e636f6d25324630383565386164382d353238652d343764372d383932322d61323364633430313634353325324661313964646336622d666535332d346466332d393136362d37366534646139663366343525324653637265656e73686f745f323032342d30342d30375f61745f352e34352e34325f504d2e706e673f7461626c653d626c6f636b2669643d32386362326533652d306639622d343734312d393337662d3832646666623139643832302663616368653d7632)

> **Diagram credit:** Architecture diagram from Harkirat Singh's YouTube tutorial — [https://www.youtube.com/watch?v=IJkYipYNEtI](https://www.youtube.com/watch?v=IJkYipYNEtI)

---

## Overview

This repository contains a minimal but realistic demo of a submission-evaluation pipeline built for learning and experimentation. The main goals:

* Accept code submissions over an HTTP API.
* Enqueue jobs in Redis using `LPUSH` to a `problems` queue.
* Have one or more worker processes `BRPOP` the queue, "process" the job (simulated), and publish status updates to a Redis pub/sub channel (`problem_done`).
* Forward published status updates to connected browser clients over WebSocket in real time.
* Run everything locally using Docker Compose (1 Redis, 1 combined HTTP+WS server, 3 workers by default).

This is intentionally small and opinionated so you can run, play, and extend it in a single afternoon.

---

## Contents

```
project/
├─ index.js            # Combined HTTP + WebSocket server
├─ worker.js           # Worker that BRPOP's jobs and publishes results
├─ package.json
├─ package-lock.json
├─ Dockerfile
├─ docker-compose.yml
├─ .dockerignore
└─ .gitignore
```

---

## Architecture Flow

1. **Client connects WebSocket** to the server and stays connected.
2. **Client sends POST /submit** with `{ problemId, code, language }` to the same server.
3. **Server enqueues submission** using `LPUSH problems` with the job payload as JSON.
4. **Worker pops job** using `BRPOP problems 20` and processes the submission (simulated with 5s delay).
5. **Worker publishes result** to `problem_done` channel with a random status (`Accepted`, `Wrong Answer`, `Time Limit Exceeded`).
6. **Server forwards result** to all connected WebSocket clients in real time.

This yields low-latency updates and clean separation between the HTTP/API surface and CPU-bound work done by workers.

---

## Quickstart (Docker)

Make sure you have Docker and Docker Compose installed.

1. Build and start everything:

```bash
# From repository root
docker compose up --build
```

2. Services once up:

* WebSocket + HTTP server: `http://localhost:3000` (WS `ws://localhost:3000`)
* Redis: `localhost:6379`

3. Send a test submission (use your terminal or a HTTP client):

```bash
curl -X POST http://localhost:3000/submit \
  -H "Content-Type: application/json" \
  -d '{"problemId":"1","code":"print(1)","language":"python"}'
```

4. Open a browser console and connect a WebSocket client:

```js
// In browser console
const ws = new WebSocket('ws://localhost:3000');
ws.onmessage = e => console.log('Result:', JSON.parse(e.data));
ws.onopen = () => console.log('WebSocket connected');
```

You should see the submission result after ~5 seconds of processing.

To stop and remove containers:

```bash
docker compose down
```

---

## Redis Usage

* **Queue (list):** `problems` - submissions are pushed with `LPUSH`, workers consume with `BRPOP`
* **Pub/Sub channel:** `problem_done` - workers publish results, server subscribes and forwards to WebSocket clients

---

## Message Formats

**Submit (HTTP POST /submit)**

```json
{
  "problemId": "1",
  "code": "print('Hello World')",
  "language": "python"
}
```

**Worker Result (published to problem_done)**

```json
{
  "problemId": "1",
  "code": "print('Hello World')",
  "language": "python",
  "status": "Accepted"
}
```

The WebSocket server forwards the exact JSON payload from `problem_done` to all connected clients.

---

## Key Implementation Details

* **LPUSH/BRPOP for queue**: Server uses `LPUSH problems` to enqueue, workers use `BRPOP problems 20` with 20s timeout for graceful shutdown.
* **Duplicate Redis client for pub/sub**: Server creates a separate subscriber client to avoid blocking the main client.
* **Broadcast to all WebSockets**: Current implementation sends results to all connected clients. You can extend this to route messages to specific users.
* **Simulated processing**: Workers sleep for 5 seconds and return a random status. Replace this with actual code execution in production.
* **Graceful shutdown**: Both server and workers handle SIGINT properly, closing Redis connections cleanly.

---

## Development Tips

* Use `docker compose logs -f server` and `docker compose logs -f worker` to watch logs.
* Use `redis-cli` to inspect the queue during debugging:

```bash
# Check queue length and contents
LLEN problems
LRANGE problems 0 -1

# Monitor pub/sub activity
MONITOR
```

---

## Scaling Notes

* Add more worker replicas in `docker-compose.yml` to increase throughput.
* For production, implement proper sandboxing for code execution (containers, VMs, etc.).
* Consider using Redis Streams instead of pub/sub for message durability and replay capability.
* Add user-specific routing instead of broadcasting to all WebSocket connections.

---

## Troubleshooting

* **WebSocket doesn't receive events**: Check that server is subscribed to `problem_done` and workers are publishing to the same Redis instance.
* **Jobs stuck in queue**: Use `LLEN problems` to check queue and ensure workers are running.
* **Connection issues**: Verify Redis is running and accessible at the configured URL.

---

## Credits

* Inspired by **Harkirat Singh's** YouTube tutorial on Redis architecture and real-time systems: [https://www.youtube.com/watch?v=IJkYipYNEtI](https://www.youtube.com/watch?v=IJkYipYNEtI)
