---
title: Optional integrations
description: The environment variables, the on switch and the effect of each optional integration.
order: 10
---

# Optional integrations

Each integration on this page is off by default. While its environment variables are empty, BYOMailer makes no network call for it. After you change a variable, recreate the containers with `docker compose up -d`.

| Integration | Turned on by |
|---|---|
| [MaxMind GeoIP](#maxmind-geoip) | `MAXMIND_LICENSE_KEY` |
| [Rollbar](#rollbar) | `ROLLBAR_TOKEN` and `rollbar` in `LOG_STACK` |
| [Custom link domains](#custom-link-domains-cloudflare-for-saas) | `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` |
| [Custom tracking domains](#custom-tracking-domains-tracking-proxy) | `TRACKING_PROXY_IP` and `TRACKING_PROXY_ASK_TOKEN` |
| [BYOMailer API sign-up list](#byomailer-api-sign-up-list) | `BYOMAILER_API_URL`, `BYOMAILER_API_TOKEN` and `BYOMAILER_LIST_ID` |
| [Open Graph images](#open-graph-images-snapsbrew) | `SNAPSBREW_SIGNED_URL_KEY` and `SNAPSBREW_OG_TEMPLATE_ID` |
| [Slack](#slack) | See the section. |
| [Outgoing webhook limits](#outgoing-webhook-limits) | Always on. The variables change the limits. |

## MaxMind GeoIP

BYOMailer finds the city and the country of each open and click from the IP address. It uses the MaxMind GeoLite2-City database. The database is not in the repository, because its license does not allow redistribution.

| Variable | Purpose |
|---|---|
| `MAXMIND_LICENSE_KEY` | Your MaxMind license key. Get a free key at <https://www.maxmind.com>. |
| `MAXMIND_DATABASE_PATH` | The path of the database file. The default is `storage/app/geoip/GeoLite2-City.mmdb`, which is in the `storage` volume. |

The scheduler runs `geoip:download` on Monday and Thursday at 03:00 UTC, only when `MAXMIND_LICENSE_KEY` is set. The command downloads the archive, extracts `GeoLite2-City.mmdb` and moves it to `MAXMIND_DATABASE_PATH`.

To download the database at once, run:

```bash
docker compose exec web php artisan geoip:download
```

If the key is empty, the command stops with `MAXMIND_LICENSE_KEY is not set.` While the database file is missing, BYOMailer records no location. It also skips private IP addresses.

## Rollbar

| Variable | Purpose |
|---|---|
| `ROLLBAR_TOKEN` | The access token of your Rollbar project. |
| `LOG_STACK` | Add `rollbar` to the list, for example `single,rollbar`. |

The `rollbar` log channel sends the log entries to Rollbar. The `stack` channel uses it only when `LOG_STACK` contains `rollbar`.

`docker-compose.yml` sets `LOG_CHANNEL=stderr` for each app service. The `stack` channel, and so `LOG_STACK`, is then not in use.

TODO(owner): How does a Docker instance turn on Rollbar, when `docker-compose.yml` sets `LOG_CHANNEL=stderr`?

## Custom link domains (Cloudflare for SaaS)

A custom link domain moves the unsubscribe, preferences, resubscribe and opt-in links of a sender identity to a host of the sender, for example `links.example.com`. Cloudflare for SaaS issues and renews the TLS certificate for each of these hosts.

| Variable | Purpose |
|---|---|
| `CLOUDFLARE_API_TOKEN` | A Cloudflare API token that can manage the custom hostnames of the zone. |
| `CLOUDFLARE_ZONE_ID` | The ID of the Cloudflare zone that has Cloudflare for SaaS. |
| `CLOUDFLARE_CNAME_TARGET` | The host that each custom link domain points to with a CNAME record, for example `link.example.com`. BYOMailer shows it to the user. |
| `CLOUDFLARE_ORIGIN_SERVER` | The origin server of each custom hostname. The default is `CLOUDFLARE_CNAME_TARGET`. |
| `CLOUDFLARE_ORIGIN_SNI` | The SNI that Cloudflare sends to the origin. The default is `CLOUDFLARE_CNAME_TARGET`. |

The feature is on when `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` are set. `.env.example` also lists `CLOUDFLARE_CNAME_TARGET` as necessary. If the token or the zone ID is empty, the settings of a sender identity answer `Custom link domains are not available.`

How it works:

1. A user saves a custom link domain on a sender identity.
2. BYOMailer registers the host as a custom hostname in the zone, with HTTP domain validation. It sends `CLOUDFLARE_ORIGIN_SERVER` and `CLOUDFLARE_ORIGIN_SNI` when they are set.
3. The user adds a CNAME record from the host to `CLOUDFLARE_CNAME_TARGET`.
4. Every 30 minutes, `email-identities:check-link-domain` reads the custom hostname from Cloudflare.
5. When the hostname status and the certificate status are both `active`, BYOMailer marks the link domain as verified.
6. From then on, the emails of that identity use `https://<link domain>/...` for the contact links.

On a verified link domain, BYOMailer serves only the contact link routes. See [Reverse proxy and TLS](reverse-proxy-and-tls.md#the-host-rule).

CAUTION: Make sure that the origin certificate covers the name in `CLOUDFLARE_ORIGIN_SNI`. If it does not, Cloudflare answers with error 526.

To pin the custom hostnames that exist already to the origin server and SNI, run:

```bash
docker compose exec web php artisan email-identities:sync-hostname-origins
```

The command needs `CLOUDFLARE_ORIGIN_SNI`. Without it, the command stops with `No origin SNI configured. Set CLOUDFLARE_ORIGIN_SNI first.`

`bootstrap/app.php` trusts the forwarded headers of the Cloudflare edge ranges. With Cloudflare in front of the instance, BYOMailer sees the real IP of each visitor.

TODO(owner): Which permissions does `CLOUDFLARE_API_TOKEN` need, and how do you set up the fallback origin of Cloudflare for SaaS for an instance?

For the steps of a user, see [Custom domains](../using-byomailer/custom-domains.md).

## Custom tracking domains (tracking proxy)

By default, SES rewrites the links of open and click tracking to its shared `awstrack.me` domain. A custom tracking domain uses a host of the sender instead, for example `track.example.com`. A Caddy proxy with on-demand TLS serves these hosts.

| Variable | Purpose |
|---|---|
| `TRACKING_PROXY_IP` | The public IP address of the proxy. Each tracking domain points to it with an A record. BYOMailer shows it to the user. |
| `TRACKING_PROXY_ASK_TOKEN` | A secret. Caddy sends it to `/tls/ask` before it issues a certificate. |

How it works:

1. A user saves a custom tracking domain on a sender identity.
2. The user adds an A record from the host to `TRACKING_PROXY_IP`.
3. Every 30 minutes, `email-identities:check-tracking-domain-dns` queues a `VerifyTrackingDomainJob` on the `tracking-domains` queue. The user can also start the check in the dashboard.
4. The job makes sure that an A record of the host is `TRACKING_PROXY_IP`.
5. The job allows the host on `/tls/ask` for 600 seconds. Then it sends `GET https://<host>/healthz`, with a timeout of 35 seconds and no redirects. Caddy issues the certificate during this request.
6. If the answer is 2xx, BYOMailer sets the host as the custom redirect domain of the SES configuration set, with `HttpsPolicy` `REQUIRE`.
7. BYOMailer marks the tracking domain as verified.

If `TRACKING_PROXY_IP` is empty, the check fails with `Tracking proxy IP not configured.`

### The `/tls/ask` endpoint

Caddy calls `GET /tls/ask?domain=<host>&token=<token>` before it issues a certificate. BYOMailer answers:

- 200 when the token is `TRACKING_PROXY_ASK_TOKEN` and the host is a verified tracking domain.
- 200 when the token is correct and a check allowed the host in the last 600 seconds.
- 404 in all other cases, also when `TRACKING_PROXY_ASK_TOKEN` is empty.

The endpoint allows 20 requests each minute for each host. Call it on the host of `APP_URL`. The host rule does not allow it on a custom link domain.

### Proxy configuration

The code sets these rules for the proxy:

- The proxy must answer `/healthz` itself, with a 2xx status. It must not forward this path. Otherwise, a 2xx from the upstream can confirm a certificate that does not exist.
- The proxy must use the ask URL with the token before it issues a certificate.

The parts of a Caddyfile that come from these rules:

```caddyfile
{
	on_demand_tls {
		ask https://byomailer.example/tls/ask?token=<your-token>
	}
}

https:// {
	tls {
		on_demand
	}

	respond /healthz 200
}
```

Caddy adds the `domain` query parameter to the ask URL.

TODO(owner): The repository has no configuration for the tracking proxy. To which upstream does the proxy forward the tracking requests, and with which `Host` header?

## BYOMailer API (sign-up list)

BYOMailer can add each user that signs up at `/register` to a list on another BYOMailer server.

| Variable | Purpose |
|---|---|
| `BYOMAILER_API_URL` | The API base URL of the other server, with `/api` and without `/v1`, for example `https://byomailer.example/api`. |
| `BYOMAILER_API_TOKEN` | An API token of the other server. BYOMailer sends it as a bearer token. |
| `BYOMAILER_LIST_ID` | The ID of the list on the other server. |

The feature is on when the three values are set. After each sign-up at `/register`, BYOMailer queues a job that sends `POST <BYOMAILER_API_URL>/v1/lists/<BYOMAILER_LIST_ID>/contacts`. The body has the email and the name of the user, and the tag `free`.

The owner from `/setup` and invited team members do not go to the list. Only sign-ups in the open registration mode do. See [Accounts and registration](accounts-and-registration.md).

## Open Graph images (Snapsbrew)

BYOMailer can add an Open Graph image to the in-app documentation pages: the documentation index, the release notes, the guides and the API reference. An external Snapsbrew service renders the image from a template.

| Variable | Purpose |
|---|---|
| `SNAPSBREW_BASE_URL` | The base URL of the service. The default is `https://app.snapsbrew.com`. |
| `SNAPSBREW_SIGNED_URL_KEY` | The key that signs the image URL (HMAC-SHA256). |
| `SNAPSBREW_OG_TEMPLATE_ID` | The ID of the template. BYOMailer sets its `eyebrow` and `headline` text layers. |

The feature is on when `SNAPSBREW_SIGNED_URL_KEY` and `SNAPSBREW_OG_TEMPLATE_ID` are set. BYOMailer calls nothing itself. It puts the signed image URL in the page, and the visitor or the link preview loads the image.

## Slack

`.env.example` lists these variables, and `config/services.php` reads them:

| Variable | Config key |
|---|---|
| `SLACK_BOT_USER_OAUTH_TOKEN` | `services.slack.notifications.bot_user_oauth_token` |
| `SLACK_BOT_USER_DEFAULT_CHANNEL` | `services.slack.notifications.channel` |

No code in `app/` sends a Slack message.

TODO(owner): Which feature uses `SLACK_BOT_USER_OAUTH_TOKEN` and `SLACK_BOT_USER_DEFAULT_CHANNEL`, or can they go out of `.env.example`?

## Outgoing webhook limits

Outgoing webhooks are always on. These variables in `config/webhooks.php` change their limits.

| Variable | Default | Effect |
|---|---|---|
| `WEBHOOKS_MAX_PER_CLIENT` | `25` | The maximum number of webhook endpoints of one account. More endpoints get the error `You have reached the maximum number of webhook endpoints.` |
| `WEBHOOKS_DISABLE_AFTER_FAILURES` | `15` | After this number of failed deliveries in a row, BYOMailer turns off the endpoint with the reason `auto_failures`. |
| `WEBHOOKS_TIMEOUT_SECONDS` | `10` | The HTTP timeout of one delivery. |
| `WEBHOOKS_RESPONSE_BODY_CAP_BYTES` | `2048` | The number of bytes of the response body that BYOMailer stores. |
| `WEBHOOKS_DELIVERY_RATE_PER_MINUTE` | `60` | The maximum deliveries each minute for one account. A delivery over the limit fails with `rate_limited` and BYOMailer does not try it again. |
| `WEBHOOKS_DELIVERY_RETENTION_DAYS` | `30` | The scheduler removes delivery rows older than this number of days. |

CAUTION: Keep `WEBHOOKS_TIMEOUT_SECONDS` less than 30. The `DeliverWebhookJob` process has a timeout of 30 seconds. If the HTTP timeout is longer, the worker can stop before the job records the failure, and the delivery stays `pending`.

A delivery gets 5 tries in total. The waits between the tries are 60, 300, 900 and 3600 seconds. Before each delivery, BYOMailer checks the endpoint URL with the same rules as the storage endpoint: public https only. See [Storage](storage.md#the-endpoint-must-be-a-public-https-url) and [Webhooks](../using-byomailer/webhooks.md).
