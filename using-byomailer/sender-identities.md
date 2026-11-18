---
title: Sender identities
description: Add a sending domain and a from address, publish the DNS records, and set open and click tracking.
order: 11
---

# Sender identities

A sender identity is a from address that BYOMailer can send from, for example `news@example.com`. Each identity has a domain identity in your Amazon SES account, DNS records and an SES configuration set.

You select a sender identity in each newsletter and in each sequence step.

## Before you start

Your account must have AWS credentials. If it has none, BYOMailer opens the email credentials page with this message: `Add AWS credentials before creating an identity.` See [Connect AWS SES](../getting-started/connect-aws-ses.md).

You also need access to the DNS of your domain.

## Add a sender identity

1. Open **Settings**, **Identities** and click **Add Identity**.
2. **Select domain**: do one of these actions:
   - Enter a new domain. BYOMailer registers it in SES for you.
   - Select a domain identity that already exists in your SES account.
3. **Tracking**: turn on or turn off **Track opens** and **Track clicks**. Both are on by default. See [Open and click tracking](#open-and-click-tracking).
4. **Sender**: enter the local part of the from address, for example `news`. Optional: enter a display name.
5. **Sender**: optional: change the MAIL FROM subdomain. The default is `mas.<your domain>`.
6. **DNS records**: publish the records that BYOMailer shows. See [DNS records](#dns-records).

You cannot add the same from address two times. The MAIL FROM subdomain must be a subdomain of your domain.

If you select an identity that already has a MAIL FROM domain in SES, BYOMailer keeps that MAIL FROM domain. It does not change it.

## What BYOMailer does in SES

When you add an identity, BYOMailer does these steps with your AWS credentials:

1. It makes the domain identity in SES, with Easy DKIM. If you selected an existing identity, it reads that identity.
2. It sets the MAIL FROM domain of the identity.
3. It makes a configuration set for the identity. The name is `mailautomation-identity-<id>-<random id>`.
4. It adds the event destination `sns-webhook` to the configuration set. The destination sends the SES events to the SNS topic of your account.
5. If your AWS credentials have an SES tenant, it adds the identity to the tenant.
6. It saves the DNS records that you must publish.

The region of the identity is the region of your AWS credentials.

## DNS records

Publish these records at your DNS provider. `<domain>` is your domain, `<mail-from>` is the MAIL FROM subdomain and `<region>` is the region of your AWS credentials.

| Purpose | Type | Name | Value |
|---|---|---|---|
| DKIM (one record for each token) | CNAME | `<token>._domainkey.<domain>` | `<token>.<DKIM domain>` |
| MAIL FROM | MX | `<mail-from>` | `feedback-smtp.<region>.amazonses.com` (priority 10) |
| MAIL FROM (SPF) | TXT | `<mail-from>` | `v=spf1 include:amazonses.com ~all` |
| DMARC | TXT | `_dmarc.<domain>` | `v=DMARC1; p=none;` |

SES gives the DKIM tokens. Copy the exact names and values from the **DNS records** step or from the identity page.

The DKIM domain is the signing zone that SES returns. If SES returns no signing zone, BYOMailer uses the DKIM domain of the region. This is `dkim.amazonses.com` for most regions.

SES does not check DMARC. BYOMailer checks the `_dmarc` record itself. A policy of `p=none` counts as published. You can use a stronger policy, for example `p=quarantine`.

## Verification

An identity has one of these statuses:

| Status | Meaning |
|---|---|
| `pending` | BYOMailer made the identity. It did not check SES yet. |
| `verifying` | SES did not verify the identity for sending yet. |
| `verified` | SES verified the identity for sending. |

The identity page also shows the DKIM status and the MAIL FROM status that SES reports. It marks each DNS record as verified or not.

BYOMailer checks the status in these cases:

- You click the refresh button on the identity page.
- The scheduler runs `email-identities:refresh-dns-status` every 15 minutes.

The command checks the identities that are not verified. It also checks the DMARC record of a verified identity when the last check is older than one day. Thus BYOMailer finds a DMARC record that you publish or remove later.

The **DNS records** step says that AWS finds the records about 5 minutes after the DNS change propagates.

## Open and click tracking

| Setting | Label | What it does |
|---|---|---|
| `open_tracking_enabled` | Track opens | Adds a tracking pixel to every email. |
| `click_tracking_enabled` | Track clicks | Sends the links of the email through SES, so that BYOMailer can count the clicks. |

To change the tracking of an identity, open the identity page and use the **Tracking** section. BYOMailer changes the event types of the configuration set in SES:

- With **Track opens** off, the configuration set does not publish OPEN events.
- With **Track clicks** off, the configuration set does not publish CLICK events.

The events SEND, DELIVERY, BOUNCE, COMPLAINT, REJECT and RENDERING_FAILURE are always on.

Every hour, the command `ses:sync-configuration-sets` reads the event types of each configuration set from SES. It saves the tracking state that it finds. Thus a change in the SES console also shows in BYOMailer.

When BYOMailer makes an identity, it sets the event types of the configuration set from the **Track opens** and **Track clicks** choices of the wizard. The hourly sync then reads the same choices back from SES.

To serve the tracking links from your own domain, see [Custom domains](custom-domains.md).

## Configuration sets

Each identity has its own configuration set. BYOMailer puts the name of the configuration set in the `X-SES-CONFIGURATION-SET` header of each email. Thus SES sends the events of each email to BYOMailer, and the tracking settings of the identity apply.

Two commands help with installations that made their configuration sets before this design:

| Command | What it does |
|---|---|
| `ses:migrate-configuration-sets` | Moves the configuration set data from the email credentials to the identities. Options: `--user=<id>`, `--dry-run`. |
| `ses:backfill-tenants` | Makes the SES tenants for existing credentials and adds their identities. Option: `--dry-run`. |

## Reply-To

On the identity page, you can set a Reply-To address and a Reply-To name. BYOMailer adds them to each email from this identity. It reads them at send time, so a change applies to all emails that it did not send yet.

## Remove an identity

On the identity page, click the delete button and confirm. BYOMailer removes the identity from BYOMailer. It does not delete the identity in SES.

If the identity has a custom link domain, BYOMailer also removes that host name from Cloudflare.

CAUTION: Do not remove an identity that a scheduled newsletter or a live sequence step uses. BYOMailer reads the identity at send time.
