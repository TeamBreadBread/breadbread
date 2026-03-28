# 1. 빌드 환경
FROM node:22-slim AS build
WORKDIR /app

RUN npm install -g pnpm

# 의존성 파일 복사 및 설치
COPY be/package.json be/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 소스 복사 및 빌드
COPY be/tsconfig.json be/nest-cli.json ./
COPY be/src ./src
COPY be/static ./static
RUN pnpm build

# 2. 실행 환경 (Distroless — 쉘/패키지 매니저 없음, 최소 공격 표면)
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app

# 빌드 결과물 및 정적 파일 복사
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/static ./static

EXPOSE 8080
ENV NODE_ENV=production

CMD ["dist/main"]
