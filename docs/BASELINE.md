# Frontend Baseline

Required baseline toolchain, as currently observed:

- Node.js `24.18.0`
- pnpm `12.3.4`

Commands:

```bash
pnpm dev
pnpm type-check
pnpm lint
pnpm build
```

Automated tests are not configured yet.

The matching Next.js 16.3.3 lint stack currently resolves ESLint 9.39.5. pnpm marks that ESLint release line as deprecated, while the bundled React lint plugin does not yet declare ESLint 10 compatibility; revisit the major version with a future Next.js lint-stack upgrade.

The production build uses `next/font/google` for Geist and Geist Mono. A clean build therefore needs access to Google Fonts; restricted or offline environments may fail while fetching those font files even when the application code is valid.

Turbopack also starts a local CSS worker. Sandboxes that forbid local port binding can use `pnpm exec next build --webpack` to diagnose application correctness without changing the normal build command.
