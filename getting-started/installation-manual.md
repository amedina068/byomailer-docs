---
title: Install without Docker
description: Install BYOMailer on a server with PHP, MySQL, Redis, and a web server, and run its background processes.
order: 3
---

# Install without Docker

This page installs BYOMailer directly on a Linux server. The Docker image is easier to install and to keep current. It runs in one container with SQLite and needs no MySQL and no Redis. If you can use Docker, read [Install with Docker](installation-docker.md).

The manual install on this page uses MySQL, Redis, and Horizon. It has a web server with PHP-FPM, MySQL, Redis, and three background processes. You must start and supervise each process yourself.

## Requirements

| Software | Version | Note |
|---|---|---|
| PHP | 8.4 | `composer.lock` needs PHP 8.4.1 or later (Symfony 8). PHP 8.5 does not work, because `phpoffice/phpspreadsheet` does not accept it. |
| Composer | 2 | Installs the PHP dependencies. |
| Node.js | 24 | Builds the frontend. The `.nvmrc` file names the version. Vite 7 does not work on older versions. Node is necessary only for the build. |
| MySQL | 8.4 or later | The database of this install. The `mysql` profile of the Compose stack uses 8.4. |
| Redis | 7.2 or later | Horizon needs Redis. The `mysql` profile of the Compose stack uses 7.4. |
| A web server with PHP-FPM | | The Docker image uses NGINX. |

The oldest supported versions are MySQL 8.4 (LTS) and Redis 7.2. MySQL 8.0 reached its end of life in April 2026. The project does not test MariaDB or older Redis versions.

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
- `.env.example` sets `INERTIA_SSR_ENABLED=true`. Server-side rendering needs a separate `php artisan inertia:start-ssr` process. The Docker image sets `false`. Do the same, or run and supervise that process.
- `.env.example` sets `MAIL_MAILER=log`. Invites and password resets then go to the log. Read [System mail](../self-hosting/system-mail.md).

[Configuration](configuration.md) lists all the variables.

## Configure the web server

Point the document root of the web server to the `public/` folder. Send all requests that do not match a file to `public/index.php` through PHP-FPM. The health check URL is `/up`.

Put TLS in front of the app. Open and click tracking and the unsubscribe links need HTTPS. Read [Reverse proxy and TLS](../self-hosting/reverse-proxy-and-tls.md).

The app repository has an NGINX server block for this install: [`deploy/nginx/byomailer.conf`](https://github.com/amedina068/byomailer/blob/main/deploy/nginx/byomailer.conf). It serves `public/`, sends PHP requests to PHP-FPM, redirects HTTP to HTTPS, and accepts request bodies of 25 MB.

1. Copy the file to `/etc/nginx/sites-available/byomailer.conf`.
2. Replace `byomailer.example` with the host of `APP_URL`.
3. Replace `/var/www/byomailer` with the folder of the app.
4. Replace `/run/php/php8.4-fpm.sock` with the socket of your PHP 8.4 FPM pool.
5. Replace the certificate paths with the files of your certificate.
6. Link the file in `/etc/nginx/sites-enabled/`.
7. Run `sudo nginx -t`. If the test passes, reload NGINX.

The server block on port 443 is the `default_server`. With custom link domains, Cloudflare sends the requests of each link domain to this server with the `Host` of that domain. BYOMailer answers only the contact link routes on these hosts.

The project gives no Apache configuration.

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

Use systemd. It is on each current Linux distribution, so you do not install another package. The app repository has one unit for each process:

- [`deploy/systemd/byomailer-horizon.service`](https://github.com/amedina068/byomailer/blob/main/deploy/systemd/byomailer-horizon.service)
- [`deploy/systemd/byomailer-scheduler.service`](https://github.com/amedina068/byomailer/blob/main/deploy/systemd/byomailer-scheduler.service)
- [`deploy/systemd/byomailer-ses-events.service`](https://github.com/amedina068/byomailer/blob/main/deploy/systemd/byomailer-ses-events.service)

To install the units:

1. Copy the three files to `/etc/systemd/system/`.
2. In each file, replace `/var/www/byomailer` with the folder of the app.
3. If PHP-FPM does not run as `www-data`, replace the `User` and the `Group`.
4. Run `sudo systemctl daemon-reload`.
5. Run `sudo systemctl enable --now byomailer-horizon byomailer-scheduler byomailer-ses-events`.

Each unit has `Restart=always`. `ses-events:poll` and Horizon stop with exit code 0 by design, so `Restart=on-failure` does not start them again. The Horizon unit waits 330 seconds at stop, because a newsletter job can run for 300 seconds.

If you use Supervisor, use [`deploy/supervisor/byomailer.conf`](https://github.com/amedina068/byomailer/blob/main/deploy/supervisor/byomailer.conf) instead. It has the same three programs. Do not run the processes with systemd and Supervisor at the same time.

After each deploy, run `php artisan horizon:terminate` and `php artisan queue:restart`. The process manager then starts the processes with the new code.

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
