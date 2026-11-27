---
title: System mail
description: Configure the mailer for invitations, password resets and alerts, and learn which emails use it.
order: 5
---

# System mail

BYOMailer sends two kinds of email:

- **Campaign email.** Newsletters, sequence steps, opt-in emails and test emails. BYOMailer sends them through the AWS SES credentials of each account (`UserMailerFactory`). The `MAIL_*` environment variables have no effect on them.
- **System email.** Invitations, password resets and alerts to the users of the instance. BYOMailer sends them through the system mailer that the `MAIL_*` environment variables configure.

This page is about the system mailer.

## Environment variables

| Variable | Purpose |
|---|---|
| `MAIL_MAILER` | The mailer: for example `smtp`, `ses` or `log`. `.env.example` sets `log`. If the variable is missing, `config/mail.php` uses `ses`. |
| `MAIL_SCHEME` | The SMTP scheme, for example `smtps`. Leave `null` for the default. |
| `MAIL_HOST` | The SMTP host. |
| `MAIL_PORT` | The SMTP port. The default is `2525`. |
| `MAIL_USERNAME` | The SMTP user name. |
| `MAIL_PASSWORD` | The SMTP password. |
| `MAIL_FROM_ADDRESS` | The sender address of the system emails. |
| `MAIL_FROM_NAME` | The sender name of the system emails. `.env.example` uses `APP_NAME`. |

With `MAIL_MAILER=ses`, Laravel uses `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_DEFAULT_REGION`. These keys are for the instance itself. They are not the keys of an account.

Example for an SMTP server:

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=<your-smtp-user>
MAIL_PASSWORD=<your-smtp-password>
MAIL_FROM_ADDRESS="byomailer@example.com"
MAIL_FROM_NAME="BYOMailer"
```

To change a variable of the one-container image, remove the container with `docker rm -f byomailer`. Then run the same `docker run` command with the new value. The `/data` volume keeps the data. In the Compose stack, run `docker compose up -d`.

## The `log` mailer

With `MAIL_MAILER=log`, BYOMailer writes each system email to the log and sends nothing. In Docker, the log goes to the standard error of the container. To read an invitation link, run:

```bash
docker logs byomailer
```

In the Compose stack, run `docker compose logs web`.

The queued alert emails go to the log of the queue worker, that is, the log of the container.

If the instance has no working mailer, the "forgot password" form cannot help a user. Use the commands in [Recover access](recover-access.md).

## The emails that BYOMailer sends

| Email | Subject | When | Sent |
|---|---|---|---|
| Invitation (`UserInviteMail`) | "You have been invited to" and `APP_NAME` | A team admin invites a person in **Settings > Team**. | At once, in the web request |
| Password reset | The default Laravel subject | A user fills in the "forgot password" form. | At once, in the web request |
| SES permission alert (`SesPermissionAlertMail`) | "Action required: missing SES permissions" | The hourly `ses:send-permission-alerts` task finds missing SES permissions. | Queued |
| Sequence blocked digest (`SequenceBlockedDigestMail`) | "Daily digest: sequence emails blocked by missing permissions" | The daily `ses:send-sequence-blocked-digest` task finds sequence emails that failed for missing SES permissions. | Queued |
| Newsletter blocked (`NewsletterBlockedMail`) | "Newsletter failed: missing SES permissions" | A newsletter fails because SES permissions are missing. It goes to the author of the newsletter. | Queued |

The permission alert does not go out each hour. It goes out at the first check that finds missing permissions and at the sixth check. After that, it goes out at most one time in 12 hours. When the permissions are correct again, the count starts again from zero.

The queued emails use the `default` queue. Horizon must run to send them. See [Queues and Horizon](queues-and-horizon.md).

These emails exist in the code but BYOMailer does not send them:

- `WeeklySummaryMail`. Its schedule entry in `routes/console.php` is a comment.
- Email verification. The `User` model does not implement `MustVerifyEmail`, so BYOMailer does not ask users to verify their email.

## `MAIL_USE_SES_API`

`MAIL_USE_SES_API` is `true` by default. Then campaign email goes through the SES API with the credentials of each account.

CAUTION: Do not set `MAIL_USE_SES_API=false` on a production instance. With `false`, campaign email goes through the system mailer, not through the SES account of each account. `config/mail.php` describes this mode for local development.
