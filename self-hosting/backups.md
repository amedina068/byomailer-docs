---
title: Backups
description: Back up and restore the /data volume of the one-container image, or the .env file, the volumes and the MySQL database of a Docker Compose instance.
order: 7
---

# Backups

The app has no backup command. Use the Docker commands on this page or your own tools.

- With the one-container image, back up the `/data` volume. It holds the SQLite database, the uploads and `APP_KEY`. See [Back up the /data volume](#back-up-the-data-volume).
- With MySQL and Redis in Docker Compose, back up four things: the `.env` file, the `data` volume with the app key, the MySQL database, and the `storage` volume. The other sections of this page give the commands.

## Back up the /data volume

The container writes to the SQLite database while it runs. Stop the container before the backup, so the copy of the database is consistent:

```bash
docker stop byomailer
docker run --rm -v byomailer:/data -v "$PWD":/backup alpine \
  tar czf /backup/byomailer-$(date +%F).tar.gz -C /data .
docker start byomailer
```

The archive holds `/data/.secrets/app_key`. Keep it in a safe place outside the server, for example an encrypted backup.

## Restore the /data volume

`byomailer-2026-11-24.tar.gz` is the backup file. Use the name of your file.

1. Remove the container:

   ```bash
   docker rm -f byomailer
   ```

2. Extract the archive into a new, empty volume:

   ```bash
   docker volume create byomailer-restored
   docker run --rm -v byomailer-restored:/data -v "$PWD":/backup alpine \
     tar xzf /backup/byomailer-2026-11-24.tar.gz -C /data
   ```

3. Start the container with the restored volume. Use the same command as before, with `-v byomailer-restored:/data`.

The container runs the migrations when it starts. A backup from an older version gets the new migrations at the next start.

## What to back up with MySQL

| Item | Where | Why |
|---|---|---|
| `.env` | The folder of `docker-compose.yml` | `DB_PASSWORD`, the SQS settings and the other values of the install. |
| The app key | The `data` volume, file `/data/.secrets/app_key` | When `.env` has no `APP_KEY`, the container makes the key in this file on the first start. The key decrypts the secrets in the database. |
| The database | The `mysql` volume | All accounts, contacts, campaigns, statistics and settings. |
| The uploaded images | The `storage` volume, at `/data/storage/app` in the `web` container | The `public` disk and the MaxMind database. See [Storage](storage.md). |

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

## Back up `.env` and the app key

1. Copy `.env` to a safe place outside the server, for example a password manager or an encrypted backup.
2. If `.env` has no `APP_KEY`, also copy the key file:

   ```bash
   docker compose exec -T web cat /data/.secrets/app_key > byomailer-app-key.txt
   ```

3. Keep the key file in the same safe place. Then remove the copy from the server.
4. Make a new copy each time that you change `.env`.

## Back up the database

The `mysql` service has the environment variables `MYSQL_USER`, `MYSQL_PASSWORD` and `MYSQL_DATABASE`. They hold the app user, its password (`DB_PASSWORD`) and the database name. The root password is random, and no command on this page needs it. This command writes the dump on the host:

```bash
docker compose exec -T mysql sh -c 'exec mysqldump --single-transaction --no-tablespaces -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' > byomailer-$(date +%F).sql
```

- `-T` turns off the terminal, so the output is a clean file.
- `--single-transaction` makes a consistent dump of InnoDB tables while BYOMailer runs.
- `--no-tablespaces` lets the app user make the dump. Without it, `mysqldump` needs the `PROCESS` privilege.
- The single quotes make the shell of the container read the variables, not the shell of the host.

## Back up the storage volume

`docker-compose.yml` mounts the volume at `/data/storage/app` in the `web` service. This command writes a compressed archive on the host:

```bash
docker compose exec -T web tar -czf - -C /data/storage/app . > byomailer-storage-$(date +%F).tar.gz
```

## Before an update

Back up the database before you update BYOMailer. The `web` service runs the new migrations when it starts. See [Upgrading](../getting-started/upgrading.md).

## Restore

The app has no restore command. Restore with the Docker commands below, in this order. The procedure stops the app services during the restore, so it does not use maintenance mode. While the `web` service is stopped, the reverse proxy answers with an error.

`byomailer-2026-11-24.sql` and `byomailer-storage-2026-11-24.tar.gz` are the backup files. Use the names of your files.

1. Put the `.env` file of the backup in the folder of `docker-compose.yml`. If the backup has a key file and `.env` has no `APP_KEY`, add the key to `.env`: `APP_KEY=<the content of byomailer-app-key.txt>`.
2. Stop the app containers. MySQL and Redis continue to run:

   ```bash
   docker compose --profile ses stop web ses-events
   ```

3. Remove the database and create it again, empty. The app user has all privileges on its database, so it can do this. The grants stay:

   ```bash
   docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "DROP DATABASE IF EXISTS $MYSQL_DATABASE; CREATE DATABASE $MYSQL_DATABASE"'
   ```

4. Load the dump:

   ```bash
   docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' < byomailer-2026-11-24.sql
   ```

5. Erase the Redis data. The queued jobs and the cache refer to rows that the restore replaced. If they stay, the workers can send email again or update the wrong rows:

   ```bash
   docker compose exec redis redis-cli FLUSHALL
   ```

6. Extract the storage archive into the `storage` volume:

   ```bash
   docker compose run --rm --no-deps -T --entrypoint tar web -xzf - -C /data/storage/app < byomailer-storage-2026-11-24.tar.gz
   ```

7. Start the stack:

   ```bash
   docker compose up -d
   ```

   If you run the SES events worker in its own container, start it with `docker compose --profile ses up -d`.

8. Wait until `docker compose ps` shows the `web` service as healthy.
9. Sign in, and open a newsletter and **Settings > Email Credentials**. Make sure that the data and the AWS credentials show.

`FLUSHALL` also ends the web sessions, so each user signs in again. The SES events that arrived during the restore wait in the SQS queue. The worker reads them after step 7.

These rules come from the code:

- Restore the same `APP_KEY` that was in use when you made the database backup. If you use a new key, put the old key in `APP_PREVIOUS_KEYS`.
- The `web` service runs the migrations when it starts. A dump from an older version gets the new migrations at the next start.
