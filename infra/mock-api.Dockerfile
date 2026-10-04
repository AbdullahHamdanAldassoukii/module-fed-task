FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/host-app/package.json ./apps/host-app/package.json
COPY apps/passport-form/package.json ./apps/passport-form/package.json
COPY e2e/package.json ./e2e/package.json
COPY packages/api-mocks/package.json ./packages/api-mocks/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/i18n/package.json ./packages/i18n/package.json
COPY packages/passport-contract/package.json ./packages/passport-contract/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN pnpm install --frozen-lockfile --filter @repo/api-mocks...
COPY packages ./packages
EXPOSE 3002
CMD ["pnpm", "--filter", "@repo/api-mocks", "serve"]
