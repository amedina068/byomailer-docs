---
title: Development setup
description: Install BYOMailer on your computer with PHP 8.4, Node 24 and SQLite, and fill it with demo data.
order: 2
---

# Development setup

This page tells you how to run BYOMailer on your computer for development. To run an instance for real use, read [Manual installation](../getting-started/installation-manual.md) or [Docker installation](../getting-started/installation-docker.md).

For the structure of the code, read [Architecture](architecture.md).

## Requirements

| Item | Version | Note |
|---|---|---|
| PHP | 8.4.1 or later, not 8.5 | Extensions: `bcmath`, `exif`, `gd`, `intl`, `pdo_sqlite`, `redis`. The CI also loads `zip`. |
| Composer | | Installs the PHP packages. |
| Node | 24 | The `.nvmrc` file names the version. Vite 7 and Vitest 4 fail on older versions. |
| Redis | Optional | Only for work on Horizon or on the Redis drivers. |

### Why PHP 8.5 does not work

`composer.json` accepts PHP `^8.3`, but `composer.lock` sets the limits:

- `phpoffice/phpspreadsheet` 1.30.5 requires PHP `>=7.4.0 <8.5.0`. `maatwebsite/excel` needs this package for the imports and exports.
- The Symfony 8 packages, for example `symfony/console`, require PHP `>=8.4.1`.

Thus `composer install` accepts PHP 8.4.1 to 8.4.x only. The `Dockerfile` and the CI also use PHP 8.4.

## Install

1. Clone the app repository and go into its folder.
2. If you use nvm, run `nvm use`.
3. Run the setup script:

   ```bash
   composer setup
   ```

4. Create the owner account:

   ```bash
   php artisan byomailer:install
   ```

5. Start the development processes:

   ```bash
   composer dev
   ```

6. Open `http://localhost:8000` and log in with the owner account.

`composer setup` does these steps:

1. It runs `composer install`.
2. It copies `.env.example` to `.env`, if `.env` does not exist.
3. It runs `php artisan key:generate`.
4. It runs `php artisan migrate --force`. If `database/database.sqlite` does not exist, the migration creates it.
5. It runs `npm install` and `npm run build`.

`npm run build` also makes the SSR bundle in `bootstrap/ssr`. The PHP tests turn off SSR, so they pass while that folder exists. Read [Testing](testing.md).

### The owner account

`php artisan byomailer:install` asks for a name, an email and a password. You can also give them as options:

```bash
php artisan byomailer:install --name="Dev Owner" --email=owner@example.com --password=<password> --timezone=UTC
```

| Option | Use |
|---|---|
| `--name`, `--email`, `--password` | The data of the owner. If an option is missing, the command asks for it. |
| `--timezone` | The timezone of the account. The default is `UTC`. |
| `--promote=<email>` | Make an existing user an owner. The command creates no account. |
| `--prepare` | Prepare the instance only, and create no account. |

The command creates only the first user. If a user exists, it stops with an error. Use `--promote` then.

You can also create the owner on the setup page. Run `php artisan byomailer:setup-url` to get the URL with the setup token. For more, read [Accounts and registration](../self-hosting/accounts-and-registration.md).

### Use the host of `APP_URL`

`.env.example` sets `APP_URL=http://localhost`. `php artisan serve` shows `http://127.0.0.1:8000`, but open `http://localhost:8000` instead.

The `RestrictHostToLinkRoutes` middleware compares the host of each request with the host of `APP_URL`. The port is not part of the host. A request on another host, for example `127.0.0.1`, gets `404`. If you want a different host, change `APP_URL`.

## What `composer dev` starts

`composer dev` starts four processes with `concurrently`:

| Name | Command | Use |
|---|---|---|
| `server` | `php artisan serve` | The web server on port 8000 |
| `queue` | `php artisan queue:listen --tries=1` | A queue worker |
| `logs` | `php artisan pail --timeout=0` | The log viewer |
| `vite` | `npm run dev` | The Vite dev server with hot reload |

`composer dev` does not start the scheduler or Horizon. Note these limits:

- The `queue` process reads only the `default` queue. The jobs on the `newsletter`, `sequences`, `automations`, `ses-events`, `tracking-domains` and `webhooks` queues stay in the queue.
- Scheduled newsletters and sequence steps need the scheduler.

If you work on these parts, start the missing processes in another terminal:

```bash
php artisan queue:listen --tries=1 --queue=default,newsletter,sequences,automations,ses-events,tracking-domains,webhooks
php artisan schedule:work
```

`composer dev:ssr` builds the SSR bundle and starts `php artisan inertia:start-ssr` in place of Vite.

## Local settings

`.env.example` sets these values for local development:

| Variable | Value | Effect |
|---|---|---|
| `DB_CONNECTION` | `sqlite` | The database is `database/database.sqlite`. |
| `QUEUE_CONNECTION` | `database` | Jobs go to the `jobs` table. |
| `CACHE_STORE` | `database` | The cache uses the database. |
| `SESSION_DRIVER` | `database` | Sessions use the database. |
| `MAIL_MAILER` | `log` | System mail goes to the log. |
| `INERTIA_SSR_ENABLED` | `true` | Inertia tries server-side rendering. |

`MAIL_MAILER` controls the system mail of the instance only. Campaign email goes through the SES account of each account. Read [Architecture](architecture.md).

For all variables, read [Configuration](../getting-started/configuration.md).

## Demo data

The seeder fills the database with a demo account. Run it one time:

```bash
php artisan db:seed
```

The seeder creates:

- The user `demo@example.com` with the password `password`. The account uses the timezone `America/New_York`.
- AWS credentials and two sender identities.
- Three lists with topics, five tags and 500 contacts with attributes.
- Newsletters, sequences, visual automations and email templates, with sent mails and clicks.

The demo user is not an owner. To make it an owner, run `php artisan byomailer:install --promote=demo@example.com`. If you run the seeder after `php artisan byomailer:install`, the instance has two accounts.

### `TEST_*` variables

The seeder reads these optional variables. If a variable is not set, the seeder uses the default value. `.env.example` lists them as comments.

| Variable | Default | Use |
|---|---|---|
| `TEST_AWS_KEY_ID` | A fake key | The AWS access key of the demo account |
| `TEST_AWS_KEY_SECRET` | A fake secret | The AWS secret key of the demo account |
| `TEST_AWS_REGION` | `us-east-1` | The AWS region of the demo account |
| `TEST_SNS_TOPIC_ARN` | A fake ARN | The SNS topic of the demo account |
| `TEST_SNS_SUBSCRIPTION_ARN` | A fake ARN | The SNS subscription of the demo account |
| `TEST_EMAIL_FROM` | `updates@example.com` | The email of the first sender identity |
| `TEST_EMAIL_NAME` | `Updates Team` | The name of the first sender identity |
| `TEST_EMAIL_DOMAIN` | Empty | The domain of both sender identities. The second identity uses `announcements@<domain>`. |
| `TEST_EMAIL_FROM_SUBDOMAIN` | Empty | The MAIL FROM subdomain |
| `TEST_EMAIL_REGION` | The value of `TEST_AWS_REGION` | The SES region of the sender identities |
| `TEST_EMAIL_STATUS` | `verified` | The status of the sender identities |
| `TEST_EMAIL_CONFIGURATION_SET` | Empty | The SES configuration set of the first sender identity |

WARNING: Do not put real AWS keys in `TEST_AWS_KEY_ID` and `TEST_AWS_KEY_SECRET` unless you want real email. With real keys, a local send goes through your SES account to the demo contacts.

## Send email locally

Each campaign email goes through the SES API with the AWS keys of the account. The fake keys of the seeder make AWS refuse the call. To send real email, connect a real SES account in the dashboard. Read [Connect AWS SES](../getting-started/connect-aws-ses.md).

The jobs that send newsletters and sequence steps use the `ses-sending` rate limiter. With the `database` queue of `.env.example`, the limiter keeps its counters in the cache. It needs no Redis.

CAUTION: Before you run a send command by hand, make sure that the local database has no real AWS credentials. To check the send code, write a test. Read [Testing](testing.md).
