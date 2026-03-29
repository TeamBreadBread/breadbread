# BreadBread Backend

NestJS REST API server for the BreadBread project.

## Requirements

- Node.js 22
- pnpm

## Environment Variables

Set the following environment variables before running the server:

| Variable | Description |
|---|---|
| `DB_NAME` | PostgreSQL database name |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `CLOUD_SQL_CONNECTION_NAME` | Google Cloud SQL instance connection name (e.g. `project:region:instance`) |

## Running the Server

```bash
pnpm install
pnpm start:dev
```

The server starts on **http://localhost:8080**.

## API Documentation

Once the server is running, access Swagger UI at:

```
http://localhost:8080/swagger-ui
```

Raw OpenAPI spec (YAML):

```
http://localhost:8080/openapi.yaml
```

## Build

```bash
pnpm build
```

## Generate OpenAPI spec (without DB)

```bash
pnpm generate-openapi
```
