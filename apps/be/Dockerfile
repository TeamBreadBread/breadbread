# ============================================================
#  BreadBread BE — Multi-stage Docker Build (Monorepo)
#  Build context: project root (breadbread/)
#  Usage: docker build -f apps/be/Dockerfile .
# ============================================================

# 1. Build stage
FROM node:22-slim AS build
WORKDIR /app

RUN npm install -g pnpm

# Copy workspace config + lockfile
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/be/package.json apps/be/package.json

# Install BE dependencies
RUN pnpm install --frozen-lockfile --filter bread-be

# Copy source and build
COPY apps/be/tsconfig.json apps/be/nest-cli.json apps/be/
COPY apps/be/src apps/be/src
COPY apps/be/static apps/be/static

WORKDIR /app/apps/be
RUN pnpm build

# Create standalone deployment with all deps resolved
RUN pnpm deploy --legacy --filter bread-be --prod /prod/be

# 2. Runtime stage (Distroless)
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app

COPY --from=build /prod/be/node_modules ./node_modules
COPY --from=build /prod/be/dist ./dist
COPY --from=build /app/apps/be/static ./static

EXPOSE 8080
ENV NODE_ENV=production

CMD ["dist/main"]