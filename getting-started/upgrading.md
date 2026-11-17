---
title: Upgrade BYOMailer
description: Update a Docker install or a manual install to a new version, and rotate the application key.
order: 7
---

# Upgrade BYOMailer

An upgrade replaces the code and runs the new database migrations. Back up the instance before each upgrade.

## Read the changes first

The release notes are in `resources/release-notes.json`. Each key is a date (`YYYY-MM-DD`), and each value is a list of changes. The app shows them at `/documentation/release-notes`.

Read the release notes from the date of your current version to today. Look for changes to environment variables, to `docker-compose.yml`, and to the AWS permissions.

TODO(owner): The release notes have dates but no version numbers, and the repository has no tags and no `CHANGELOG.md` on `oss/prep`. How does a self-hoster find the version that runs, and which version to upgrade to?

## Back up first

Back up these items before you start:

- `.env`, with `APP_KEY`.
- The database. In Docker, this is the `mysql` volume.
- The uploaded files. In Docker, this is the `storage` volume.

[Backups](../self-hosting/backups.md) gives the commands.

CAUTION: Do not start an upgrade without a database backup. The migrations change the database, and a failed upgrade can leave it in a mixed state.

## Upgrade a Docker install

1. Back up the instance.
2. Get the new code:

   ```bash
   git pull
   ```

3. Compare `.env.example` with your `.env`. Add the new variables that you need.
4. If you use the `ses-events` worker, add `--profile ses` to the command of the next step. Without the profile, Compose does not rebuild that service.
5. Rebuild the image and restart the stack:

   ```bash
   docker compose up -d --build
   ```

6. Wait until `docker compose ps` shows the `web` service as healthy.
7. Read the log of the `web` service for errors:

   ```bash
   docker compose logs web
   ```

The `web` service runs the new migrations each time it starts, before NGINX serves requests. The `horizon`, `scheduler`, and `ses-events` services start only after the `web` service is healthy. Only the `web` service runs the migrations.

TODO(owner): A published Docker image is in an open pull request (`docker-compose.image.yml`), not on `oss/prep`. When it is merged, how does a self-hoster upgrade with the image?

## Upgrade a manual install

1. Back up the instance.
2. Optional: put the app in maintenance mode:

   ```bash
   php artisan down
   ```

3. Get the new code:

   ```bash
   git pull
   ```

4. Compare `.env.example` with your `.env`. Add the new variables that you need.
5. Install the PHP dependencies:

   ```bash
   composer install --no-dev --optimize-autoloader
   ```

6. Install the Node dependencies and build the frontend:

   ```bash
   npm ci
   npm run build
   ```

7. Run the migrations:

   ```bash
   php artisan migrate --force
   ```

8. If you cache the configuration, cache it again:

   ```bash
   php artisan config:cache
   ```

9. Stop Horizon, so that the process manager starts it again with the new code:

   ```bash
   php artisan horizon:terminate
   ```

10. Send the restart signal. The `ses-events:poll` worker stops when it gets this signal:

    ```bash
    php artisan queue:restart
    ```

11. Restart the scheduler process.
12. If OPcache is on, reload PHP-FPM.
13. If you used maintenance mode, end it:

    ```bash
    php artisan up
    ```

Make sure that the process manager started `php artisan horizon` and `php artisan ses-events:poll` again. [Install without Docker](installation-manual.md) lists the processes.

## Notes for older installs

The migration of 2026-11-17 adds the owner of the instance. It makes each user in `ADMIN_EMAILS` an owner. If `ADMIN_EMAILS` is empty, the instance has no owner after the upgrade. Then run this command:

```bash
php artisan byomailer:install --promote=person@example.com
```

In Docker, put `docker compose exec web` before the command.

TODO(owner): The app has one-time commands for older data: `ses-events:migrate-to-sqs`, `ses:migrate-configuration-sets`, and `ses:backfill-tenants`. Does an upgrade of a self-hosted instance ever need them?

## Rotate the application key

`APP_KEY` encrypts the AWS access keys of each account, the storage keys, and the webhook secrets. `config/app.php` reads `APP_PREVIOUS_KEYS`, a comma-separated list of old keys. Laravel uses these old keys to decrypt values that it cannot decrypt with `APP_KEY`.

1. Back up `.env` and the database.
2. Generate a new key:

   ```bash
   openssl rand -base64 32
   ```

3. In `.env`, copy the current value of `APP_KEY` to `APP_PREVIOUS_KEYS`.
4. In `.env`, set `APP_KEY=base64:` followed by the new key.
5. Restart the stack. In Docker, run `docker compose up -d`. In a manual install, cache the configuration again and restart the processes.
6. Open **Settings > Email Credentials** and make sure that the credentials still show.

The values in the database stay encrypted with the old key. BYOMailer has no command that encrypts them again with the new key. Keep the old key in `APP_PREVIOUS_KEYS` until BYOMailer saved each encrypted value again.

WARNING: Do not remove an old key from `APP_PREVIOUS_KEYS` while the database has values that it encrypted. If you remove it, BYOMailer cannot read these values, and each account must enter its AWS credentials again.

TODO(owner): Is a re-encryption command planned, so that an owner can remove an old key from `APP_PREVIOUS_KEYS` after a rotation?
