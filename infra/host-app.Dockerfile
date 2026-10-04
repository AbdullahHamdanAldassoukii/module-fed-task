FROM node:22-alpine AS build
ARG UI_KIT=shadcn
ENV UI_KIT=$UI_KIT CI=1
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps ./apps
COPY packages ./packages
COPY e2e/package.json ./e2e/package.json
RUN pnpm install --frozen-lockfile
RUN pnpm --filter host-app build

FROM nginx:1.27-alpine AS runtime
ARG APP_ENV=production
ENV APP_ENV=$APP_ENV
COPY infra/nginx/host-app.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/host-app/dist /usr/share/nginx/html
COPY --from=build /repo/apps/host-app/config /etc/app-config
COPY infra/host-entrypoint.sh /docker-entrypoint.d/40-app-config.sh
RUN chmod +x /docker-entrypoint.d/40-app-config.sh
EXPOSE 3000
