FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @needit/api build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3001
CMD ["sh", "-c", "pnpm --filter @needit/db migrate:prod && node apps/api/dist/main.js"]
