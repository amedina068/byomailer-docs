---
title: Install with Docker
description: Run BYOMailer in one container with one volume, or with MySQL and Redis in Docker Compose, and create the owner account.
order: 2
---

# Install with Docker

The image `ghcr.io/amedina068/byomailer` holds the full app. One container runs the web server, the queue worker, the scheduler and the SES events worker. One volume at `/data` holds the SQLite database, the uploads and the generated secrets. You need no `.env` file, no keys and no database server.

A version tag (`v0.1.0` and later) publishes the image for `linux/amd64` and `linux/arm64`. Before the first tag, build the image from a clone: `docker build -t ghcr.io/amedina068/byomailer .`

## Try BYOMailer on your computer

```bash
docker run -d --name byomailer -p 8080:8080 -v byomailer:/data ghcr.io/amedina068/byomailer
docker logs -f byomailer
```

The last two lines of the log tell you when the app is ready and which URL to open:

```text
✓ BYOMailer is ready (5s)
→ Open http://localhost:8080/setup?token=<setup-token>
```

Open the URL and create the owner account. See [The setup page](#the-setup-page).

## Install on a server

1. Point a DNS A record for your domain, for example `mail.example.com`, to the server.
2. Run the installer on the server:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/amedina068/byomailer/main/install.sh | bash
   ```

3. Enter the domain when the installer asks for it. Press Enter for `localhost`.

The installer checks the CPU, Docker, the memory and the ports. Then it pulls the image, starts the container, waits for `/up` and shows the setup URL in a summary box. It writes a log to `/tmp/byomailer-install.log`.

The installer has these options:

| Option | Purpose |
|---|---|
| `--domain=<host>` | Use this domain. The installer does not ask. |
| `--non-interactive` | Ask nothing. The installer reads the domain from `APP_DOMAIN`. |
| `--env-file=<path>` | Give the variables in this file to the container, for example the SQS settings of the SES events. |
| `--dry-run` | Print each `docker` command. Change nothing. |

You can run the installer again. It replaces the container and keeps the volume. This is also the upgrade procedure.

## Start the container without the installer

Set `APP_DOMAIN` and publish ports 80 and 443:

```bash
docker run -d --name byomailer --restart unless-stopped \
  -p 80:80 -p 443:443 -p 443:443/udp \
  -e APP_DOMAIN=mail.example.com \
  -v byomailer:/data \
  ghcr.io/amedina068/byomailer
```

When `APP_DOMAIN` is set, Caddy in the container serves ports 80 and 443 with automatic HTTPS. Caddy gets the certificate on the first request and keeps it in `/data/caddy`. Open and click tracking and the unsubscribe links need HTTPS.

`APP_DOMAIN` is the only required variable for production. The app derives `APP_URL`, the cookie settings and the trusted hosts from it. To put the app behind your own proxy, read [Reverse proxy and TLS](../self-hosting/reverse-proxy-and-tls.md).

## What the container does

Each time that the container starts, it does these steps:

1. It makes the folders in `/data`. On the first start, it writes a new `APP_KEY` to `/data/.secrets/app_key` with mode 600.
2. It runs the database migrations. A new database loads the schema dump first, so the first start is fast.
3. It starts the web server on port 8080, the queue worker and the scheduler.
4. If the SQS settings exist, it starts the `ses-events:poll` worker. See [Start the SES events worker](#start-the-ses-events-worker).
5. When `/up` answers, it prints the ready line and the URL to open. While the instance has no account, the URL is the setup URL.

The queue worker depends on `QUEUE_CONNECTION`. The image uses the `database` queue and runs `queue:work`. With `QUEUE_CONNECTION=redis`, it runs Horizon. Read [Queues and Horizon](../self-hosting/queues-and-horizon.md).

The image has a Docker health check on `/up`.

## The /data volume

| Path | Content |
|---|---|
| `/data/.secrets/app_key` | The application key. The container makes it on the first start. |
| `/data/database.sqlite` | The SQLite database. |
| `/data/storage` | The uploaded images, the logs and the GeoIP database. |
| `/data/caddy` | The TLS certificates, when `APP_DOMAIN` is set. |

[Backups](../self-hosting/backups.md) gives the commands to back up and restore the volume.

## The setup page

The setup page is at `/setup`. While the instance has no user, BYOMailer sends `/`, `/login` and `/register` to `/setup`.

1. Open the setup URL from the log. The URL holds the setup token.
2. Enter the **Name**, the **Email address** and the **Password** of the owner.
3. Enter the password again in **Confirm password**.
4. Click **Create the owner account**.

BYOMailer creates the owner, signs the owner in and opens the dashboard. The owner gets a new account, the team `admin` role and a verified email address. The dashboard then shows the Amazon SES steps. See [Connect AWS SES](connect-aws-ses.md).

These rules apply to the setup page:

- If you open `/setup` without the token, the page shows the commands that print the setup URL. It also has a field for the token or the full setup URL.
- If the token in the URL is not correct, the page says "The token in this URL is not correct." It does not show the wrong token.
- After the first user exists, `/setup` sends you to the login page.
- The setup token comes from `APP_KEY`. BYOMailer does not store it. If `APP_KEY` changes, the token also changes.
- The page accepts 10 requests per minute.

If you lost the setup URL, run this command:

```bash
docker exec byomailer php artisan byomailer:setup-url
```

If an account already exists, the command shows "An account already exists. The setup page is closed."

## Create the owner from the command line

You can create the owner without the setup page:

```bash
docker exec byomailer php artisan byomailer:install --name="Ada Lovelace" --email=ada@example.com
```

The command returns a one-time login link. After the first login, the owner sets a password on the profile page.

The command has these options:

| Option | Purpose |
|---|---|
| `--name=` | The name of the owner. |
| `--email=` | The email address of the owner. |
| `--timezone=` | The timezone of the account. The default is `UTC`. |
| `--with-token=` | Also make an API token with this name. The output then has the lines that connect an MCP client. |
| `--json` | Write one JSON object to stdout, for scripts and AI agents. |
| `--promote=` | Make the existing user with this email an owner. The command creates no account. |
| `--prepare` | Prepare the instance only (the storage link). The command creates no account. |

You can run the command again. If the instance has an owner, the command creates no second owner. It returns the status `exists` and a new login link. The steps for an AI agent are in [`INSTALL.md`](https://github.com/amedina068/byomailer/blob/main/INSTALL.md) of the app repository.

The owner can open the admin area at `/admin`. With Redis, the owner can also open Horizon at `/horizon`. [Accounts and registration](../self-hosting/accounts-and-registration.md) explains the owner and the registration modes.

## Back up the application key

WARNING: Back up the `/data` volume, or at least `/data/.secrets/app_key`. If you lose the key, BYOMailer cannot read the encrypted data in the database.

BYOMailer encrypts these values with `APP_KEY`:

- The AWS access keys of each account.
- The storage keys in **Settings > Storage**.
- The signing secret of each webhook endpoint.

If you lose `APP_KEY`, each account must enter its AWS credentials again. [Backups](../self-hosting/backups.md) lists the other items to back up.

## Start the SES events worker

SES sends the bounces, complaints, opens and clicks through one SQS queue. The `ses-events:poll` worker reads the queue. Without this worker, BYOMailer does not see the bounces and the complaints.

The AWS connection of an account subscribes to this queue. It stops with the error "SQS queue ARN is not configured. Set SES_EVENTS_SQS_QUEUE_ARN in your environment." when the queue is not set. For this reason, set the queue before the first account connects AWS. The dashboard of the owner shows this step first.

1. Create the SQS queue and the IAM user for the worker. [SES events](../self-hosting/ses-events.md) gives the steps and the queue policy.
2. Put the settings in a file, for example `/root/byomailer.env`:

   ```dotenv
   PLATFORM_AWS_ACCESS_KEY_ID=<access-key-id>
   PLATFORM_AWS_SECRET_ACCESS_KEY=<secret-access-key>
   PLATFORM_AWS_REGION=us-east-1
   SES_EVENTS_SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/111111111111/byomailer-ses-events
   SES_EVENTS_SQS_QUEUE_ARN=arn:aws:sqs:us-east-1:111111111111:byomailer-ses-events
   ```

3. Set the file mode to 600: `chmod 600 /root/byomailer.env`.
4. Run the installer again with the file:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/amedina068/byomailer/main/install.sh \
     | bash -s -- --env-file=/root/byomailer.env
   ```

   Without the installer, add `--env-file /root/byomailer.env` to your `docker run` command.

5. Run `docker exec byomailer php artisan byomailer:doctor`. The `ses_events` check must be `ok`.

When the three settings `PLATFORM_AWS_ACCESS_KEY_ID`, `PLATFORM_AWS_SECRET_ACCESS_KEY` and `SES_EVENTS_SQS_QUEUE_URL` are empty, the worker does not start. It also does not restart in a loop.

## MySQL and Redis with Docker Compose

The default database is SQLite, and it is enough for one server. To use MySQL 8.4 and Redis, use `docker-compose.yml`. In this mode, the queue runs on Horizon.

1. Clone the repository and go into its directory:

   ```bash
   git clone https://github.com/amedina068/byomailer.git
   cd byomailer
   ```

2. Copy the example file:

   ```bash
   cp .env.example .env
   ```

3. In `.env`, set `APP_DOMAIN`. Set `DB_PASSWORD` and `DB_ROOT_PASSWORD` to two strong passwords, for example from `openssl rand -hex 24`.
4. In `.env`, remove the `#` from the lines of the "MySQL and Redis" block. The block sets `COMPOSE_PROFILES=mysql`, so Compose also starts MySQL and Redis.
5. Start the stack:

   ```bash
   docker compose up -d --build
   docker compose logs -f web
   ```

6. Wait for the line `BYOMailer is ready`. The next line is the setup URL. Open it and create the owner account.

Compose stops with an error if `DB_PASSWORD` or `DB_ROOT_PASSWORD` is empty. The first start waits for MySQL and loads the schema dump. The `web` container stays up while the migrations run.

In the Compose stack, replace `docker exec byomailer` with `docker compose exec web` in the commands of this documentation. To start the SES events worker of the Compose stack, set the SQS variables in `.env` and add the `ses` profile:

```bash
docker compose --profile ses up -d
```

WARNING: Never run `docker compose down -v`. It deletes the database volume.

[Configuration](configuration.md) lists the other variables.

## System mail

Invites, password resets and alerts use the mailer in `MAIL_MAILER`. By default, these emails go to the log and not to the recipient. Newsletters and sequences do not use this mailer. Read [System mail](../self-hosting/system-mail.md).

If no mailer works, you can recover an account from the command line. Read [Recover access](../self-hosting/recover-access.md).

## Next steps

- [Connect AWS SES](connect-aws-ses.md) for the first account.
- [Send your first newsletter](first-newsletter.md).
- [Upgrade BYOMailer](upgrading.md) when a new version is available.
