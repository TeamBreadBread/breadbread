# 1. 빌드 환경
FROM node:22-slim AS build
WORKDIR /app

RUN corepack enable

# 의존성 파일 복사 및 설치
COPY be/package.json be/.yarnrc.yml ./
RUN yarn install --immutable

# 소스 복사 및 빌드
COPY be/tsconfig.json be/nest-cli.json ./
COPY be/src ./src
COPY be/static ./static
RUN yarn build

# 2. 실행 환경 (Distroless — 쉘/패키지 매니저 없음, 최소 공격 표면)
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app

# PnP 런타임 및 캐시 복사
COPY --from=build /app/.pnp.cjs ./.pnp.cjs
COPY --from=build /app/.pnp.loader.mjs ./.pnp.loader.mjs
COPY --from=build /app/.yarn ./.yarn

# 빌드 결과물 및 정적 파일 복사
COPY --from=build /app/dist ./dist
COPY --from=build /app/static ./static

EXPOSE 8080
ENV NODE_ENV=production

# PnP 로더를 require해서 모듈 해석
CMD ["--require", ".pnp.cjs", "dist/main"]
