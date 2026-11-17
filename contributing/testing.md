---
title: Testing
description: Run the PHP tests, the JavaScript tests, the code style checks, the SSR smoke test and the load tests of BYOMailer.
order: 3
---

# Testing

Write or update a test for each change. This page tells you how to run each check, and what the CI runs on a pull request.

For the local setup, read [Development setup](development-setup.md).

## Summary

| Check | Command | In the CI |
|---|---|---|
| PHP tests | `php artisan test --compact` | Yes |
| PHP code style | `vendor/bin/pint --test` | Yes |
| JavaScript tests | `npm test` | Yes |
| Production build | `npm run build` | Yes |
| TypeScript types | `npx vue-tsc --noEmit` | No |
| ESLint | `npx eslint <files>` | No |
| Prettier | `npm run format:check` | No |
| SSR smoke test | `npm run test:ssr` | No |
| Load tests | `k6 run tests/load/<file>.js` | No |

## PHP tests

The PHP tests use PHPUnit 12. They are in `tests/Unit` and `tests/Feature`.

1. If the folder `bootstrap/ssr` exists, remove it:

   ```bash
   rm -rf bootstrap/ssr
   ```

2. Run all tests:

   ```bash
   php artisan test --compact
   ```

To run one file or one test, give the path or a filter:

```bash
php artisan test --compact tests/Feature/InstallCommandTest.php
php artisan test --compact --filter=test_it_refuses_to_run_when_a_user_already_exists
```

`composer test` clears the configuration cache, runs Pint in test mode, and runs `php artisan test`.

### Why `bootstrap/ssr` breaks the PHP tests

`npm run build` runs `vite build --ssr`, which writes `bootstrap/ssr/ssr.js`. `composer setup` runs `npm run build`, so a new checkout has this file after the setup.

The PHP tests fail while this file exists. The cause is in the code:

1. `config/inertia.php` turns on server-side rendering by default (`INERTIA_SSR_ENABLED` is `true`). `phpunit.xml` and `.env.testing` do not change it.
2. When the bundle `bootstrap/ssr/ssr.js` exists, Inertia sends each page to `http://127.0.0.1:13714/render` with the Laravel HTTP client.
3. `tests/TestCase.php` calls `Http::preventStrayRequests()`. That request has no fake, so the HTTP client throws `StrayRequestException`. Inertia does not catch this exception.

As a result, each test that renders an Inertia page fails. Remove `bootstrap/ssr`, or set `INERTIA_SSR_ENABLED=false` in the shell before the test run. The CI does not have this problem, because the PHP job does not build the frontend.

### The test environment

`phpunit.xml` sets the test environment:

| Variable | Value |
|---|---|
| `DB_CONNECTION` | `sqlite` |
| `DB_DATABASE` | `:memory:` |
| `QUEUE_CONNECTION` | `sync` |
| `CACHE_STORE` | `array` |
| `SESSION_DRIVER` | `array` |
| `MAIL_MAILER` | `array` |

The tests use SQLite and production uses MySQL. Do not write SQL that works on one engine only.

### No real HTTP calls

`tests/TestCase.php` calls `Http::preventStrayRequests()` in `setUp()`. Each HTTP call in a test must have a fake (`Http::fake()`). A call without a fake throws an exception. Thus a test cannot reach a real service with real credentials.

`TestCase` also has these helpers:

| Method | Use |
|---|---|
| `completeInstanceSetup()` | Creates one user. While the users table is empty, `/`, `/login` and `/register` go to `/setup`. |
| `withoutSesSendingLimit()` | Removes the Redis `ses-sending` rate limit. A test that runs the send commands on the sync queue then does not need Redis. |

### AWS mocks

A test must not call AWS. Replace the AWS services with mocks, as the existing tests do:

- Mock the service classes with `$this->mock()` or `$this->instance()`. Examples: `SesClientManager`, `SesDomainIdentityService`, `SesConfigurationSetService`, `SnsTopicService`, `SesBulkEmailService`, `NewsletterTransport` and `AwsCredentialValidator`.
- Return `Aws\Result` objects from the mocked clients.
- For the SQS poller, give `PollSesEventsCommand::setClientFactory()` a factory that returns a mocked `SqsClient`.
- For SES events, use the `BuildsSesNotifications` trait in `tests/Concerns`. Its `sesNotification()` method wraps SES events in the SNS envelope of the account.

WARNING: Do not run a send command by hand with tinker mocks to test the send code. Artisan builds the dependencies of the command before a tinker binding applies. The command can then send through the real SES API. Use a feature test.

### MCP tools

Call an MCP tool in a test through the server class:

```php
$response = ByoMailerServer::actingAs($user)->tool(CreateContactTool::class, [
    'email' => 'contact@example.com',
]);
```

The tests in `tests/Feature/Mcp` show the pattern.

## JavaScript tests

The JavaScript tests use Vitest 4 with `happy-dom`. Vitest runs the files that match `resources/js/**/*.{test,spec}.ts`.

1. Make sure that `.env` exists and has an `APP_KEY`.
2. Generate the route helpers:

   ```bash
   php artisan wayfinder:generate --with-form
   ```

3. Run the tests:

   ```bash
   npm test
   ```

The Vue code imports route helpers from `@/routes` and `@/actions`. Wayfinder generates them from the PHP routes, and Git ignores them. If Vitest cannot find `@/routes` or `@/actions`, do step 2 again. To run Vitest in watch mode, run `npm run test:watch`.

## Code style and types

| Tool | Command | Note |
|---|---|---|
| Pint | `vendor/bin/pint --dirty` | Formats the PHP files that you changed. Run it before each commit. |
| Pint check | `vendor/bin/pint --test` | Changes nothing. The CI runs it. |
| `vue-tsc` | `npx vue-tsc --noEmit` | Checks the TypeScript types. |
| ESLint | `npx eslint <files>` | Checks the files that you give. `npm run lint` runs `eslint . --fix` and changes files. |
| Prettier | `npm run format:check` | Checks the format of `resources/`. `npm run format` changes files. |

`npm run build` does not check the types. A green build does not prove that the types and the lint are correct. Run `vue-tsc` and ESLint on the files that you change.

## CI

`.github/workflows/ci.yml` runs on each pull request and on each push to `main`. It uses PHP 8.4 with the extensions `bcmath`, `exif`, `gd`, `intl`, `pdo_sqlite`, `redis` and `zip`. It uses the Node version in `.nvmrc`.

| Job | Steps |
|---|---|
| Pint | `composer install`, then `vendor/bin/pint --test` |
| PHP tests | `composer install`, copy `.env.example` to `.env`, `php artisan key:generate`, then `php artisan test --compact` |
| JavaScript tests | `composer install` and `npm ci`, copy `.env.example` to `.env`, `php artisan key:generate`, `php artisan wayfinder:generate --with-form`, `npm test`, then `npm run build` |

The CI does not run `vue-tsc`, ESLint, Prettier, the SSR smoke test or the load tests.

## SSR smoke test

`tests/Ssr/render-smoke.mjs` makes sure that the SSR bundle can render a page. A clean `vite build --ssr` does not prove this.

1. Build the frontend:

   ```bash
   npm run build
   ```

2. Run the smoke test:

   ```bash
   npm run test:ssr
   ```

The script starts `node bootstrap/ssr/ssr.js` on port 13714. It asks the bundle to render the `Welcome` page. If the body has fewer than 1000 characters or no HTML tags, the test fails.

CAUTION: Remove `bootstrap/ssr` after the smoke test, before you run the PHP tests.

## Load tests

`tests/load/` has two k6 scripts for the REST API. `tests/load/README.md` gives the targets for each endpoint.

| Script | What it does | Load |
|---|---|---|
| `baseline-read-mix.js` | Reads newsletters, contacts, lists, templates and email logs | 50 virtual users. Fails if more than 1% of requests fail or p95 is more than 500 ms. |
| `newsletter-create-preview.js` | Counts recipients, then creates draft newsletters | 10 virtual users. Fails if more than 2% of requests fail or p95 is more than 800 ms. |

1. Install k6.
2. Create an API token in **Settings, API Tokens**.
3. Set the environment variable BASE_URL to the URL of the instance. The default is `http://byomailer.test`.
4. Set the environment variable API_TOKEN to the token.
5. Run a script:

   ```bash
   k6 run tests/load/baseline-read-mix.js
   ```

CAUTION: Do not run `newsletter-create-preview.js` against an instance with real data. It creates many draft newsletters in the account of the token.

The API rate limits apply. For each user, the test mail endpoint allows 5 requests each minute, and the recipient preview allows 30 requests each minute.
