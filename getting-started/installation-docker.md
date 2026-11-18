---
title: Install with Docker
description: Install BYOMailer on one server with Docker Compose and create the owner account.
order: 2
---

# Install with Docker

The repository has a `Dockerfile` and a `docker-compose.yml` file. The image uses `serversideup/php` with PHP 8.4, PHP-FPM, and NGINX. Docker Compose builds the image from the source code and starts the full stack on one server.

## The services

`docker-compose.yml` starts these services:

| Service | Command | Purpose |
|---|---|---|
| `web` | PHP-FPM and NGINX on port 8080 | The dashboard, the API, the MCP server, and the unsubscribe pages. It runs the database migrations each time it starts. |
| `horizon` | `php artisan horizon` | The queue workers. |
| `scheduler` | `php artisan schedule:work` | The Laravel scheduler. It starts the scheduled newsletters and the sequence steps. |
| `ses-events` | `php artisan ses-events:poll` | Reads the SES events from SQS. It starts only with the `ses` profile. |
| `mysql` | `mysql:8.4` | The database. |
| `redis` | `redis:7.4-alpine` | The queues, the cache, and the sessions. |

The `horizon`, `scheduler`, and `ses-events` services start after the `web` service is healthy. Only the `web` service runs the migrations, so the workers do not migrate at the same time.

The stack has three volumes:

| Volume | Content |
|---|---|
| `storage` | `storage/app` of the app. It holds the images that users upload. |
| `mysql` | The MySQL data. |
| `redis` | The Redis data. Redis runs with `--appendonly yes`. |

## Requirements

- Docker with Docker Compose 2.24 or later.
- A domain name, and a reverse proxy with TLS in front of port 8080. Open and click tracking and the unsubscribe links need HTTPS. Read [Reverse proxy and TLS](../self-hosting/reverse-proxy-and-tls.md).
- For each account that sends email, an AWS account with SES.
- For the instance, one SQS queue for the SES events. Read [SES events](../self-hosting/ses-events.md).

Each release publishes a Docker image to `ghcr.io/<owner>/byomailer`. A Git tag `v1.2.3` gives the image tags `1.2.3`, `1.2`, `1` and `latest`. `docker-compose.image.yml` uses this image, so you do not need to build it. See [Release process](../contributing/release-process.md#docker-image).

TODO(owner): Which GitHub owner publishes the image? `docker-compose.image.yml` uses the placeholder `ghcr.io/OWNER/byomailer`, and Docker refuses an image name with capitals. Until it changes, set `BYOMAILER_IMAGE`.

## Install

1. Clone the repository and go into its directory.
2. Copy the example file:

   ```bash
   cp .env.example .env
   ```

3. Generate an application key:

   ```bash
   openssl rand -base64 32
   ```

4. In `.env`, set `APP_KEY=base64:` followed by the key from step 3.
5. In `.env`, set the environment and the debug mode for production:

   ```dotenv
   APP_ENV=production
   APP_DEBUG=false
   ```

6. In `.env`, set the public URL and the two database passwords:

   ```dotenv
   APP_URL=https://byomailer.example
   DB_PASSWORD=<a-strong-password>
   DB_ROOT_PASSWORD=<another-strong-password>
   ```

7. Optional: in `.env`, set `ADMIN_EMAILS` to a comma-separated list of users that can open Horizon.
8. Start the stack:

   ```bash
   docker compose up -d --build
   ```

9. Wait until `docker compose ps` shows the `web` service as healthy. The first start runs all the migrations before NGINX starts, so it can take some minutes.
10. Read the setup URL in the log of the `web` container:

    ```bash
    docker compose logs web
    ```

11. Open the setup URL in a browser. Then create the owner account (see [The setup page](#the-setup-page)).
12. In **Settings > Profile**, enter the postal address of your company.

WARNING: Set `APP_ENV=production` and `APP_DEBUG=false` in `.env` before the first start. If you copy `.env.example` unchanged, Compose runs the containers with `APP_ENV=local` and `APP_DEBUG=true`.

`docker-compose.yml` uses `production` and `false` only when the variables are not set. `.env.example` sets `APP_ENV=local` and `APP_DEBUG=true`, and Compose reads these values from `.env`. With `APP_DEBUG=true`, error pages show internal details to all visitors. With `APP_ENV=local`, any visitor can open Horizon at `/horizon`, because the Horizon gate allows all users in the `local` environment.

Compose stops with an error if `DB_PASSWORD` or `DB_ROOT_PASSWORD` is empty.

`docker-compose.yml` sets some values itself, for all app services. These values override `.env`:

| Variable | Value in Docker |
|---|---|
| `DB_CONNECTION`, `DB_HOST`, `DB_PORT` | `mysql`, `mysql`, `3306` |
| `REDIS_HOST`, `REDIS_PORT` | `redis`, `6379` |
| `QUEUE_CONNECTION`, `CACHE_STORE`, `SESSION_DRIVER` | `redis` |
| `LOG_CHANNEL` | `stderr` |
| `INERTIA_SSR_ENABLED` | `false` |

[Configuration](configuration.md) lists the other variables.

## The setup page

When the `web` container starts, it runs `php artisan byomailer:install --prepare`. This command creates the storage link if it is missing. Then, while the instance has no user, the container prints the setup URL in its log:

```text
==================================================================
 BYOMailer has no account yet.
 Open this URL to create the owner account:

   https://byomailer.example/setup?token=<setup-token>

 To show this URL again, run:
   docker compose exec web php artisan byomailer:setup-url
==================================================================
```

The setup page is at `/setup`. While the instance has no user, BYOMailer sends `/`, `/login`, and `/register` to `/setup`.

1. Open the setup URL. The **Setup token** field gets the token from the URL.
2. Enter the **Name**, the **Email address**, and the **Password** of the owner.
3. Enter the password again in **Confirm password**.
4. Click **Create the owner account**.

BYOMailer creates the owner, signs the owner in, and opens the dashboard. The owner gets a new account, the team `admin` role, and a verified email address.

These rules apply to the setup page:

- The page is open only while the instance has no user. After the first user exists, `/setup` returns 404.
- The setup token comes from `APP_KEY`. BYOMailer does not store it. If `APP_KEY` changes, the token also changes.
- The page accepts 10 requests per minute.
- If the token is not correct, the page shows: "The setup token is not correct. Copy the setup URL from the log of the web container, or run php artisan byomailer:setup-url."

If you lost the setup URL, run this command:

```bash
docker compose exec web php artisan byomailer:setup-url
```

If an account already exists, the command shows "An account already exists. The setup page is closed."

## Create the owner from the command line

You can create the owner without the setup page. Run this command, then answer the questions:

```bash
docker compose exec web php artisan byomailer:install
```

The command has these options:

| Option | Purpose |
|---|---|
| `--name=` | The name of the owner. |
| `--email=` | The email address of the owner. |
| `--password=` | The password of the owner. |
| `--timezone=` | The timezone of the account. The default is `UTC`. |
| `--promote=` | Make the existing user with this email an owner. The command creates no account. |
| `--prepare` | Prepare the instance only (the storage link). The command creates no account. |

The command creates only the first user. If the instance already has a user, it stops with this error: "This install already has users. The install command only creates the first user. To make an existing user an owner, use --promote."

The owner can open the admin area at `/admin` and Horizon at `/horizon`. [Accounts and registration](../self-hosting/accounts-and-registration.md) explains the owner and the registration modes.

## Back up the application key

WARNING: Back up `APP_KEY` now, and keep a copy outside the server. If you lose the key, BYOMailer cannot read the encrypted data in the database.

BYOMailer encrypts these values with `APP_KEY`:

- The AWS access keys of each account.
- The storage keys in **Settings > Storage**.
- The signing secret of each webhook endpoint.

If you lose `APP_KEY`, each account must enter its AWS credentials again. [Backups](../self-hosting/backups.md) lists the other items to back up.

## Start the SES events worker

The `ses-events` service is in the `ses` profile, because it needs AWS values. Without this worker, BYOMailer does not see bounces and complaints.

1. Create the SQS queue and the IAM user for the worker. [SES events](../self-hosting/ses-events.md) gives the steps and the queue policy.
2. In `.env`, set these variables:

   ```dotenv
   PLATFORM_AWS_ACCESS_KEY_ID=<access-key-id>
   PLATFORM_AWS_SECRET_ACCESS_KEY=<secret-access-key>
   PLATFORM_AWS_REGION=us-east-1
   SES_EVENTS_SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/111111111111/byomailer-ses-events
   SES_EVENTS_SQS_QUEUE_ARN=arn:aws:sqs:us-east-1:111111111111:byomailer-ses-events
   ```

3. Start the stack with the profile:

   ```bash
   docker compose --profile ses up -d
   ```

4. Make sure that the `ses-events` service is healthy in `docker compose ps`.

Set `SES_EVENTS_SQS_QUEUE_ARN` before a user connects AWS. If it is empty, the AWS onboarding stops with the error "SQS queue ARN is not configured. Set SES_EVENTS_SQS_QUEUE_ARN in your environment."

## System mail

Invites, password resets, and alerts use the mailer in `MAIL_MAILER`. `.env.example` sets `MAIL_MAILER=log`, so these emails go to the log and not to the recipient. Newsletters and sequences do not use this mailer. Read [System mail](../self-hosting/system-mail.md).

If no mailer works, you can recover an account from the command line. Read [Recover access](../self-hosting/recover-access.md).

## Next steps

- [Connect AWS SES](connect-aws-ses.md) for the first account.
- [Send your first newsletter](first-newsletter.md).
- [Upgrade BYOMailer](upgrading.md) when a new version is available.
