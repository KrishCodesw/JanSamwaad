# Contributing

Thank you for helping improve JanSamwaad.

## Before you start

- Read the root [README](../README.md).
- Review [Architecture](ARCHITECTURE.md), [API Reference](API.md), and [Database Setup](DATABASE.md) when your change touches those areas.
- For database work, use a development Supabase project. Do not test destructive changes against production data.

## Local workflow

```bash
npm ci
cp .env.local.example .env.local
npm run dev
```

Fill in the environment values before testing database-backed features.

## Before opening a pull request

Run:

```bash
npm run build
npm run test:agent
```

Test the affected route and UI manually. Include tests when practical, especially for authentication, role checks, geospatial queries, uploads, and status transitions.

## Code guidelines

- Keep changes focused and consistent with the current TypeScript and Next.js structure.
- Validate all user-controlled input on the server.
- Do not expose service-role keys or other secrets to client code.
- Apply explicit role checks before privileged database operations.
- Preserve RLS and add tests for access rules.
- Use safe, useful error responses. Do not return secrets or internal stack traces.
- Update documentation when routes, environment variables, schema requirements, or deployment steps change.

## Pull request description

Include:

1. The problem and reason for the change.
2. A short description of the implementation.
3. Commands and tests run.
4. Screenshots for significant UI changes.
5. Database or environment changes that reviewers must apply.

## Reporting security issues

Do not publish exploitable secrets or sensitive user data in a public issue. Contact the repository maintainer through a private channel where possible.
