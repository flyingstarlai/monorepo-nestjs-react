# Dashboard Application

A modern dashboard application with user management, authentication, and admin features built with NestJS backend and React frontend.

## What's inside?

This monorepo includes the following packages & apps:

### Apps and Packages

```shell
.
├── apps
│   ├── api                       # NestJS backend API with authentication and user management
│   └── web                       # React frontend with TanStack Router and Tailwind CSS
└── packages
    ├── @repo/api                 # Shared API types and utilities
    ├── @repo/eslint-config       # ESLint configurations (includes Prettier)
    ├── @repo/jest-config         # Jest configurations
    ├── @repo/typescript-config   # TypeScript configurations used throughout the monorepo
    └── @repo/ui                  # Shared React UI components
```

Each package and application are mostly written in [TypeScript](https://www.typescriptlang.org/).

### Utilities

This `Turborepo` has some additional tools already set for you:

- [TypeScript](https://www.typescriptlang.org/) for static type-safety
- [Biome](https://biomejs.dev/) for code linting and formatting
- [Jest](https://jestjs.io/) & [Vitest](https://vitest.dev/) for testing

### Commands

This `Turborepo` already configured useful commands for all your apps and packages.

#### Build

```bash
# Will build all the app & packages with the supported `build` script.
pnpm run build

# ℹ️ If you plan to only build apps individually,
# Please make sure you've built the packages first.
```

#### Develop

```bash
# Will run the development server for all the app & packages with the supported `dev` script.
pnpm run dev
```

#### test

```bash
# Will launch a test suites for all the app & packages with the supported `test` script.
pnpm run test

# You can launch e2e testes with `test:e2e`
pnpm run test:e2e

# See `@repo/jest-config` to customize the behavior.
```

#### Lint

```bash
# Will lint all the app & packages with the supported `lint` script.
# See `@repo/biome-config` to customize the behavior.
pnpm run lint
```

#### Format

```bash
# Will format all the supported files using Biome.
# See `@repo/biome-config` to customize the behavior.
pnpm format
```

#### Check

```bash
# Will run both linting and formatting checks.
pnpm run check
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```bash
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```bash
npx turbo link
```

## Useful Links

This example take some inspiration the [with-nextjs](https://github.com/vercel/turborepo/tree/main/examples/with-nextjs) `Turbo` example and [01-cats-app](https://github.com/nestjs/nest/tree/master/sample/01-cats-app) `NestJs` sample.

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
