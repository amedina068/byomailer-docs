---
title: Install without Docker
description: Install BYOMailer on a server with PHP, MySQL, Redis, and a web server, and run its background processes.
order: 3
---

# Install without Docker

This page installs BYOMailer directly on a Linux server. The Docker stack is easier to keep current. If you can use Docker, read [Install with Docker](installation-docker.md).

A manual install has the same parts as the Docker stack: a web server with PHP-FPM, MySQL, Redis, and three background processes. You must start and supervise each process yourself.

## Requirements

| Software | Version | Note |
|---|---|---|
| PHP | 8.4 | `composer.lock` needs PHP 8.4.1 or later (Symfony 8). PHP 8.5 does not work, because `phpoffice/phpspreadsheet` does not accept it. |
| Composer | 2 | Installs the PHP dependencies. |
| Node.js | 24 | Builds the frontend. The `.nvmrc` file names the version. Vite 7 does not work on older versions. Node is necessary only for the build. |
| MySQL | The Docker stack uses 8.4 | Production uses MySQL. |
| Redis | The Docker stack uses 7.4 | Horizon needs Redis. |
| A web server with PHP-FPM | | The Docker image uses NGINX. |

TODO(owner): Which is the oldest MySQL version and the oldest Redis version that BYOMailer supports?

### PHP extensions

Install PHP with these extensions:

| Extension | Why |
|---|---|
| `bcmath`, `exif`, `gd`, `intl` | The `Dockerfile` installs them on top of the base image. |
| `pdo_mysql` | The MySQL database connection. |
| `redis` | `REDIS_CLIENT=phpredis` uses the `phpredis` extension. |
| `pcntl`, `posix` | Laravel Horizon needs them. `ses-events:poll` uses `pcntl` to stop cleanly on `SIGTERM`. |
| `ctype`, `curl`, `dom`, `fileinfo`, `filter`, `iconv`, `mbstring`, `openssl`, `session`, `simplexml`, `tokenizer`, `xml`, `xmlreader`, `xmlwriter`, `zip`, `zlib` | The packages in `composer.lock` need them. |

## Install the app

1. Clone the repository into the folder that the web server will serve, and go into it.
2. Install the PHP dependencies without the development packages:

   ```bash
   composer install --no-dev --optimize-autoloader
   ```

3. Install the Node dependencies:

   ```bash
   npm ci
   ```

4. Build the frontend. The Wayfinder plugin of Vite runs `php artisan`, so PHP must be available:

   ```bash
   npm run build
   ```

5. Copy the example file:

   ```bash
   cp .env.example .env
   ```

6. Generate the application key:

   ```bash
   php artisan key:generate
   ```

7. In `.env`, set the values for production (see [Production values](#production-values)).
8. Create the database and the database user in MySQL.
9. Run the migrations:

   ```bash
   php artisan migrate --force
   ```

10. Create the storage link for the uploaded images:

    ```bash
    php artisan byomailer:install --prepare
    ```

11. Make sure that the user of PHP-FPM can write to `storage/` and `bootstrap/cache/`.
12. Optional: cache the configuration with `php artisan config:cache`. If you change `.env` later, run the command again.

WARNING: Back up `APP_KEY` now, and keep a copy outside the server. BYOMailer encrypts the AWS access keys of each account with it. If you lose the key, each account must enter its AWS credentials again.

### Production values

`.env.example` has values for local development. Change these values in `.env`:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://byomailer.example

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=byomailer
DB_USERNAME=byomailer
DB_PASSWORD=<a-strong-password>

QUEUE_CONNECTION=redis
CACHE_STORE=redis
SESSION_DRIVER=redis

INERTIA_SSR_ENABLED=false
```

- `APP_ENV=production` is necessary for Horizon. `config/horizon.php` has supervisor settings only for `production` and `local`. In `local`, any visitor can open `/horizon`.
- `.env.example` sets `QUEUE_CONNECTION=database`. Horizon processes only Redis queues, so set `redis`.
- `.env.example` sets `INERTIA_SSR_ENABLED=true`. Server-side rendering needs a separate `php artisan inertia:start-ssr` process. The Docker stack sets `false`. Do the same, or run and supervise that process.
- `.env.example` sets `MAIL_MAILER=log`. Invites and password resets then go to the log. Read [System mail](../self-hosting/system-mail.md).

[Configuration](configuration.md) lists all the variables.

## Configure the web server

Point the document root of the web server to the `public/` folder. Send all requests that do not match a file to `public/index.php` through PHP-FPM. The health check URL is `/up`.

Put TLS in front of the app. Open and click tracking and the unsubscribe links need HTTPS. Read [Reverse proxy and TLS](../self-hosting/reverse-proxy-and-tls.md).

TODO(owner): The repository has no NGINX or Apache configuration for an install without Docker. Can you give one, or point to the configuration in the `serversideup/php` image?

## Run the background processes

BYOMailer needs three long-running processes in addition to the web server:

| Process | Command | Purpose |
|---|---|---|
| Queue workers | `php artisan horizon` | Process the Redis queues: `default`, `newsletter`, `sequences`, `automations`, `ses-events`, `tracking-domains`, and `webhooks`. |
| Scheduler | `php artisan schedule:work` | Runs the scheduled commands. Each minute, it starts the scheduled newsletters, the due sequence steps, and the visual automation steps. |
| SES events worker | `php artisan ses-events:poll` | Reads the SES events from the SQS queue and puts them on the `ses-events` queue. |

Run each command from the app folder, as the same user as PHP-FPM. A process manager must restart each process when it stops.

- `ses-events:poll` stops by design when it uses more than 256 MB of memory (`--memory-limit`), when it gets `SIGTERM`, and after `php artisan queue:restart`.
- `ses-events:poll` stops at once with an error if `PLATFORM_AWS_*` or `SES_EVENTS_SQS_QUEUE_URL` is empty. Read [SES events](../self-hosting/ses-events.md).
- The Docker stack uses `php artisan schedule:work`. The standard Laravel alternative is a cron entry that runs `php artisan schedule:run` each minute. Read [Scheduler](../self-hosting/scheduler.md).

TODO(owner): The code has no systemd unit and no Supervisor configuration for these processes. Which process manager do you recommend, and can you give a sample configuration for each process?

[Queues and Horizon](../self-hosting/queues-and-horizon.md) explains the queues in more detail.

## Create the owner account

Do one of these procedures.

To use the setup page:

1. Show the setup URL:

   ```bash
   php artisan byomailer:setup-url
   ```

2. Open the URL in a browser.
3. Enter the name, the email address, and the password of the owner.
4. Click **Create the owner account**.

To use the command line:

1. Run the install command:

   ```bash
   php artisan byomailer:install
   ```

2. Answer the questions for the name, the email address, and the password.

[Install with Docker](installation-docker.md) explains the setup page and the options of `byomailer:install`.

## Next steps

- [Connect AWS SES](connect-aws-ses.md) for the first account.
- [Send your first newsletter](first-newsletter.md).
- [Upgrade BYOMailer](upgrading.md) when a new version is available.
