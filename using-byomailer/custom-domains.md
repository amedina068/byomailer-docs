---
title: Custom domains
description: Serve the tracking links and the unsubscribe links of a sender identity from your own subdomains.
order: 12
---

# Custom domains

A sender identity can use two kinds of custom domains:

| Kind | What it changes | Infrastructure | DNS record |
|---|---|---|---|
| Custom tracking domain | The open pixel and the click links that SES adds. | A Caddy proxy with on-demand TLS. | A record |
| Custom link domain | The unsubscribe and preference links that BYOMailer adds. | Cloudflare for SaaS. | CNAME record |

Both are settings of one sender identity. Set them on the identity page. See [Sender identities](sender-identities.md).

Use a subdomain for each one, for example `t.example.com` and `links.example.com`. Do not use the root domain. A record on the root domain changes all the other services of that domain.

## Custom tracking domain

When open or click tracking is on, SES puts its own tracking domain in the links of each email. A custom tracking domain puts your subdomain in these links.

### What the instance needs

The owner of the instance must run a proxy for the tracking domains and set these environment variables:

| Variable | Meaning |
|---|---|
| `TRACKING_PROXY_IP` | The public IP address of the proxy. Each tracking domain points an A record at it. |
| `TRACKING_PROXY_ASK_TOKEN` | The token that the proxy sends to BYOMailer before it gets a TLS certificate. |

The identity page shows the **Custom tracking domain** section only when `TRACKING_PROXY_IP` is set. The identity must also have a configuration set.

The proxy must do these things:

- Get a TLS certificate on demand for each tracking domain. Before it gets a certificate, it asks BYOMailer with `GET /tls/ask?domain=<host>&token=<TRACKING_PROXY_ASK_TOKEN>` on the main host of the instance.
- Answer `GET /healthz` itself with a status 200. It must not send this path to SES.
- Send all other requests to the SES tracking service.

BYOMailer answers `/tls/ask` with 200 in two cases:

- The domain is a verified tracking domain.
- A check of the domain started in the last 10 minutes.

In all other cases, it answers 404. A wrong token also gets 404. The endpoint accepts 20 requests each minute for each domain.

The app repository has a Caddyfile for this proxy: [`deploy/tracking-proxy/Caddyfile`](https://github.com/amedina068/byomailer/blob/main/deploy/tracking-proxy/Caddyfile). It uses the ask URL with the token, answers `/healthz` itself, and sends all other requests to `r.us-east-1.awstrack.me`. Replace `us-east-1` with the AWS region of SES. [Optional integrations](../self-hosting/optional-integrations.md#the-upstream) gives the steps.

### Set up a tracking domain

1. Open the identity page.
2. In **Custom tracking domain**, turn on **Use a custom tracking domain**.
3. Enter the subdomain, for example `t.example.com`.
4. Click **Save tracking domain**. BYOMailer shows the A record.
5. At your DNS provider, add the A record. The name is the subdomain. The value is the IP address that BYOMailer shows.
6. If your DNS provider is Cloudflare, set the record to "DNS only". The Cloudflare proxy stops the TLS certificate of the tracking proxy.
7. Click **Check status**.

A tracking domain can belong to only one account. If another account uses it, BYOMailer shows: `This tracking domain is already in use by another account.`

### The check

When you click **Check status**, BYOMailer does these steps:

1. It makes sure that the A record of the subdomain points to `TRACKING_PROXY_IP`.
2. It allows the domain on `/tls/ask` for 10 minutes.
3. It calls `https://<subdomain>/healthz`. This call makes the proxy get the certificate.
4. It sets the subdomain as the custom redirect domain of the configuration set in SES, with the HTTPS policy `REQUIRE`.
5. It marks the domain as verified.

If the A record is not correct yet, the page shows "DNS record not yet detected". If the HTTPS call fails, BYOMailer shows an error. Try again after one minute.

BYOMailer keeps the result of a check for 5 minutes. A second click in this time shows the same result.

The scheduler also runs `email-identities:check-tracking-domain-dns` every 30 minutes. The command puts one check job on the `tracking-domains` queue for each tracking domain that is not verified.

### Change or remove a tracking domain

- To change the domain, save a new subdomain. BYOMailer removes the old domain from SES and starts a new verification.
- To remove the domain, click **Remove tracking domain**. BYOMailer removes the custom redirect domain from SES. SES then uses its own tracking domain again.

## Custom link domain

BYOMailer adds an unsubscribe link and a preference center link to each email. By default, these links use the host of `APP_URL`. A custom link domain puts your subdomain in these links.

A custom link domain keeps the links of each sender on its own domain. Thus the reputation of one sender does not depend on the main host of the instance.

### What the instance needs

The owner of the instance must have a Cloudflare zone with Cloudflare for SaaS, and must set these environment variables:

| Variable | Meaning |
|---|---|
| `CLOUDFLARE_API_TOKEN` | The API token that BYOMailer uses to add and remove custom host names. |
| `CLOUDFLARE_ZONE_ID` | The Cloudflare zone that holds the custom host names. |
| `CLOUDFLARE_CNAME_TARGET` | The host name that each link domain points its CNAME record at, for example `link.example.com`. |
| `CLOUDFLARE_ORIGIN_SERVER` | The origin server of each custom host name. The default is `CLOUDFLARE_CNAME_TARGET`. |
| `CLOUDFLARE_ORIGIN_SNI` | The SNI that Cloudflare sends to the origin. The default is `CLOUDFLARE_CNAME_TARGET`. |

The origin certificate must cover the origin SNI name. If it does not, Cloudflare returns the error 526.

The identity page shows the **Custom link domain** section only when `CLOUDFLARE_CNAME_TARGET` is set. If `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_ZONE_ID` is empty, BYOMailer shows: `Custom link domains are not available.`

The API token needs the permission **Zone > SSL and Certificates > Edit** on this zone, and no other permission. The fallback origin of the zone is a proxied DNS record with the name of `CLOUDFLARE_CNAME_TARGET`, which points to the instance. [Optional integrations](../self-hosting/optional-integrations.md#set-up-cloudflare-for-saas) gives the steps.

### Set up a link domain

1. Open the identity page.
2. In **Custom link domain**, turn on **Use a custom link domain**.
3. Enter the subdomain, for example `links.example.com`.
4. Click **Save link domain**. BYOMailer adds the subdomain to Cloudflare as a custom host name, with HTTP validation of a DV certificate. Then it shows the CNAME record.
5. At your DNS provider, add the CNAME record. The name is the subdomain. The value is the host name that BYOMailer shows.
6. Wait a few minutes. Cloudflare checks the CNAME record and issues the TLS certificate.
7. Click **Check status**.

If Cloudflare refuses the host name, BYOMailer changes nothing. The old link domain, if any, stays active.

### The check

When you click **Check status**, BYOMailer does these steps:

1. It reads the custom host name from Cloudflare. The host name status and the certificate status must both be `active`.
2. It sends `GET https://<subdomain>/up` through the link domain. The answer must be a status 2xx from BYOMailer.
3. It marks the domain as verified.

If the certificate is not ready, the page shows "Not yet active. Cloudflare is still issuing the TLS certificate". BYOMailer keeps a "not ready" result for 30 seconds and a "verified" result for 5 minutes.

If the request through the link domain fails, the domain stays not verified, and the page shows the reason. For example: `https://links.example.com/up redirects to https://byomailer.example/up. The web server does not send this host to the app.` BYOMailer keeps this result for 30 seconds. The owner of the instance must correct the web server. See [Troubleshooting](../self-hosting/troubleshooting.md#a-custom-domain-check-fails).

The request does not follow redirects. It stops after 10 seconds. BYOMailer does not send it when the subdomain resolves to a private IP address.

The scheduler also runs `email-identities:check-link-domain` every 30 minutes. It checks each link domain that is not verified.

### The hourly probe

A verified link domain can stop working later, for example after a change to the web server. Each hour, `email-identities:probe-link-domains` sends the same request through each verified link domain.

If a domain does not reach BYOMailer, the command reports an error to the log of the instance, and to Rollbar when it is on. The domain stays verified. If BYOMailer removes the verification, the emails use the host of `APP_URL` for the links again. Thus BYOMailer does not remove it.

The page of the identity does not show the result of the hourly probe. The owner of the instance gets the alert.

### What a verified link domain does

When the link domain is verified, the emails of the identity use it for these links:

- `{{ unsubscribe_url }}`.
- The one-click unsubscribe link in the `List-Unsubscribe` header.
- `{{ preferences_url }}`.

The opt-in link of a list uses the host of `APP_URL`.

The link domain serves only these paths: `unsubscribe/*`, `one-click-unsubscribe/*`, `resubscribe/*`, `preferences/*`, `opt-in/*`, `build/*` and `up`. All other paths return 404. BYOMailer answers `up` on each host, also before the link domain is verified. The dashboard, the API and the login stay on the host of `APP_URL`.

A request to a host that is not the host of `APP_URL` and not a verified link domain gets 404.

### Change or remove a link domain

- To change the domain, save a new subdomain. BYOMailer adds the new host name to Cloudflare first. Then it removes the old host name.
- To remove the domain, click **Remove link domain**. BYOMailer removes the host name from Cloudflare.
- If you remove the identity, BYOMailer also removes its host name from Cloudflare.

### Pin the origin of old host names

If you set `CLOUDFLARE_ORIGIN_SNI` after you added link domains, run this command. It sets the origin server and the SNI on each custom host name that exists:

```bash
php artisan email-identities:sync-hostname-origins
```

If `CLOUDFLARE_ORIGIN_SNI` is empty, the command stops with `No origin SNI configured. Set CLOUDFLARE_ORIGIN_SNI first.`

## Commands

| Command | Schedule | What it does |
|---|---|---|
| `email-identities:check-tracking-domain-dns` | Every 30 minutes | Puts a check job on the queue for each tracking domain that is not verified. |
| `email-identities:check-link-domain` | Every 30 minutes | Checks each link domain that is not verified. |
| `email-identities:probe-link-domains` | Each hour | Sends a request through each verified link domain, and reports each domain that does not reach BYOMailer. |
| `email-identities:sync-hostname-origins` | Manual | Pins the origin server and the SNI of each Cloudflare custom host name. |

For the scheduler, see [Scheduler](../self-hosting/scheduler.md). For the other environment variables, see [Optional integrations](../self-hosting/optional-integrations.md).
