---
title: Deliverability
description: How BYOMailer records the SES events, suppresses bad addresses, and watches the reputation and the quota of your SES account.
order: 13
---

# Deliverability

BYOMailer sends through your own Amazon SES account. SES watches the bounce rate and the complaint rate of your account. If the rates are too high, SES can put the account under review or pause it.

This page tells how BYOMailer records the result of each email. It also tells which addresses BYOMailer stops sending to, and what it shows about your SES account.

## The SES events

SES sends an event for each change in the state of an email. BYOMailer receives the events through SNS and processes them on the `ses-events` queue. For the setup, see [SES events](../self-hosting/ses-events.md).

| SES event | Email status | What else BYOMailer does |
|---|---|---|
| SEND | `sent` | For a sequence step, it sends the `sequence_step.sent` webhook event. |
| DELIVERY | `delivered` | It schedules the next step of a sequence. It sets the soft bounce count of the contact to 0. |
| OPEN | `opened` | It saves the location of the first open. See [GeoIP of opens](#geoip-of-opens). |
| CLICK | `opened` | It saves the time of the first click, and a row for each click with the link. It marks the contact as engaged. |
| BOUNCE | `bounced` | It handles a hard bounce or a soft bounce. See [Suppression](#suppression). |
| COMPLAINT | `complained` | It suppresses the address. |
| REJECT | `rejected` | No other action. |
| RENDERING_FAILURE | `failed` | It saves the error message of SES. |

BYOMailer ignores the DELIVERY_DELAY event.

SES can send the events out of order. BYOMailer never moves an email back to an earlier status. The order is `pending`, `sent`, `delivered`, `opened`. The statuses `bounced`, `complained`, `rejected`, `failed` and `unsubscribed` are final. A later progress event does not change them.

An OPEN or a CLICK event also fills the sent time and the delivered time, if they are empty.

BYOMailer accepts an event only from an SNS topic that belongs to an account of the instance. It changes only the emails of that account.

### Engagement

Only a click counts as engagement. An open does not count, because some mail clients open emails automatically. A click sets the last engagement time of the contact and removes the sunset mark of the contact. For the sunset policy, see [Contacts](contacts.md).

## Suppression

BYOMailer keeps a suppression list. It never sends a newsletter or a sequence step to an address on this list.

| Cause | What BYOMailer does |
|---|---|
| Hard bounce: a bounce with the type `Permanent`. | It unsubscribes the contact and adds the address to the suppression list with the reason `bounce`. |
| Complaint. | It unsubscribes the contact and adds the address with the reason `complaint`. |
| Soft bounce: a bounce with any other type, or with no type. | It adds 1 to the soft bounce count of the contact. |
| 3 soft bounces in a row. | It unsubscribes the contact and adds the address with the reason `soft_bounce`. |

A delivery sets the soft bounce count back to 0. Thus only soft bounces in a row count.

When BYOMailer unsubscribes a contact because of a bounce or a complaint, it does not send the `contact.unsubscribed` webhook event. The other results of an unsubscribe apply: BYOMailer deletes the pending emails and removes the contact from its sequences.

The suppression list applies in these places:

- A newsletter leaves out the suppressed addresses from its audience.
- A sequence email to a suppressed address fails with the reason `blacklisted`.
- The API and the MCP server do not make a new contact with a suppressed address.

The dashboard has no page that lists the suppression list or removes an address from it.

TODO(owner): How does an owner remove an address from the suppression list, for example after a mailbox problem is corrected?

## The reputation page

Open **Reputation** to see the state of your SES account and your rates.

### SES account

The **SES account** card shows the result of the last quota check:

| Status | Meaning |
|---|---|
| Not checked | The first quota check did not run yet. |
| Healthy | SES reports no problem with your AWS account. |
| Under review | SES has your account under review (`PROBATION`). Lower the bounce rate and the complaint rate before the review ends. |
| Paused | SES paused sending on your account (`SHUTDOWN`, or sending is not enabled). BYOMailer does not send until SES resumes it. |

The card also shows these values:

- The emails sent in the last 24 hours.
- The 24-hour quota.
- The max send rate each second.
- The time of the last check.

The **Open SES reputation** link opens the SES console.

### Bounce and complaint rates

The rates table counts the emails of your account that BYOMailer sent in the last 24 hours, 7 days and 30 days. For each period, it shows the sent emails, the bounced emails, the complained emails and the two rates.

The bounce rate is the bounced emails divided by the sent emails. The complaint rate is the complained emails divided by the sent emails.

BYOMailer marks each rate with a level:

| Rate | Review level | Pause level |
|---|---|---|
| Bounce rate | 5% | 10% |
| Complaint rate | 0.1% | 0.5% |

The code takes these levels as the points where SES starts a review and where SES can pause the account. If a rate of the last 24 hours reaches the review level, the page shows a warning.

BYOMailer measures these rates from its own data. SES can count different numbers. Gmail shows its own spam rate only in Google Postmaster Tools.

BYOMailer keeps the rates for 60 seconds before it counts them again.

## The SES quota and the account pause check

Every hour, the scheduler runs `ses:fetch-quota`. The command reads these values from SES for each account:

- Production access or sandbox.
- Whether sending is enabled.
- The enforcement status.
- The 24-hour quota, the max send rate, and the emails sent in the last 24 hours.

To run the check for one team member, use the `--user` option with the ID of the team member:

```bash
php artisan ses:fetch-quota --user=1
```

If SES reports that sending is not enabled, BYOMailer blocks all sends of the account:

- A newsletter cannot be scheduled or sent.
- A sequence or a step cannot go live.
- A due sequence email fails with the reason `ses_sending_disabled`.

The error is: `Amazon SES has paused sending on your AWS account. Open the SES console to see why. Sending starts again after SES turns it back on.` When SES enables sending again, the next quota check removes the block.

An account that BYOMailer never checked is not blocked.

The max send rate also limits the speed of the sends. Newsletter chunks and sequence emails use the same rate limit. BYOMailer does not send more email each second than the max send rate.

## The permission alert

BYOMailer needs these SES permissions:

| Permission | Used for |
|---|---|
| `ses:CreateEmailTemplate` | Newsletters |
| `ses:DeleteEmailTemplate` | Newsletters |
| `ses:SendBulkEmail` | Newsletters |
| `ses:SendEmail` | Sequences and test emails |

Every hour, `ses:sync-configuration-sets` checks the permissions of each AWS user with an IAM policy simulation. The command `ses:send-permission-alerts` also runs every hour. It sends an email to each team member whose AWS credentials miss a permission. The subject is `Action required: missing SES permissions`. The email lists the missing permissions.

BYOMailer does not send this alert every hour. It sends it at the first hour with a missing permission, at the sixth hour, and then every 12 hours. When all permissions are back, the count starts again.

For the IAM policy, see [Connect AWS SES](../getting-started/connect-aws-ses.md). For the daily digest of blocked sequence emails, see [Sequences](sequences.md).

BYOMailer sends the alert through the system mailer. See [System mail](../self-hosting/system-mail.md).

## The weekly summary email

The command `summary:send-weekly` sends a summary email to each team member of each account. The subject is `Weekly summary · <date>`. The email has these numbers for the last week:

- New subscribers.
- Unsubscribes.
- Active subscribers.
- Mails sent.

The command sends the email only on Friday at 17:00 in the time zone of the account. The option `--client=<id>` limits the command to one account.

The schedule of this command is turned off in `routes/console.php`. Thus BYOMailer does not send the weekly summary.

TODO(owner): The schedule of `summary:send-weekly` is commented out. Is the weekly summary a feature of this release?

## GeoIP of opens

BYOMailer can find the location of the first open of each email. It uses the free GeoLite2 City database of MaxMind.

1. Get a license key from MaxMind.
2. Set `MAXMIND_LICENSE_KEY` in the `.env` file.
3. Optional: set `MAXMIND_DATABASE_PATH`. The default is `storage/app/geoip/GeoLite2-City.mmdb`.
4. Run `php artisan geoip:download` one time to get the database.

When the key is set, the scheduler runs `geoip:download` on Monday and on Thursday at 03:00.

At the first OPEN event of an email, BYOMailer saves the IP address, the user agent, the time zone, the country and the city. It also saves the time zone and the country on the contact. The location filters use these values. See [Segments and filters](segments-and-filters.md).

BYOMailer does not look up private IP addresses. If the database is missing, BYOMailer saves the IP address and the user agent without a location.

## Email logs

**Email Logs** lists each call that BYOMailer made to the SES API. Each row has the operation, the recipient, the SES message ID and the status. The detail page shows the request, the response and the last SES event of the email. You can filter the list by status and by operation, and search by recipient or message ID.
