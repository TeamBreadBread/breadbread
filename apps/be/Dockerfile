# ============================================================
#  BreadBread BE — Multi-stage Docker Build
#  Build context: project root (breadbread/)
#  Usage: docker build -f apps/be/Dockerfile .
# ============================================================

# 1. Build stage
FROM node:22-slim AS build
WORKDIR /app

RUN npm install -g pnpm

# Copy dependency files and install
COPY apps/be/package.json apps/be/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY apps/be/tsconfig.json apps/be/nest-cli.json ./
COPY apps/be/src ./src
COPY apps/be/static ./static
RUN pnpm build

# 2. Runtime stage (Distroless — no shell/package manager, minimal attack surface)
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app

# Copy build artifacts and static files
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/static ./static

EXPOSE 8080
ENV NODE_ENV=production

CMD ["dist/main"]
