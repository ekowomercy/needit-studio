# NeedIt Studio

AI-powered need-to-solution marketplace. "Tell us what you need."

## Repository layout

```
apps/
  web/     Next.js PWA (seeker + provider UI)
  api/     NestJS backend
packages/
  ui/      Design system (tokens + components)
  shared/  Shared types, enums, formatting utilities
  engine/  Intent parsing + matching (pure TS)
  config/  Lint/TS config presets
  db/      Prisma schema, migrations, seed
docs/      PRD + implementation plan
```

## Tooling

- pnpm workspaces + Turborepo
- TypeScript strict everywhere
- ESLint (typescript-eslint) + Prettier
- Vitest for unit tests; Playwright for E2E

## Commands

```sh
pnpm install
pnpm dev        # run all dev servers
pnpm lint       # lint all packages
pnpm typecheck  # type-check all packages
pnpm test       # unit tests
pnpm build      # production build
```

## Documentation

- `need it documents/NeedIt Studio PRD (Buildable Spec).md`
- `need it documents/NeedIt Studio Implementation Plan.md`