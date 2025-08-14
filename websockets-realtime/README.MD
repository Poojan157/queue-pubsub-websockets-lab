# Real-time Submission Processing (WebSocket + Redis Queue + Workers)

> Simple, Dockerized demo showing a WebSocket + HTTP server that accepts code submissions, a Redis-backed queue consumed by multiple workers, and real-time status updates via Redis Pub/Sub forwarded over WebSocket.

![Architecture](https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F085e8ad8-528e-47d7-8922-a23dc4016453%2Fa19ddc6b-fe53-4df3-9166-76e4da9f3f45%2FScreenshot_2024-04-07_at_5.45.42_PM.png?table=block&id=28cb2e3e-0f9b-4741-937f-82dffb19d820&cache=v2)

> **Diagram credit:** Architecture diagram sourced from Harkirat Singh's tutorial — [https://www.youtube.com/watch?v=IJkYipYNEtI](https://www.youtube.com/watch?v=IJkYipYNEtI)

---

## Overview

This repository contains a minimal but realistic demo of a submission-evaluation pipeline built for learning and experimentation. The main goals:

* Accept code submissions over an HTTP API.
* Enqueue jobs in Redis (`jobs:queue`).
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
├─ .gitignore
└─ architecture.png    # (optional) architecture diagram used by README
```

---

## Architecture (plain English)

1. Browser opens a WebSocket connection to the server and stays connected.
2. Browser sends a `POST /submit` with `{ problemId, code, language }` to the same server.
3. Server creates a `jobId`, writes minimal metadata to Redis (`HSET job:{jobId}`), and pushes the job payload into a Redis list (`RPUSH jobs:queue`).
4. One of the worker processes calls `BRPOP jobs:queue` and gets the job, updates the `job:{jobId}` status to `processing`, "executes" the job (simulated here), sets a final status (e.g. `Accepted` / `Wrong Answer` / `Time Limit Exceeded`), then `PUBLISH`es the event to `problem_done`.
5. The server has a Redis subscriber listening on `problem_done`. When a message arrives it forwards it to all connected WebSocket clients (or you can extend routing to send only to the job's owner).

This yields low-latency updates and a clear separation between the HTTP/API surface and CPU-bound work done by workers.

---

## Quickstart (Docker)

Make sure you have Docker and Docker Compose installed.

1. Build and start everything:

```bash
# From repository root
docker compose up --build
```

2. Services once up:

* WebSocket + HTTP server: `http://localhost:3000` (WS `ws://localhost:3000/?userId=<id>`)
* Redis: `localhost:6379`

3. Send a test submission (use your terminal or a HTTP client):

```bash
curl -X POST http://localhost:3000/submit \
  -H "Content-Type: application/json" \
  -d '{"userId":"1","problemId":1,"language":"python","code":"print(1)"}'
```

4. Open a browser console and connect a WebSocket client first then POST the job:

```js
// In browser console
const ws = new WebSocket('ws://localhost:3000/?userId=1');
ws.onmessage = e => console.log('event', JSON.parse(e.data));
```

You should see `processing` and then a final status event from the worker.

To stop and remove containers:

```bash
docker compose down
```

---

## Redis keys & channels used

* **Queue (list):** `jobs:queue` (RPUSH to enqueue, BRPOP to consume)
* **Job metadata (hash):** `job:{jobId}` fields: `status`, `userId`, `problemId`, `createdAt`, `sizeBytes`, `resultRef`
* **Pub/Sub channel:** `problem_done` — workers `PUBLISH` JSON events to this channel
* **Optional per-job events:** `job:{jobId}:events` (RPUSH for durable event backfill)

---

## Message formats

**Submit (HTTP POST /submit)**

```json
{ "userId": "123", "problemId": 1, "language": "python", "code": "print(1)", "sizeBytes": 1234 }
```

**Worker → PubSub event (stringified JSON)**

```json
{ "jobId": "job-abc", "userId": "123", "status": "processing", "ts": 169xxx }
```

**Final event**

```json
{ "jobId":"job-abc", "userId":"123", "status":"Accepted", "result": {"output":"OK"}, "ts": 169xxx }
```

The WebSocket server forwards the exact JSON payload received from `problem_done` to connected clients.

---

## Key implementation notes & gotchas

* **Write job metadata before enqueueing.** The server writes `HSET job:{jobId}` before pushing to `jobs:queue` to avoid races.
* **BRPOP timeout for graceful shutdown.** Use a small timeout (e.g. 1–5s) rather than `0` if you prefer cooperative shutdown checks. The included worker uses a 20s timeout to keep shutdown responsive.
* **Single subscriber instance.** The server duplicates the main Redis client for pub/sub and subscribes once. Don't create a Redis connection per WebSocket — that will exhaust file descriptors under load.
* **Pub/Sub is ephemeral.** Redis pub/sub messages are not persistent. If a WebSocket server goes down, those live events are lost. Use Redis Streams or persist events to a list for replay/backfill if you need durability.
* **Do not execute untrusted code** inside workers without sandboxing. This demo simulates execution; in a real system you must sandbox runs (e.g. using containers, Firecracker, or remote judge services).

---

## Development tips

* Use `docker compose logs -f server` and `docker compose logs -f worker` to watch logs.
* Use `redis-cli` to inspect queues and hashes during debugging:

```bash
# inside container or with redis-cli configured to the host
LRANGE jobs:queue 0 -1
HGETALL job:<jobId>
```

* Set Redis client names for easier debugging:

```js
await client.sendCommand(['CLIENT', 'SETNAME', 'worker-consumer']);
```

---

## Scaling & production notes

* In production you may combine the queue and pubsub into one Redis instance, or use Redis Streams / Kafka for higher durability and replay.
* If you run multiple server instances behind a load balancer, handle WebSocket affinity (sticky sessions) or use a message router so that pubsub events are routed to the correct node.
* Monitor memory, file descriptors, and connection counts when you scale workers or sockets.

---

## Troubleshooting

* **WebSocket doesn't receive events:** ensure the server is subscribed to `problem_done`, the worker `PUBLISH`es to the same Redis instance, and that WebSocket connects to the correct host/port.
* **Jobs stuck in queue:** check `LRANGE jobs:queue 0 -1` and ensure worker(s) are connected and using the same Redis host.
* **Shutdown hangs on Ctrl+C:** see graceful shutdown notes — use a BRPOP timeout or a shutdown timeout fallback when calling `quit()`.

---

## License

This project is provided for learning and demonstration. Adjust the license as appropriate for your use.

---

## Credits

* Inspired by **Harkirat Singh's** YouTube tutorial on Redis architecture and real-time systems. Check out the tutorial: [https://www.youtube.com/watch?v=IJkYipYNEtI](https://www.youtube.com/watch?v=IJkYipYNEtI)
