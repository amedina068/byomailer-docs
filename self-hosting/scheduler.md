---
title: Scheduler
description: The scheduled tasks of BYOMailer, with their frequency and what each task does.
order: 4
---

# Scheduler

BYOMailer uses the Laravel scheduler for the work that runs at fixed times. The scheduler sends the scheduled newsletters and the sequence steps. If the scheduler does not run, these emails do not go out.

In the Docker stack, the `scheduler` service runs `php artisan schedule:work`. This command runs the due tasks each minute. The service starts after the `web` service is healthy.

On a server without Docker, run `php artisan schedule:run` each minute from cron, or keep `php artisan schedule:work` running.

## Scheduled tasks

All the tasks are in `routes/console.php`. The times are in UTC, because `config/app.php` sets the timezone to `UTC`.

| Command | Frequency | What it does |
|---|---|---|
| `contact-mails:send-due-newsletters` | Each minute, no overlap | Starts the sending jobs of the newsletters whose scheduled time is due. |
| `contact-mails:send-due-sequence-steps` | Each minute, no overlap | Takes the due sequence step emails and puts them on the `sequences` queue. |
| `visual-automations:process` | Each minute, no overlap | Puts the pending steps of visual automations on the `automations` queue. |
| `email-identities:refresh-dns-status` | Every 15 minutes | Checks the DNS status of the sender identities that are pending or verifying. It also checks the DMARC record of a verified identity again after one day. |
| `email-identities:check-tracking-domain-dns` | Every 30 minutes, no overlap | Queues a `VerifyTrackingDomainJob` for each custom tracking domain that is not verified. |
| `email-identities:check-link-domain` | Every 30 minutes, no overlap | Activates each custom link domain after Cloudflare for SaaS issued its certificate. |
| `ses:fetch-quota` | Each hour | Reads the SES quota and status of each account with AWS credentials: sandbox or production, sending paused or not, the 24-hour limit and the send rate. |
| `ses:sync-configuration-sets` | Each hour | Reads the tracking settings of the SES configuration sets and the API permissions from AWS, and stores them in the database. |
| `ses:send-permission-alerts` | Each hour | Emails a user whose AWS credentials do not have the necessary SES permissions. |
| `ses:send-sequence-blocked-digest` | Each day at 09:00 | Emails a user whose sequence emails failed because of missing SES permissions. |
| `contacts:apply-sunset` | Each day at 04:00, no overlap | Marks as sunset the contacts with no click in the sunset period of their account. |
| `geoip:download` | Monday and Thursday at 03:00 | Downloads the MaxMind GeoLite2-City database. It runs only when `MAXMIND_LICENSE_KEY` is set. |
| `model:prune --model=App\Models\WebhookDelivery` | Each day | Removes the webhook delivery rows that are older than `WEBHOOKS_DELIVERY_RETENTION_DAYS` (default 30). |

"No overlap" means `withoutOverlapping()`. If the previous run of the task did not finish, the scheduler skips the new run. The lock is in the cache, which is Redis in the Docker stack.

`routes/console.php` also contains `summary:send-weekly` (`SendWeeklySummaryMail`), but the schedule entry is a comment. That task does not run.

TODO(owner): Does the scheduler need `onOneServer()` for instances with more than one scheduler process?

## Make sure that the scheduler runs

1. Run `docker compose ps`.
2. Make sure that the `scheduler` service shows `healthy`.
3. If it does not, read its log with `docker compose logs scheduler`.

To see the list of tasks and their next run, run:

```bash
docker compose exec scheduler php artisan schedule:list
```

## Related pages

- [Queues and Horizon](queues-and-horizon.md): most tasks put jobs on a queue. Horizon must run too.
- [System mail](system-mail.md): the emails that the alert tasks send.
- [Optional integrations](optional-integrations.md): MaxMind and Cloudflare for SaaS.
