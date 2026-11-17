---
title: Configuration
description: The environment variables of BYOMailer, grouped as in .env.example, with their default values.
order: 4
---

# Configuration

BYOMailer reads its configuration from environment variables in the `.env` file. `.env.example` lists each variable that an install uses, with a comment. This page uses the same groups as `.env.example`.

The tables show two defaults:

- **`.env.example`** is the value in the example file. If you copy the file unchanged, the app uses this value.
- **Code default** is the value that `config/` uses when the variable is not set. A dash means that the files in `config/` do not set a default.

`.env.example` has values for local development. For production, change at least `APP_ENV`, `APP_DEBUG`, `APP_URL`, the database values, and the queue, cache, and session drivers. [Install with Docker](installation-docker.md) and [Install without Docker](installation-manual.md) give the production values.

If you cache the configuration with `php artisan config:cache`, run the command again after each change to `.env`. The Docker `web` container caches the configuration each time it starts.

## Application

| Variable | `.env.example` | Code default | Purpose |
|---|---|---|---|
| `APP_NAME` | `BYOMailer` | `Laravel` | The name of the app in the dashboard and in system mail. |
| `APP_ENV` | `local` | `production` | The environment. Use `production` on a server. In `local`, any visitor can open Horizon. |
| `APP_KEY` | empty | - | The encryption key. BYOMailer encrypts the AWS credentials, the storage keys, and the webhook secrets with it. The setup token also comes from it. |
| `APP_PREVIOUS_KEYS` | empty | empty | A comma-separated list of old keys. Use it when you rotate `APP_KEY`. Read [Upgrade BYOMailer](upgrading.md). |
| `APP_DEBUG` | `true` | `false` | Shows error details on error pages. Use `false` on a server. |
| `APP_URL` | `http://localhost` | `http://localhost` | The public URL of the instance. Emails, the API examples, the MCP guide, and the setup URL use it. |
| `APP_LOCALE` | `en` | `en` | The language of the app. |
| `APP_FALLBACK_LOCALE` | `en` | `en` | The language when a translation is missing. |
| `APP_FAKER_LOCALE` | `en_US` | `en_US` | The locale of the test data generator. |
| `APP_MAINTENANCE_DRIVER` | `file` | `file` | Where Laravel stores the maintenance mode state. |
| `BCRYPT_ROUNDS` | `12` | - | The cost of the password hash. |

WARNING: Back up `APP_KEY`. If you lose the key, each account must enter its AWS credentials again.

## Accounts and access

| Variable | `.env.example` | Code default | Purpose |
|---|---|---|---|
| `REGISTRATION_ENABLED` | `false` | `false` | The registration mode until the owner sets one in **Admin > Settings**. With `false`, `/register` answers 404. The mode in the database overrides this value. |
| `ADMIN_EMAILS` | empty | empty | A comma-separated list of the users that can open Horizon at `/horizon`. The owner can always open Horizon. |

[Accounts and registration](../self-hosting/accounts-and-registration.md) explains the registration modes.

## Logs

| Variable | `.env.example` | Code default | Purpose |
|---|---|---|---|
| `LOG_CHANNEL` | `stack` | `stack` | The log channel. Docker Compose sets `stderr`. |
| `LOG_STACK` | `single` | `single` | The channels of the `stack` channel. Add `rollbar` (for example `single,rollbar`) to send errors to Rollbar. |
| `LOG_DEPRECATIONS_CHANNEL` | `null` | `null` | The channel for deprecation warnings. |
| `LOG_LEVEL` | `debug` | `debug` | The lowest level that the log records. |
| `ROLLBAR_TOKEN` | empty | - | The Rollbar token. BYOMailer uses it only when `LOG_STACK` contains `rollbar`. |

## Database, cache, queue, and session

| Variable | `.env.example` | Code default | Purpose |
|---|---|---|---|
| `DB_CONNECTION` | `sqlite` | `sqlite` | The database driver. Use `mysql` in production. Docker Compose sets `mysql`. |
| `DB_HOST` | commented out | `127.0.0.1` | The MySQL host. |
| `DB_PORT` | commented out | `3306` | The MySQL port. |
| `DB_DATABASE` | commented out | `laravel` | The database name. Docker Compose uses `byomailer`. |
| `DB_USERNAME` | commented out | `root` | The database user. Docker Compose uses `byomailer`. |
| `DB_PASSWORD` | commented out | empty | The database password. Docker Compose needs it. |
| `SESSION_DRIVER` | `database` | `database` | Where the web sessions are stored. Docker Compose sets `redis`. |
| `SESSION_LIFETIME` | `120` | `120` | The session lifetime in minutes. |
| `SESSION_ENCRYPT` | `false` | `false` | Encrypts the session data. |
| `SESSION_PATH` | `/` | `/` | The path of the session cookie. |
| `SESSION_DOMAIN` | `null` | - | The domain of the session cookie. |
| `BROADCAST_CONNECTION` | `log` | - | The broadcast driver. |
| `FILESYSTEM_DISK` | `local` | `local` | The default file disk. |
| `MEDIA_DISK` | `public` | `public` | The disk for the images that users upload in the email editor: `public` or `s3`. |
| `QUEUE_CONNECTION` | `database` | `database` | The queue driver. Horizon needs `redis`. Docker Compose sets `redis`. |
| `CACHE_STORE` | `database` | `database` | The cache driver. Docker Compose sets `redis`. |
| `REDIS_CLIENT` | `phpredis` | `phpredis` | The Redis client. `phpredis` needs the `redis` PHP extension. |
| `REDIS_HOST` | `127.0.0.1` | `127.0.0.1` | The Redis host. Docker Compose sets `redis`. |
| `REDIS_PASSWORD` | `null` | - | The Redis password. |
| `REDIS_PORT` | `6379` | `6379` | The Redis port. |

## System mail

These variables configure the mailer for invites, password resets, and alerts. Newsletters and sequences do not use them. They send through the AWS credentials of each account.

| Variable | `.env.example` | Code default | Purpose |
|---|---|---|---|
| `MAIL_MAILER` | `log` | `ses` | The mailer. With `log`, emails go to the log and not to the recipient. |
| `MAIL_SCHEME` | `null` | - | The SMTP scheme. |
| `MAIL_HOST` | `127.0.0.1` | `127.0.0.1` | The SMTP host. |
| `MAIL_PORT` | `2525` | `2525` | The SMTP port. |
| `MAIL_USERNAME` | `null` | - | The SMTP user. |
| `MAIL_PASSWORD` | `null` | - | The SMTP password. |
| `MAIL_FROM_ADDRESS` | `hello@example.com` | `hello@example.com` | The sender address of system mail. |
| `MAIL_FROM_NAME` | `${APP_NAME}` | `Example` | The sender name of system mail. |

[System mail](../self-hosting/system-mail.md) explains the mailer options.

## AWS for the app itself

`MAIL_MAILER=ses` and the `s3` disk use these variables. If you do not use them, keep the values empty.

| Variable | `.env.example` | Code default | Purpose |
|---|---|---|---|
| `AWS_ACCESS_KEY_ID` | empty | - | The access key for system mail through SES and for the `s3` disk. |
| `AWS_SECRET_ACCESS_KEY` | empty | - | The secret key of that access key. |
| `AWS_DEFAULT_REGION` | `us-east-1` | `us-east-1` | The AWS region. |
| `AWS_BUCKET` | empty | - | The S3 bucket of the `s3` disk. |
| `AWS_URL` | empty | - | The public URL of the bucket. |
| `AWS_ENDPOINT` | empty | - | A custom S3 endpoint. |
| `AWS_USE_PATH_STYLE_ENDPOINT` | `false` | `false` | Uses path-style S3 URLs. |

These keys are not the AWS keys of the accounts. Each account enters its own keys in the dashboard.

## SES events

These variables configure the one SQS queue that receives the SES events of all accounts. The `ses-events:poll` worker reads the queue. [SES events](../self-hosting/ses-events.md) explains the queue and its access policy.

| Variable | `.env.example` | Code default | Purpose |
|---|---|---|---|
| `PLATFORM_AWS_ACCESS_KEY_ID` | empty | - | An access key that can read and delete messages on the SQS queue. |
| `PLATFORM_AWS_SECRET_ACCESS_KEY` | empty | - | The secret key of that access key. |
| `PLATFORM_AWS_REGION` | `us-east-1` | `us-east-1` | The region of the SQS queue. |
| `SES_EVENTS_SQS_QUEUE_URL` | empty | - | The URL of the SQS queue. The worker reads from it. |
| `SES_EVENTS_SQS_QUEUE_ARN` | empty | - | The ARN of the SQS queue. The AWS onboarding subscribes the SNS topic of each account to it. |

If `SES_EVENTS_SQS_QUEUE_ARN` is empty, no account can connect AWS. If `PLATFORM_AWS_*` or `SES_EVENTS_SQS_QUEUE_URL` is empty, the worker stops with an error.

## Footer address

No variable is necessary. Each account enters its postal address in **Settings > Profile**. The `{{ postal_address }}` variable puts it in the email footer. While the address is empty, BYOMailer shows a warning before a send, but it does not block the send.

## Optional integrations

When the variables of an integration are empty, the integration is off and BYOMailer makes no network call for it.

| Variable | `.env.example` | Code default | Purpose |
|---|---|---|---|
| `MAXMIND_LICENSE_KEY` | empty | - | The city and the country of opens (MaxMind GeoLite2). The scheduler downloads the database only when the key is set. |
| `MAXMIND_DATABASE_PATH` | commented out | `storage/app/geoip/GeoLite2-City.mmdb` | The path of the GeoLite2 database. |
| `PLAUSIBLE_SCRIPT_URL` | empty | - | The Plausible Analytics script for the app pages. |
| `CLOUDFLARE_API_TOKEN` | empty | - | Custom link domains through Cloudflare for SaaS. |
| `CLOUDFLARE_ZONE_ID` | empty | - | The Cloudflare zone of the custom hostnames. |
| `CLOUDFLARE_CNAME_TARGET` | empty | - | The host that the CNAME record of a customer points to. |
| `CLOUDFLARE_ORIGIN_SERVER` | empty | `CLOUDFLARE_CNAME_TARGET` | The origin server of each custom hostname. |
| `CLOUDFLARE_ORIGIN_SNI` | empty | `CLOUDFLARE_CNAME_TARGET` | The SNI of each custom hostname. The origin certificate must cover this name, or Cloudflare returns 526. |
| `TRACKING_PROXY_IP` | empty | - | Custom tracking domains through a Caddy proxy. The public IP of the proxy. |
| `TRACKING_PROXY_ASK_TOKEN` | empty | - | The token that Caddy sends to `/tls/ask` before it issues a certificate. |
| `BYOMAILER_API_URL` | empty | - | Adds each new account to a list on another BYOMailer server. The URL of that server. |
| `BYOMAILER_API_TOKEN` | empty | - | The API token for that server. |
| `BYOMAILER_LIST_ID` | empty | - | The list on that server. |
| `SNAPSBREW_BASE_URL` | `https://app.snapsbrew.com` | `https://app.snapsbrew.com` | Open Graph images for the documentation pages. |
| `SNAPSBREW_SIGNED_URL_KEY` | empty | - | The key that signs the image URLs. |
| `SNAPSBREW_OG_TEMPLATE_ID` | empty | - | The image template. |
| `SLACK_BOT_USER_OAUTH_TOKEN` | empty | - | Slack notifications. |
| `SLACK_BOT_USER_DEFAULT_CHANNEL` | empty | - | The default Slack channel. |

The Cloudflare feature needs `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, and `CLOUDFLARE_CNAME_TARGET`. [Optional integrations](../self-hosting/optional-integrations.md) explains each integration.

TODO(owner): `config/services.php` reads the two `SLACK_BOT_USER_*` variables, but no code in `app/` reads `services.slack`. Do these variables have a use, or can they go?

## Outgoing webhooks

| Variable | `.env.example` | Code default | Purpose |
|---|---|---|---|
| `WEBHOOKS_DELIVERY_RETENTION_DAYS` | `30` | `30` | The number of days that BYOMailer keeps the delivery records. The scheduled `model:prune` command removes older records. |
| `WEBHOOKS_MAX_PER_CLIENT` | `25` | `25` | The maximum number of webhook endpoints for one account. |
| `WEBHOOKS_DISABLE_AFTER_FAILURES` | `15` | `15` | After this number of failed deliveries in a row, BYOMailer turns off the endpoint. |
| `WEBHOOKS_TIMEOUT_SECONDS` | `10` | `10` | The HTTP timeout of one delivery. Keep it below 30, the timeout of the delivery job. |
| `WEBHOOKS_RESPONSE_BODY_CAP_BYTES` | `2048` | `2048` | The number of bytes of the response body that BYOMailer stores. |
| `WEBHOOKS_DELIVERY_RATE_PER_MINUTE` | `60` | `60` | The maximum number of deliveries for one account in one minute. |

[Webhooks](../using-byomailer/webhooks.md) explains the webhooks.

## Frontend

| Variable | `.env.example` | Code default | Purpose |
|---|---|---|---|
| `VITE_APP_NAME` | `${APP_NAME}` | - | The app name in the frontend build. |
| `INERTIA_SSR_ENABLED` | `true` | `true` | Server-side rendering. It needs a running `php artisan inertia:start-ssr` process. Docker Compose sets `false`. |

## Docker Compose

`docker-compose.yml` reads these values from `.env`. It sets `DB_CONNECTION`, `DB_HOST`, `REDIS_HOST`, `QUEUE_CONNECTION`, `CACHE_STORE`, and `SESSION_DRIVER` itself.

| Variable | `.env.example` | Default in `docker-compose.yml` | Purpose |
|---|---|---|---|
| `APP_PORT` | `8080` | `8080` | The host port of the `web` service. |
| `DB_ROOT_PASSWORD` | empty | - | The MySQL root password. Compose stops if it is empty. |
| `DB_PASSWORD` | commented out | - | The MySQL password of the app. Compose stops if it is empty. |
| `DB_DATABASE` | commented out | `byomailer` | The database name. |
| `DB_USERNAME` | commented out | `byomailer` | The database user. |
| `APP_ENV` | `local` | `production` | Compose uses `production` only when `.env` does not set the variable. |
| `APP_DEBUG` | `true` | `false` | Compose uses `false` only when `.env` does not set the variable. |
| `BYOMAILER_IMAGE` | not listed | `byomailer:local` | The name of the image that Compose builds. |
| `BYOMAILER_ENV_FILE` | not listed | `.env` | The file that Compose loads into the app containers. |

WARNING: Set `APP_ENV=production` and `APP_DEBUG=false` in `.env`. If you keep the values of `.env.example`, the containers run with `APP_ENV=local` and `APP_DEBUG=true`.

## Local seed data

`php artisan db:seed` creates a demo account for local development. The seeder reads the `TEST_*` variables, for example `TEST_AWS_KEY_ID` and `TEST_EMAIL_FROM`. All of them are optional, and they are commented out in `.env.example`. Do not use them in production. [Development setup](../contributing/development-setup.md) explains local development.

## Other variables

`config/` reads more variables than `.env.example` lists. Most are standard Laravel variables. This variable is specific to BYOMailer:

| Variable | Code default | Purpose |
|---|---|---|
| `MAIL_USE_SES_API` | `true` | With `true`, newsletters use the SES bulk API with the credentials of each account. With `false`, each email goes through the system mailer in `MAIL_MAILER`. Use `false` only for local development. |
