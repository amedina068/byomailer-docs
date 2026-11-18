---
title: Webhook endpoints
description: Register, change, test and delete the HTTPS endpoints that receive webhook events, and read their deliveries.
order: 15
---

# Webhook endpoints

A webhook endpoint is an HTTPS URL that receives a signed `POST` request when an event happens in your account. See [Webhooks](../using-byomailer/webhooks.md) for the payload of each event and for how to verify a signature.

Only a token of a user with the `admin` role can use these endpoints. Other tokens get `403`.

## Events

| Event | When BYOMailer sends it |
|---|---|
| `contact.subscribed` | A contact opts in to a list. |
| `contact.unsubscribed` | A contact unsubscribes. |
| `contact.resubscribed` | A contact that unsubscribed opts in again. |
| `newsletter.sent` | A newsletter finishes sending. One time for each newsletter. |
| `sequence_step.sent` | BYOMailer sends a sequence step to a contact. |
| `sequence.completed` | A contact finishes a sequence. |

## The endpoint object

| Field | Type | Description |
|---|---|---|
| `id` | integer | The endpoint ID. |
| `uuid` | string | The endpoint UUID. |
| `url` | string | The URL that receives the events. |
| `description` | string or null | The description. |
| `events` | array of strings | The events that the endpoint receives. |
| `active` | boolean | `true` if BYOMailer sends events to the endpoint. |
| `disabled_reason` | string or null | `manual` if a user disabled it. `auto_failures` if BYOMailer disabled it after too many failed deliveries. |
| `consecutive_failures` | integer | The number of failed deliveries in a row. |
| `last_triggered_at` | string or null | The time of the last successful delivery. |
| `disabled_at` | string or null | The time when the endpoint was disabled. |
| `created_at` | string | The creation time. |
| `secret` | string | The signing secret. Only in the create response and in the rotate response. |

## List endpoints

`GET /api/v1/webhook-endpoints`

Returns the endpoints of your account, newest first. Cursor pagination. The response does not have the secrets.

```bash
curl https://byomailer.example/api/v1/webhook-endpoints \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": [
    {
      "id": 1,
      "uuid": "2f3e4d5c-8888-4c3b-9d7e-1a2b3c4d5e6f",
      "url": "https://example.com/webhooks/byomailer",
      "description": "CRM sync",
      "events": ["contact.subscribed", "newsletter.sent"],
      "active": true,
      "disabled_reason": null,
      "consecutive_failures": 0,
      "last_triggered_at": "2026-03-02T10:00:00+00:00",
      "disabled_at": null,
      "created_at": "2026-03-01T09:00:00+00:00"
    }
  ],
  "links": { "first": null, "last": null, "prev": null, "next": null },
  "meta": {
    "path": "https://byomailer.example/api/v1/webhook-endpoints",
    "per_page": 25,
    "next_cursor": null,
    "prev_cursor": null
  }
}
```

## Get an endpoint

`GET /api/v1/webhook-endpoints/{webhookEndpointId}`

```bash
curl https://byomailer.example/api/v1/webhook-endpoints/1 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`: a `data` object with the endpoint, without the secret.

## Create an endpoint

`POST /api/v1/webhook-endpoints`

| Body field | Type | Required | Rules |
|---|---|---|---|
| `url` | string | Yes | 2048 characters or fewer. A public `https` URL. BYOMailer refuses private and reserved IP addresses. |
| `events` | array of strings | Yes | One or more values from [Events](#events). |
| `description` | string or null | No | 255 characters or fewer. |

An account can have 25 endpoints or fewer. The `WEBHOOKS_MAX_PER_CLIENT` environment variable sets this limit. Over the limit, the response is `422` with the error key `endpoints`.

```bash
curl -X POST https://byomailer.example/api/v1/webhook-endpoints \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/webhooks/byomailer",
    "events": ["contact.subscribed", "newsletter.sent"],
    "description": "CRM sync"
  }'
```

Response `201`:

```json
{
  "data": {
    "id": 1,
    "uuid": "2f3e4d5c-8888-4c3b-9d7e-1a2b3c4d5e6f",
    "url": "https://example.com/webhooks/byomailer",
    "description": "CRM sync",
    "events": ["contact.subscribed", "newsletter.sent"],
    "active": true,
    "disabled_reason": null,
    "consecutive_failures": 0,
    "last_triggered_at": null,
    "disabled_at": null,
    "created_at": "2026-03-01T09:00:00+00:00",
    "secret": "whsec_<40 random characters>"
  }
}
```

WARNING: Copy the `secret` from this response and keep it in a secret store. BYOMailer does not show it again. To get a new secret, rotate it.

## Change an endpoint

`PATCH /api/v1/webhook-endpoints/{webhookEndpointId}`

You can change only `active` and `description`. To change the URL or the events, delete the endpoint and create a new one.

| Body field | Type | Required | Rules |
|---|---|---|---|
| `active` | boolean | No | `false` disables the endpoint with the reason `manual`. `true` enables it and sets `consecutive_failures` to `0`. |
| `description` | string or null | No | 255 characters or fewer. |

```bash
curl -X PATCH https://byomailer.example/api/v1/webhook-endpoints/1 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

Response `200`: the endpoint, without the secret.

## Delete an endpoint

`DELETE /api/v1/webhook-endpoints/{webhookEndpointId}`

```bash
curl -X DELETE https://byomailer.example/api/v1/webhook-endpoints/1 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `204` with no body.

## Rotate the secret

`POST /api/v1/webhook-endpoints/{webhookEndpointId}/secret`

Makes a new signing secret. The old secret stops working at once. The request has no body.

```bash
curl -X POST https://byomailer.example/api/v1/webhook-endpoints/1/secret \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`: the endpoint, with the new `secret`.

CAUTION: Put the new secret on your receiver immediately. If the receiver keeps the old secret, the signature check fails for the next deliveries.

## Send a test delivery

`POST /api/v1/webhook-endpoints/{webhookEndpointId}/test`

Queues a delivery of the event `webhook.test` to the endpoint. The request has no body. Rate limit: 10 requests each minute for each account.

```bash
curl -X POST https://byomailer.example/api/v1/webhook-endpoints/1/test \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `202`: the delivery, with the status `pending`. The test payload is:

```json
{
  "event": "webhook.test",
  "occurred_at": "2026-03-01T09:00:00+00:00",
  "message": "This is a test delivery from BYOMailer."
}
```

## List deliveries

`GET /api/v1/webhook-endpoints/{webhookEndpointId}/deliveries`

Returns the deliveries of one endpoint, newest first. Cursor pagination.

| Field | Type | Description |
|---|---|---|
| `id` | integer | The delivery ID. |
| `uuid` | string | The delivery UUID. It is also in the `X-Byomailer-Delivery` header. |
| `event_type` | string | The event. |
| `status` | string | `pending`, `success` or `failed`. |
| `attempts` | integer | The number of attempts. |
| `response_status` | integer or null | The HTTP status of the last response of your receiver. |
| `response_body` | string or null | The start of the last response body. |
| `error` | string or null | The error of the last attempt. |
| `payload` | object | The JSON body that BYOMailer sent. |
| `dispatched_at` | string or null | The time when BYOMailer queued the delivery. |
| `delivered_at` | string or null | The time of the successful attempt. |
| `created_at` | string | The creation time. |

```bash
curl https://byomailer.example/api/v1/webhook-endpoints/1/deliveries \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

## Delivery behavior

Each delivery is a `POST` request with a JSON body and these headers:

| Header | Value |
|---|---|
| `X-Byomailer-Event` | The event. |
| `X-Byomailer-Delivery` | The delivery UUID. |
| `X-Byomailer-Timestamp` | The Unix time in seconds when BYOMailer signed the request. |
| `X-Byomailer-Signature` | `sha256=` and the hex HMAC-SHA256 of `<timestamp>.<raw body>`, with the endpoint secret as the key. |
| `User-Agent` | `BYOMailer-Webhook/1.0` |

A response with a `2xx` status is a success. BYOMailer does not follow redirects. If a delivery fails, BYOMailer tries again, 5 attempts in total. After 15 failed deliveries in a row, BYOMailer disables the endpoint with the reason `auto_failures`. The `WEBHOOKS_DISABLE_AFTER_FAILURES` environment variable sets this number.

See [Webhooks](../using-byomailer/webhooks.md) for the signature check and the event payloads. See [Configuration](../getting-started/configuration.md) for the other `WEBHOOKS_*` environment variables.
