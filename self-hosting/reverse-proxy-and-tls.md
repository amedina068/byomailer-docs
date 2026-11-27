---
title: Reverse proxy and TLS
description: Use the automatic HTTPS of the image, or put your own reverse proxy with a TLS certificate in front of port 8080.
order: 1
---

# Reverse proxy and TLS

The one-container image includes Caddy. When you set `APP_DOMAIN`, Caddy gets a TLS certificate and serves HTTPS on the ports 80 and 443. You need no reverse proxy. Read [Install with Docker](../getting-started/installation-docker.md).

The rest of this page is for an install behind your own reverse proxy:

- The one-container image with `CADDY_ENABLED=false`.
- The Compose stack. `docker-compose.yml` sets `CADDY_ENABLED=false` by default.
- A manual install.

In these installs, the app serves plain HTTP on port 8080 in the container. Put a reverse proxy with a TLS certificate in front of it.

## Why HTTPS is necessary

BYOMailer puts links to the instance in each email. Without HTTPS, these links do not work correctly.

- `APP_URL` is the public URL of the instance. The queue workers have no request, so they use `APP_URL` to build the unsubscribe, preferences, resubscribe and opt-in links in each email.
- Each campaign email has a one-click `List-Unsubscribe` header (RFC 8058). Mailbox providers send a POST to that URL. RFC 8058 requires an HTTPS URL.
- The setup URL, the invitation links and the password reset links also use the URL of the instance.

Open and click tracking go through SES or through a custom tracking domain, not through this proxy. See [Optional integrations](optional-integrations.md#custom-tracking-domains-tracking-proxy).

## Set the public URL

1. Set `APP_URL` to the public HTTPS URL, for example `APP_URL=https://byomailer.example`. With the one-container image, give it with `-e` or `--env-file`. In the Compose stack, set it in `.env`.
2. Do not add a path to the URL. BYOMailer compares only the host of `APP_URL` with the host of each request.
3. Start the container again with the new value. In the Compose stack, run `docker compose up -d`.

The container caches the configuration each time that it starts. A changed value has no effect until the container starts again.

## The host rule

A global middleware, `RestrictHostToLinkRoutes`, runs before the routes. It reads the `Host` header of each request and does one of these:

| Host of the request | Result |
|---|---|
| The host of `APP_URL` | BYOMailer serves every route. |
| A verified custom link domain of a sender identity | BYOMailer serves only `unsubscribe/*`, `one-click-unsubscribe/*`, `resubscribe/*`, `preferences/*`, `opt-in/*`, `build/*` and `up`. Other paths answer 404. |
| Any other host | BYOMailer answers 404. |

As a result, the reverse proxy must send the original `Host` header to the `web` service. If you open the instance with an IP address or a different name, every page answers 404.

Custom link domains need Cloudflare for SaaS. See [Optional integrations](optional-integrations.md#custom-link-domains-cloudflare-for-saas).

## Trusted proxies

BYOMailer reads the forwarded headers (`X-Forwarded-For`, `X-Forwarded-Host`, `X-Forwarded-Port` and `X-Forwarded-Proto`) only from a trusted proxy. By default, it trusts the Cloudflare edge ranges in `config/trustedproxies.php`. The `TRUSTED_PROXIES` setting replaces this list.

If Cloudflare is in front of the instance, `$request->ip()` is the IP of the visitor. Per-IP rate limits then apply to each visitor.

If your reverse proxy is not Cloudflare and `TRUSTED_PROXIES` is empty, BYOMailer does not read the forwarded headers from it. The client IP is then the IP of the proxy. The request scheme is the scheme between the proxy and the `web` service, so signed links (preferences, invitations) fail the check.

To trust your own proxy:

1. Set `TRUSTED_PROXIES` in `.env` to the IP addresses or CIDR ranges of the proxy, comma-separated. For example: `TRUSTED_PROXIES=10.0.0.0/8`.
2. If the proxy runs on the same Docker host, use the address that the `web` container sees, for example `172.16.0.0/12`.
3. Make sure that the proxy sends `X-Forwarded-Proto: https`.
4. Restart the app services.

The value replaces the Cloudflare ranges. If Cloudflare is in front of your proxy, BYOMailer reads the client IP that your proxy forwards.

CAUTION: Do not set `TRUSTED_PROXIES=*` when the app port is open to the internet. A client can then set its own IP.

## Keep port 8080 private

`docker-compose.yml` maps the port as `${APP_BIND:-127.0.0.1}:${APP_PORT:-8080}:8080`. By default, the port is open on the loopback interface only. Then only a reverse proxy on the same server can reach the `web` service. Set `APP_BIND=0.0.0.0` only if the app must take traffic from other hosts with no proxy.

With `docker run`, publish the port on the loopback interface with `-p 127.0.0.1:8080:8080`.

## Upload size

The image upload of the email editor accepts files of 5 MB or less (`max:5120` in `GalleryImageUploadRequest` and `EditorImageUploadRequest`). The contact import accepts `csv`, `txt`, `xlsx` and `xls` files of 20 MB or less (`ImportContactsRequest::MAX_FILE_KILOBYTES`). In the Docker image, NGINX and PHP accept request bodies of 100 MB. Make sure that the reverse proxy accepts request bodies of at least 20 MB.

## Example: Caddy

Caddy gets and renews a TLS certificate for the site name. It keeps the original `Host` header when it forwards a request.

```caddyfile
byomailer.example {
	reverse_proxy 127.0.0.1:8080
}
```

- `byomailer.example` is the host of `APP_URL`.
- `127.0.0.1:8080` is the host port of the `web` service (`APP_PORT`).

## Example: NGINX

```nginx
server {
    listen 443 ssl;
    server_name byomailer.example;

    ssl_certificate     /etc/ssl/byomailer.example/fullchain.pem;
    ssl_certificate_key /etc/ssl/byomailer.example/privkey.pem;

    # The editor accepts images of 5 MB. The NGINX default is 1 MB.
    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        # Required. RestrictHostToLinkRoutes compares this host with APP_URL.
        proxy_set_header Host $host;
        # BYOMailer reads these two headers only from trusted proxies.
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name byomailer.example;
    return 301 https://$host$request_uri;
}
```

- `server_name` is the host of `APP_URL`.
- `proxy_pass` points to the host port of the `web` service (`APP_PORT`).
- `proxy_set_header Host $host` is necessary because of the host rule.
- Get the certificate files from your certificate authority, for example with an ACME client.

## Move the instance to a new host

Signed links in emails that BYOMailer already sent contain the old host. To keep these links working after a move, do these steps:

1. Make the old host redirect to the new host.
2. Set `APP_URL` to the new URL. With `APP_DOMAIN`, set `APP_DOMAIN` to the new host.
3. Set `APP_PREVIOUS_URLS` to the old URL, for example `APP_PREVIOUS_URLS=https://old.example.com`. You can give a comma-separated list.
4. Start the container again with the new values. In the Compose stack, run `docker compose up -d`.

The `signed` middleware then also accepts a signature that BYOMailer made on a URL in `APP_PREVIOUS_URLS`.

## The health check

The app answers `GET /up` when Laravel starts correctly. The image and `docker-compose.yml` use this path for the health check of the container. The host rule also allows `/up` on a verified custom link domain, so an uptime monitor can check that path.
