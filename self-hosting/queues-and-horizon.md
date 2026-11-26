---
title: Queues and Horizon
description: The Redis queues, the Horizon supervisors, access to /horizon and failed jobs.
order: 3
---

# Queues and Horizon

BYOMailer does most of its work in queued jobs: it sends newsletters and sequence emails, processes SES events, runs automations and delivers webhooks. `QUEUE_CONNECTION` selects the worker for these jobs:

| `QUEUE_CONNECTION` | Worker |
|---|---|
| `database` | `php artisan queue:work`. This is the default of the one-container image. It needs no Redis. |
| `redis` | Laravel Horizon, with the supervisors of `config/horizon.php`. |

The one-container image starts the worker as a service. It reads `QUEUE_CONNECTION` and starts `queue:work` or Horizon. When the queue is not `redis`, the app does not load Horizon, and `/horizon` does not exist.

To see the state of the worker, run `docker exec byomailer php artisan byomailer:status`. The `queue` value shows the last heartbeat of the worker.

The rest of this page is about Horizon on Redis. In the Docker Compose stack with the `mysql` profile, the queue is `redis`, so Horizon runs the workers.

## The queues

Each queue has its own Horizon supervisor in `config/horizon.php`.

| Queue | Jobs on this queue | Tries | Timeout (seconds) |
|---|---|---|---|
| `default` | Jobs with no queue name, for example the queued system emails, the opt-in emails and the contact import batches. | 3 | 120 |
| `newsletter` | `SendNewsletterJob`, `DispatchNewsletterBatchJob`, `SendNewsletterChunkJob`. | 3 | 300 |
| `sequences` | `SendSequenceContactMailJob`, and the listeners that schedule the first step and apply the sequence filters. | 3 | 120 |
| `automations` | `RunAutomationForContactJob`, the visual automation steps, and the listeners that start automations. | 3 | 60 |
| `ses-events` | `ProcessSesEventJob`. See [SES events](ses-events.md). | 3 | 60 |
| `tracking-domains` | `VerifyTrackingDomainJob`. | 1 | 90 |
| `webhooks` | `DeliverWebhookJob` and `WebhookEventListener`. | 5 | 30 |

Each supervisor uses `balance` `auto` and the `time` scaling strategy. Each worker process can use 128 MB. The Horizon master process has a limit of 64 MB.

## Processes in each environment

Horizon reads the block of `environments` that has the same name as `APP_ENV`. `docker-compose.yml` sets `APP_ENV` to `production` by default.

| Queue | `production` | `local` |
|---|---|---|
| `default` | 2 | 2 |
| `newsletter` | 2 | 3 |
| `sequences` | 2 | 2 |
| `automations` | 2 | 2 |
| `ses-events` | 4 | 2 |
| `tracking-domains` | 1 | 1 |
| `webhooks` | 3 | 2 |

The numbers are the maximum processes of each supervisor.

CAUTION: Use `production` or `local` for `APP_ENV`. `config/horizon.php` has no other environment and no `*` wildcard. With another value, Horizon starts no supervisor and no job runs.

## Who can open `/horizon`

The Horizon dashboard is at `/horizon`. The `viewHorizon` gate in `app/Providers/HorizonServiceProvider.php` lets a signed-in user in when one of these is true:

- The user is an owner of the instance.
- The email of the user is in `ADMIN_EMAILS`.

`ADMIN_EMAILS` is a comma-separated list. The comparison is exact.

```dotenv
ADMIN_EMAILS=ops@example.com,admin@example.com
```

WARNING: Do not set `APP_ENV=local` on a public instance. In the `local` environment, Horizon lets every visitor open the dashboard.

## Failed jobs

A job fails when it uses all its tries. Laravel then writes it to the `failed_jobs` table (driver `database-uuids`). Horizon also shows it on the **Failed** page.

Horizon keeps the failed jobs in Redis for 10080 minutes (7 days). The `failed_jobs` table keeps them until you remove them.

Some jobs set a status when they fail:

- `SendNewsletterJob` sets the newsletter to `failed`. If SES permissions are missing, it also emails the author. See [System mail](system-mail.md).
- `SendNewsletterChunkJob` sets the pending emails of its chunk to `failed`, with the error as the reason.

Use these commands to read and retry failed jobs:

```bash
docker compose exec web php artisan queue:failed
docker compose exec web php artisan queue:retry all
```

You can also retry a job from the Horizon dashboard.

A retry does not send a newsletter email to a contact two times. BYOMailer keeps one email row for each contact and newsletter. A retried chunk job skips each contact that already has a row. As a result, a retry also does not send the emails that have the status `failed`.

A retried sequence job sends only the emails that are still `pending`, not sent, and not claimed again by a later scheduler run.

One exception exists. If a worker stops after SES accepted an email, but before BYOMailer saved the `sent` status, that email can go out again.

## Restart the workers

After you change the code or `.env`, start the workers again. In the Docker stack, recreate the services:

```bash
docker compose up -d
```

`docker-compose.yml` gives the `horizon` service 60 seconds to stop. Horizon finishes the current jobs in that time.

On a server without Docker, run `php artisan horizon:terminate`. Your process manager then starts Horizon again.

## Logs

```bash
docker compose logs -f horizon
```

`docker-compose.yml` sets `LOG_CHANNEL=stderr`, so the errors of the jobs go to this log.
