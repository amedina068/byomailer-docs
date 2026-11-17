---
title: Backups
description: Back up APP_KEY and the .env file, the database and the storage volume of a Docker instance.
order: 7
---

# Backups

Back up three things: the `.env` file with `APP_KEY`, the MySQL database, and the `storage` volume. The app has no backup command. Use the Docker commands on this page or your own tools.

## What to back up

| Item | Where | Why |
|---|---|---|
| `.env`, with `APP_KEY` | The folder of `docker-compose.yml` | `APP_KEY` decrypts the secrets in the database. |
| The database | The `mysql` volume | All accounts, contacts, campaigns, statistics and settings. |
| The uploaded images | The `storage` volume | The `public` disk and the MaxMind database. See [Storage](storage.md). |

The `redis` volume holds the queued jobs, the cache and the sessions. Laravel writes failed jobs to the `failed_jobs` table of the database.

## `APP_KEY`

BYOMailer encrypts these values with `APP_KEY`:

- The AWS access key and secret key of each account.
- The bucket keys in the storage settings of each user.
- The secret of each webhook endpoint.
- The two-factor secret and the recovery codes of each user.

The setup token of `/setup` also comes from `APP_KEY`.

WARNING: Keep a copy of `APP_KEY` outside the server. If you lose the key, BYOMailer cannot decrypt these values. Every account must then enter its AWS credentials again.

To change `APP_KEY`, put the old key in `APP_PREVIOUS_KEYS`. This variable is a comma-separated list. Laravel then also decrypts values with the old keys.

## Back up `.env`

1. Copy `.env` to a safe place outside the server, for example a password manager or an encrypted backup.
2. Make a new copy each time that you change `.env`.

## Back up the database

The `mysql` service has the environment variables `MYSQL_ROOT_PASSWORD` and `MYSQL_DATABASE`. This command uses them and writes the dump on the host:

```bash
docker compose exec -T mysql sh -c 'exec mysqldump --single-transaction --no-tablespaces -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' > byomailer-$(date +%F).sql
```

- `-T` turns off the terminal, so the output is a clean file.
- `--single-transaction` makes a consistent dump of InnoDB tables while BYOMailer runs.
- The single quotes make the shell of the container read the variables, not the shell of the host.

## Back up the storage volume

`docker-compose.yml` mounts the volume at `/var/www/html/storage/app` in the `web` service. This command writes a compressed archive on the host:

```bash
docker compose exec -T web tar -czf - -C /var/www/html/storage/app . > byomailer-storage-$(date +%F).tar.gz
```

## Before an update

Back up the database before you update BYOMailer. The `web` service runs the new migrations when it starts. See [Upgrading](../getting-started/upgrading.md).

## Restore

TODO(owner): The app has no restore command. What restore procedure do you support: the order of the steps, maintenance mode, and the commands to load the dump and the storage archive?

These rules come from the code:

- Restore the same `APP_KEY` that was in use when you made the database backup. If you use a new key, put the old key in `APP_PREVIOUS_KEYS`.
- The `web` service runs the migrations when it starts. A dump from an older version gets the new migrations at the next start.
