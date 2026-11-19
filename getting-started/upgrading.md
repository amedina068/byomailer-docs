---
title: Upgrade BYOMailer
description: Update a Docker install or a manual install to a new version, and rotate the application key.
order: 7
---

# Upgrade BYOMailer

An upgrade replaces the code and runs the new database migrations. Back up the instance before each upgrade.

## Read the changes first

`CHANGELOG.md` lists the changes of each version. BYOMailer uses semantic versioning, and each release has a Git tag `vX.Y.Z`.

To find the version that runs:

- In a Git install, run `git describe --tags`.
- With the published image, read the value of `BYOMAILER_VERSION` in `.env`.

Read `CHANGELOG.md` from your version to the new version before you upgrade. Look for changes to environment variables, to `docker-compose.yml`, and to the AWS permissions.

The [release notes](release-notes.md) list the changes that users can see, by date. They have no version numbers.

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

## Upgrade with the published image

If you use `docker-compose.image.yml`, do these steps:

1. Back up the instance.
2. If you set an exact version, set the new `BYOMAILER_VERSION` in `.env`.
3. Run `docker compose -f docker-compose.image.yml pull`.
4. Run `docker compose -f docker-compose.image.yml up -d`. If you use the `ses-events` worker, add `--profile ses`.
5. Wait until the `web` service shows `healthy`. The `web` service runs the migrations.

With `BYOMAILER_VERSION=latest`, each pull can move to a new version. Set an exact version to control the time of the upgrade.

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

An instance that started on version 0.1.0 or later does not need `ses-events:migrate-to-sqs`, `ses:migrate-configuration-sets` or `ses:backfill-tenants`. These commands convert data from development builds before the first release. The current AWS onboarding creates the SQS subscription, the tenant and one configuration set for each identity.

Before this release, the **Update Credentials** form in **Settings > Email Credentials** erased the SNS topic and the tenant of the account. If a user saved new keys with that form, the SES events of the account stopped. To correct this, the user runs the AWS onboarding again at `/onboarding/aws`.

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
