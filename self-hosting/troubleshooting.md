---
title: Troubleshooting
description: Find and correct the common problems of a self-hosted instance from the signals that BYOMailer gives.
order: 11
---

# Troubleshooting

Each section gives a symptom, the signal that BYOMailer shows, and the correction. Start with the logs.

## Read the logs

`docker-compose.yml` sets `LOG_CHANNEL=stderr`, so each app service writes its log to Docker.

| Command | Use |
|---|---|
| `docker compose ps` | Show each service and its health. |
| `docker compose logs web` | The web requests, the migrations at start and the setup URL. |
| `docker compose logs -f horizon` | The queued jobs: sending, SES events, automations, webhooks. |
| `docker compose logs -f scheduler` | The scheduled tasks. |
| `docker compose logs -f ses-events` | The SQS worker. |
| `docker compose logs mysql` | The database. |

The SQS worker also writes a daily file in its container:

```bash
docker compose exec ses-events sh -c 'tail -n 50 storage/logs/ses-events-*.log'
```

## Every page answers 404

**Signal.** Each URL answers 404, also `/login`.

**Cause.** `RestrictHostToLinkRoutes` compares the `Host` header of each request with the host of `APP_URL`. Another host answers 404, unless it is a verified custom link domain.

**Correction.**

1. Open the instance with the host of `APP_URL`, not with an IP address or `localhost`.
2. Make sure that the reverse proxy sends the original `Host` header.
3. If `APP_URL` is wrong, correct it in `.env`. Then run `docker compose up -d`.

See [Reverse proxy and TLS](reverse-proxy-and-tls.md).

## The first start takes a long time

**Signal.** `docker compose ps` shows `web` as `starting` for some minutes. The `horizon`, `scheduler` and `ses-events` services do not start.

**Cause.** At each start, the `web` service runs the migrations before NGINX starts. The first start runs all the migrations. The health check of `web` allows 600 seconds for this. The other app services wait until `web` is healthy.

**Correction.**

1. Read the progress with `docker compose logs -f web`.
2. Wait until `docker compose ps` shows `web` as `healthy`.
3. If a migration fails, read the error in the log. Make sure that the `mysql` service is healthy and that `DB_PASSWORD` is correct.

TODO(owner): The `web` health check calls `/up` inside the container. If the host of that request is not the host of `APP_URL`, `RestrictHostToLinkRoutes` answers 404. Does the health check pass when `APP_URL` is a public domain?

## The setup URL is gone

**Signal.** You did not keep the setup URL from the log, or the form shows `The setup token is not correct.`

**Correction.**

1. Run `docker compose exec web php artisan byomailer:setup-url`.
2. Open the URL that the command prints.

If the command shows `An account already exists. The setup page is closed.`, the instance has a user. `/setup` then answers 404. To get access, use [Recover access](recover-access.md).

The token comes from `APP_KEY`. If `APP_KEY` changed after the container started, the URL in the old log does not work. Run the command again.

## The AWS onboarding fails

**Signal.** The onboarding shows `SQS queue ARN is not configured. Set SES_EVENTS_SQS_QUEUE_ARN in your environment.`

**Correction.** Set `SES_EVENTS_SQS_QUEUE_ARN`, recreate the containers, and connect the AWS keys again. See [SES events](ses-events.md).

Other onboarding errors start with `Failed to create SNS topic:` or `Failed to subscribe SNS topic:`. They contain the AWS error. Make sure that the IAM user of the account has the policy from the onboarding screen.

## Bounces are not recorded

**Signal.** The emails stay `sent` and never become `delivered`, `bounced` or `opened`. Sequences stop after the first step. The statistics show no opens or clicks.

**Cause.** The SES events do not reach BYOMailer. A `DELIVERY` event schedules the next step of a sequence, so sequences stop too.

**Correction.**

1. Run `docker compose ps`. Make sure that `ses-events` and `horizon` run.
2. If `ses-events` is not in the list, start it with `docker compose --profile ses up -d`.
3. If the log of `ses-events` shows `SQS SES events configuration is incomplete.`, set the `PLATFORM_AWS_*` values and `SES_EVENTS_SQS_QUEUE_URL`.
4. If the log shows `SQS error:`, make sure that the worker keys have `sqs:ReceiveMessage` and `sqs:DeleteMessage` on the queue.
5. If the `horizon` log shows `refused a notification from a topic that no tenant owns`, the topic in the message does not belong to a connected account.
6. If the `horizon` log shows `refused a payload with no SNS envelope`, turn off raw message delivery on the SNS subscription.

WARNING: Correct this problem at once. Without the events, BYOMailer does not suppress addresses that bounced or complained. AWS can then pause the SES account.

## The SES account is paused

**Signal.** BYOMailer shows `Amazon SES has paused sending on your AWS account. Open the SES console to see why. Sending starts again after SES turns it back on.` **Settings > Email Credentials** shows **Sending Disabled**.

**Cause.** `EmailSendingGate` blocks every production send while SES reports that sending is off for the AWS account. The hourly `ses:fetch-quota` task reads this status from AWS.

While the account is paused:

- A newsletter does not start, and BYOMailer refuses to schedule a newsletter.
- BYOMailer refuses to start a sequence.
- A due sequence email fails with the reason `ses_sending_disabled`.

**Correction.**

1. Open the SES console of the AWS account. Read why AWS paused sending.
2. Correct the cause with AWS, for example the bounce rate or the complaint rate.
3. After AWS turns sending on again, open **Settings > Email Credentials** and click **Refresh** in the quota card. If you do nothing, the next hourly `ses:fetch-quota` reads the new status.

BYOMailer does not send again the sequence emails that failed.

## The account is in the SES sandbox

**Signal.** **Settings > Email Credentials** shows **Sandbox**. Emails to most recipients fail.

**Cause.** A new SES account starts in the sandbox. The in-app guide gives these limits: email only to verified addresses and domains, 200 emails in 24 hours, and 1 email each second.

BYOMailer reads the quota of each account. It sets the rate of the sending jobs of each user from the SES send rate.

**Correction.**

1. Request production access in the SES console. The in-app guide at `/documentation/guides/request-production-access` shows the steps.
2. After AWS approves the request, click **Refresh** in **Settings > Email Credentials**.

To read the status of one user from the command line, run:

```bash
docker compose exec web php artisan ses:fetch-quota --user=<user id>
```

The command prints `Production` or `Sandbox`, the sent count, the 24-hour limit and the send rate.

## A custom domain check fails

The scheduler checks the custom domains every 30 minutes. See [Scheduler](scheduler.md).

**Custom tracking domains.** These errors come from `TrackingDomainVerifier`:

| Error | Correction |
|---|---|
| `Tracking proxy IP not configured.` | Set `TRACKING_PROXY_IP`. |
| No error, and the domain stays not verified | The A record does not resolve to `TRACKING_PROXY_IP` yet. Make sure that the A record is correct. If the DNS is at Cloudflare, use "DNS only" for that record. |
| `Could not reach tracking domain over HTTPS. ...` | The proxy did not answer on `https://<host>/healthz`. Make sure that the proxy runs and can issue a certificate. |
| `Tracking domain HTTPS check failed (status ...)` | The proxy answered with a status that is not 2xx. Make sure that the proxy answers `/healthz` itself. |
| `No configuration set found.` | The sender identity has no SES configuration set. |

**Custom link domains.** `email-identities:check-link-domain` prints one line for each domain:

| Output | Correction |
|---|---|
| `Cloudflare certificate not yet active.` | Make sure that the CNAME record points to `CLOUDFLARE_CNAME_TARGET`. Wait for Cloudflare. |
| `No Cloudflare hostname registered.` | Save the link domain again on the sender identity. |
| A Cloudflare error | Make sure that `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` are correct. |

If a verified link domain answers error 526, the origin certificate does not cover `CLOUDFLARE_ORIGIN_SNI`. See [Optional integrations](optional-integrations.md#custom-link-domains-cloudflare-for-saas).

## No job runs

**Signal.** `horizon` runs, but no newsletter goes out and the Horizon dashboard shows no supervisor.

**Cause.** `config/horizon.php` has supervisors for the `production` and `local` environments only.

**Correction.** Set `APP_ENV` to `production`. See [Queues and Horizon](queues-and-horizon.md).

## Invitations and password reset emails do not arrive

**Signal.** A team admin sends an invitation, but the person gets no email.

**Cause.** `.env.example` sets `MAIL_MAILER=log`. With this mailer, BYOMailer writes the email to the log and sends nothing.

**Correction.** Configure the system mailer. See [System mail](system-mail.md). Until then, read the invitation link with `docker compose logs web`, or reset a password with [Recover access](recover-access.md).

## PHP 8.5 is not supported

**Signal.** Composer refuses to install the dependencies on PHP 8.5.

**Cause.** One dependency, `phpoffice/phpspreadsheet`, does not accept PHP 8.5 yet. Symfony 8 in `composer.lock` needs PHP 8.4.1 or later.

**Correction.** Use PHP 8.4. The Docker image uses `serversideup/php:8.4-fpm-nginx-v5.1.2`. For a manual install, see [Manual installation](../getting-started/installation-manual.md).
