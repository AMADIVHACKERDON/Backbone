# AETEKONECT Backend

A Next.js backend for the AETEKONECT platform, built with TypeScript and Supabase.

## Prerequisites

- Node.js 20+
- pnpm
- Supabase project access (for local database tooling)

## Environment setup

Create a `.env.local` file in the backend root with the required configuration as shown below and in `.env.example`.

Example:

```sh
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

If your project uses a different set of variables, add them here based on your Supabase or app configuration.

## Getting started

1. Install dependencies:

```sh
pnpm install
```

2. Start the development server:

```sh
pnpm dev
```

3. Open the app in your browser:

- http://localhost:3000/

## Useful commands

```sh
pnpm dev          # start the app in development mode
pnpm build        # create a production build
pnpm start        # run the production build
pnpm lint         # run ESLint
pnpm typecheck    # run TypeScript checks
pnpm format       # format the project with Prettier
```

## Database

This project includes Supabase helpers and scripts for local database  -> (No migration files yet):

```sh
pnpm db:push
pnpm db:reset
pnpm db:types
```

## Notes

- Use the app to create an account and explore the platform.
- You can test network behavior using mock ISP scenarios.
- Environment variables are expected in `.env.local` for local configuration.
