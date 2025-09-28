# nodejs-backend-ts

A scalable, TypeScript-based Node.js backend boilerplate with clustering, modular routing, and middleware support. Designed for maintainability, performance, and extensibility.

## Features

- **TypeScript-first**: Modern, strict TypeScript configuration.
- **Clustering**: Utilizes all available CPU cores for maximum performance.
- **Modular Routing**: Easily add new modules and routes.
- **Custom Middleware**: Compose and apply middleware for logging, security, and more.
- **Environment Config**: Uses `.env` for configuration.
- **Testing**: Integrated with [Vitest](https://vitest.dev/) for unit and integration tests.
- **Linting**: ESLint for code quality.
- **Logging**: Uses Winston for structured logging.
- **MongoDB Ready**: Includes MongoDB integration (see `infra/db/mongodb.ts`).

## Getting Started

### Prerequisites

- Node.js 20+

### Installation

```sh
npm install
# or
yarn install
```

## Project Structure

```
src/
  index.ts                # Entry point, clustering, server bootstrap
  common/                 # Shared utilities (e.g., logger)
  core/                   # Core server, router, middleware, types, constants
  infra/db/               # Database integrations (e.g., MongoDB)
  modules/healthcheck/    # Example module with controller and routes
  shared/                 # (Reserved for shared domain logic)
```

## API

### Healthcheck

- `GET /healthcheck` — Returns `{ pid: <process id> }` if the server is running and the correct `x-secret-key` header is provided.

#### Example

```sh
curl -H "x-secret-key: 42" http://localhost:5000/healthcheck
```

## Configuration

Environment variables (see `.env`):

- `PORT` — Server port (default: 5000)
- `HOST` — Server host (default: 0.0.0.0)
- `SECRET_KEY` — Secret key for protected routes (default: 42)
- `MAX_NUM_CPUS` — Max number of cluster workers (default: 1)

### Development

```sh
npm run dev
```

### Build

```sh
npm run build
```

### Start (Production)

```sh
npm start
```

### Lint

```sh
npm run lint
```

### Test

```sh
npm test
```

## License

ISC
