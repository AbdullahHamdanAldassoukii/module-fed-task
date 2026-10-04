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
RUN pnpm --filter passport-form build

FROM nginx:1.27-alpine AS runtime
COPY infra/nginx/passport-form.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/passport-form/dist /usr/share/nginx/html
EXPOSE 3001
