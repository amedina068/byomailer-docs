---
title: Introduction
description: What BYOMailer is, what it does, and how it sends email through the Amazon SES account of each account.
order: 1
---

# Introduction

BYOMailer is an email marketing app that you host on your own server. It does not send email itself. Each account connects its own Amazon SES account in AWS, and BYOMailer sends through it.

The account keeps its contacts, its sending reputation, and its AWS bill. BYOMailer adds the lists, the editor, the campaigns, and the tracking.

BYOMailer is a Laravel 13 app with an Inertia and Vue 3 dashboard. It runs in one Docker container with one `/data` volume and a SQLite database. You need no `.env` file, no database server, and no Redis. The server needs 1 GB of memory or more.

The install takes about 1 minute, up to the login page. The connection to Amazon SES is a separate step after the first login.

Docker Compose with MySQL and Redis, and an install without Docker, are also available. Read [Install with Docker](installation-docker.md) and [Install without Docker](installation-manual.md).

## Main features

| Feature | What it does |
|---|---|
| Newsletters | Write in a block editor. Select the audience with filters or saved segments. Send now or schedule. Do A/B tests on the subject and the content. |
| Sequences | Send a series of emails to each contact, with a delay between the steps. Each step can have its own audience filters. |
| Automations | Start actions when a contact joins a list, gets a tag, finishes a sequence, or has an attribute change. A visual builder is also available. |
| Contacts | Lists, topics, tags, and custom attributes. Import and export CSV files. Each contact has a preference center and a one-click unsubscribe link (RFC 8058). |
| Templates and blocks | Reusable email templates and content blocks with `{{ variable }}` placeholders. |
| Deliverability | BYOMailer records the deliveries, bounces, complaints, opens, and clicks that SES reports. It suppresses addresses that bounced or complained. A reputation page shows the rates that AWS monitors. |
| Custom domains | Optional custom tracking domains and custom link domains for each sender identity. |
| Teams | Invite users with the `admin`, `editor`, or `viewer` role. Two-factor authentication is available. |
| API, webhooks, and MCP | A REST API at `/api/v1` with an OpenAPI document, outgoing webhooks, and an MCP server at `/mcp` for AI agents. |
| Compliance warnings | BYOMailer shows a warning when an email has no unsubscribe link or the account has no postal address. The warning does not block the send. |

## How it works

BYOMailer uses two kinds of AWS access:

- **The AWS account of each account.** A user enters an AWS access key in the dashboard. BYOMailer uses this key to verify domains, create SES configuration sets, and send email through SES.
- **One SQS queue for the instance.** The owner of the instance creates one SQS queue. All SES events of all accounts come back through this queue.

When a user connects AWS, BYOMailer does these steps in the AWS account of that user:

1. It makes sure that the key works, with `sts:GetCallerIdentity` and test calls to SES.
2. It creates an SNS topic with a name that starts with `mailautomation-`.
3. It subscribes the topic to the SQS queue of the instance (`SES_EVENTS_SQS_QUEUE_ARN`).
4. It creates an SES tenant with the name `byomailer`.

When a user adds a sender identity, BYOMailer registers the domain in SES. It also creates an SES configuration set for the identity. The configuration set sends the events of the identity to the SNS topic.

This is the path of an SES event:

```text
SES  ->  SNS topic (in the AWS account of the account)
     ->  SQS queue (one queue for the instance)
     ->  ses-events:poll worker
     ->  ses-events queue (the queue worker)
     ->  contacts, statistics, suppression
```

The configuration set always sends the SES event types for send, delivery, bounce, complaint, reject, and rendering failure. It also sends the open and click events when open and click tracking are on for the identity.

If the `ses-events:poll` worker does not run, BYOMailer does not see bounces and complaints. It then continues to send to addresses that SES rejects. [SES events](../self-hosting/ses-events.md) tells you how to set up the queue.

## The parts of the stack

The container runs these processes. s6-overlay starts them and starts them again if they stop.

| Process | Command | Purpose |
|---|---|---|
| Web server | PHP-FPM and NGINX | The dashboard, the API, the MCP server, and the unsubscribe and preference pages. The container runs the database migrations each time it starts. |
| Queue worker | `php artisan queue:work`, or `php artisan horizon` when `QUEUE_CONNECTION=redis` | Sends the newsletter batches and processes the SES events, the automations, and the webhooks. |
| Scheduler | `php artisan schedule:work` | The Laravel scheduler. Each minute, it starts the scheduled newsletters and the due sequence steps. |
| SES events poller | `php artisan ses-events:poll` | Reads the SES events from the SQS queue. It runs only when the SQS settings are set. |
| Caddy | `caddy run` | Gets a TLS certificate and serves HTTPS. It runs only when `APP_DOMAIN` is set. |

The `/data` volume holds the SQLite database, the app key, the uploads, and the TLS certificates. The default queue, cache, and sessions do not need Redis.

With the `mysql` profile of `docker-compose.yml`, MySQL 8.4 holds the data, and Redis 7.4 holds the queues, the cache, and the sessions. Then Horizon runs the queue workers.

The app uses these main components:

| Component | Use |
|---|---|
| PHP 8.4 and Laravel 13 | The application. |
| Inertia 3, Vue 3, Tailwind CSS 4, and Vite 7 | The dashboard. |
| Laravel Fortify | Login, registration, password reset, and two-factor authentication. |
| Laravel Sanctum | API tokens for the REST API and the MCP server. |
| Laravel Horizon | The queue workers and the queue dashboard at `/horizon`, only when the queue is Redis. |
| Laravel MCP | The MCP server at `/mcp`. |
| Scramble | The OpenAPI document at `/docs/api`. |
| AWS SDK for PHP | The calls to SES, SNS, SQS, and STS. |

## Next steps

1. Install BYOMailer: [Install with Docker](installation-docker.md) or [Install without Docker](installation-manual.md).
2. Read the environment variables in [Configuration](configuration.md).
3. Connect an AWS account: [Connect AWS SES](connect-aws-ses.md).
4. Send a first email: [Send your first newsletter](first-newsletter.md).
5. Keep the instance current: [Upgrade BYOMailer](upgrading.md).
