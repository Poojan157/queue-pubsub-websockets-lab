# queue-pubsub-websockets-lab

A collection of Redis-based distributed systems implementations demonstrating job queues, pub/sub messaging, and real-time WebSocket communication.

## Overview

This repository contains two distinct but complementary implementations that showcase different Redis patterns for building scalable, real-time applications. Both projects are based on architectures covered in Harkirat Singh's excellent YouTube tutorial series.

## Projects

### 🔄 [redis-queue-workers](./redis-queue-workers)

A simple but robust job queue system demonstrating the producer-consumer pattern using Redis lists.

**Key Features:**
- HTTP API for job submission
- Redis-backed job queue (`LPUSH`/`BRPOP`)
- Scalable worker processes
- Docker containerization
- Load distribution across multiple workers

**Architecture:**
![Redis Queue Architecture](https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F085e8ad8-528e-47d7-8922-a23dc4016453%2F1a563dff-974c-4442-bcca-732b4b17a17f%2FScreenshot_2024-04-07_at_5.41.38_PM.png?table=block&id=1deded56-46a6-4185-b309-36dd27a8c384&cache=v2)

**Use Cases:**
- Background job processing
- Task distribution
- Asynchronous workload handling

---

### 🌐 [websockets-realtime](./websockets-realtime)

A real-time submission processing system combining job queues with WebSocket-based live updates using Redis pub/sub.

**Key Features:**
- WebSocket connections for real-time updates
- Redis pub/sub for event broadcasting
- Combined HTTP + WebSocket server
- Live status updates during job processing
- Multi-client real-time communication

**Architecture:**
![WebSocket + Pub/Sub Architecture](https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F085e8ad8-528e-47d7-8922-a23dc4016453%2Fa19ddc6b-fe53-4df3-9166-76e4da9f3f45%2FScreenshot_2024-04-07_at_5.45.42_PM.png?table=block&id=28cb2e3e-0f9b-4741-937f-82dffb19d820&cache=v2)

**Use Cases:**
- Real-time dashboards
- Live progress tracking
- Instant notifications
- Collaborative applications

## Getting Started

Each project is self-contained with its own README, dependencies, and Docker setup. Choose the implementation that best fits your needs:

1. **For simple job processing**: Start with `redis-queue-workers`
2. **For real-time features**: Check out `websockets-realtime`
3. **For learning both patterns**: Explore both implementations

### Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd queue-pubsub-websockets-lab

# Choose a project
cd redis-queue-workers
# OR
cd websockets-realtime

# Follow the individual README instructions
docker-compose up --build
```

## Learning Path

These implementations follow a progressive learning approach:

1. **Start with redis-queue-workers** to understand:
   - Redis list operations
   - Producer-consumer patterns
   - Worker scaling
   - Basic job processing

2. **Move to websockets-realtime** to learn:
   - WebSocket integration
   - Redis pub/sub messaging
   - Real-time communication
   - Event-driven architecture

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - HTTP server framework
- **Redis** - In-memory data store for queues and pub/sub
- **WebSocket** - Real-time bidirectional communication
- **Docker** - Containerization and orchestration

## Architecture Patterns Demonstrated

### Producer-Consumer Pattern
- Decoupled job submission and processing
- Horizontal scaling of workers
- Load distribution via Redis queues

### Pub/Sub Messaging
- Event-driven architecture
- Real-time notifications
- Broadcast messaging to multiple clients

### Microservices Communication
- Service separation and isolation
- Redis as message broker
- Container orchestration

## Educational Value

These projects are excellent for understanding:

- **Distributed Systems**: How components communicate asynchronously
- **Scalability**: Horizontal scaling patterns with Redis
- **Real-time Applications**: WebSocket integration with backend services
- **Docker**: Container orchestration and service discovery
- **Redis**: Advanced usage beyond simple caching

## Credits and Learning Resources

This repository implements architectures and patterns taught in **Harkirat Singh's** YouTube tutorial:

🎥 **Watch the Tutorial**: [https://www.youtube.com/watch?v=IJkYipYNEtI](https://www.youtube.com/watch?v=IJkYipYNEtI)

The tutorial provides excellent context and deeper explanations of the architectural decisions implemented in these projects.

## Contributing

Feel free to:
- Add new Redis patterns
- Improve error handling
- Add monitoring and metrics
- Extend with additional features
- Fix bugs or optimize performance

## License

This project is for educational purposes. Feel free to use it as a learning resource or starting point for your own implementations.
