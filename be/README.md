# BreadBread Backend

Spring Boot REST API server for the BreadBread (Bbang Taxi) project.

## Requirements

- Java 17
- Gradle

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
./gradlew bootRun
```

The server starts on **http://localhost:8080**.

## API Documentation

Once the server is running, access Swagger UI at:

```
http://localhost:8080/swagger-ui.html
```

Raw OpenAPI spec (JSON):

```
http://localhost:8080/api-docs
```

## Build

```bash
./gradlew build
```
