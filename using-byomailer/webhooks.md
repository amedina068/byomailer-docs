---
title: Webhooks
description: Send an HTTPS request to your own server when a contact subscribes or unsubscribes, a newsletter is sent, or a sequence step is sent.
order: 16
---

# Webhooks

An outgoing webhook sends a signed HTTPS `POST` request to your server when an event happens in your account. You register an endpoint, choose its events, and verify the signature of each request.

Only a team member with the `admin` role can manage the webhooks of an account. See [Teams](teams.md). You can also manage the endpoints with the API. See [Webhooks API](../api/webhooks.md).

## Events

| Event | Label | When BYOMailer sends it |
|---|---|---|
| `contact.subscribed` | Contact subscribed | A contact opts in to a list. |
| `contact.unsubscribed` | Contact unsubscribed | A contact unsubscribes. |
| `contact.resubscribed` | Contact resubscribed | A contact that unsubscribed before opts back in. |
| `newsletter.sent` | Newsletter sent | A newsletter finishes sending. BYOMailer sends it one time for each newsletter. |
| `sequence_step.sent` | Sequence step sent | SES reports the SEND event of a sequence email to a contact. |
| `sequence.completed` | Sequence completed | A contact completes a sequence. |

These details apply:

- `contact.subscribed` fires when the contact opts in to a list for the first time.
- `contact.unsubscribed` does not fire when BYOMailer unsubscribes a contact because of a bounce or a complaint. See [Deliverability](deliverability.md).
- For a newsletter with an A/B test, `newsletter.sent` fires when you pick the winner. See [A/B tests](ab-tests.md).
- `sequence.completed` also fires when a contact exits a sequence because it does not match the sequence filters. See [Sequences](sequences.md).

## Add an endpoint

1. Open **Settings**, **Webhooks**.
2. Enter the URL of your endpoint.
3. Select one or more events.
4. Optional: enter a description of 255 characters or fewer.
5. Click **Create endpoint**.
6. Copy the signing secret. BYOMailer shows it only one time.

The URL must be a public `https` URL. BYOMailer refuses a URL that resolves to a private, loopback, link-local or reserved IP address. The error is `The webhook URL must be a public https endpoint.`

An account can have at most `WEBHOOKS_MAX_PER_CLIENT` endpoints (default 25). Above the limit, BYOMailer shows `You have reached the maximum number of webhook endpoints.`

The secret starts with `whsec_`. If you lose it, open the endpoint and click **Regenerate secret**. The old secret stops working at once.

## The request

BYOMailer sends each request with these headers:

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `User-Agent` | `BYOMailer-Webhook/1.0` |
| `X-Byomailer-Event` | The event, for example `contact.subscribed`. |
| `X-Byomailer-Delivery` | The UUID of the delivery. A retry has the same UUID. |
| `X-Byomailer-Timestamp` | The time of this attempt, in Unix seconds. |
| `X-Byomailer-Signature` | `sha256=` and the HMAC of the request. See [Verify the signature](#verify-the-signature). |

BYOMailer does not follow redirects. A redirect counts as a failed attempt.

## The payload

The body is a JSON object. Each payload has `event` and `occurred_at` (ISO 8601). The other keys depend on the event:

| Event | Keys |
|---|---|
| `contact.subscribed`, `contact.unsubscribed`, `contact.resubscribed` | `contact` |
| `newsletter.sent` | `newsletter` |
| `sequence_step.sent` | `contact`, `sequence`, `sequence_step` |
| `sequence.completed` | `contact`, `sequence` |

| Object | Fields |
|---|---|
| `contact` | `id`, `uuid`, `email`, `name`, and each custom attribute of the contact. |
| `newsletter` | `id`, `uuid`, `title`, `sent_at` |
| `sequence` | `id`, `name` |
| `sequence_step` | `id` |

The custom attributes are at the top level of the `contact` object. An attribute with the name `id`, `uuid`, `email` or `name` does not replace these fields.

Example of `sequence_step.sent`:

```json
{
  "event": "sequence_step.sent",
  "occurred_at": "2026-11-17T10:00:00+00:00",
  "contact": {
    "plan": "pro",
    "id": 42,
    "uuid": "6f1c2d3e-0000-4000-8000-000000000042",
    "email": "ana@example.com",
    "name": "Ana"
  },
  "sequence": {
    "id": 7,
    "name": "Onboarding"
  },
  "sequence_step": {
    "id": 31
  }
}
```

## Verify the signature

BYOMailer signs each request with the secret of the endpoint. The signature is an HMAC-SHA256 of the timestamp, a period, and the raw body:

```text
X-Byomailer-Signature: sha256=<hex of HMAC-SHA256(secret, timestamp + "." + raw body)>
```

To verify a request, do these steps in your receiver:

1. Read the raw body before you parse the JSON.
2. Read the `X-Byomailer-Timestamp` header.
3. Calculate the HMAC-SHA256 of `<timestamp>.<raw body>` with your secret.
4. Compare `sha256=<your result>` with the `X-Byomailer-Signature` header. Use a comparison in constant time.
5. If the timestamp is too old, refuse the request. You choose the time window, for example 5 minutes.

PHP example for a Laravel receiver:

```php
use Illuminate\Http\Request;

function byomailerSignatureIsValid(Request $request, string $secret): bool
{
    $timestamp = (string) $request->header('X-Byomailer-Timestamp');
    $signature = (string) $request->header('X-Byomailer-Signature');

    $expected = 'sha256='.hash_hmac('sha256', $timestamp.'.'.$request->getContent(), $secret);

    return hash_equals($expected, $signature)
        && abs(time() - (int) $timestamp) <= 300;
}
```

Node.js example:

```js
import crypto from 'node:crypto';

function isValid(rawBody, timestamp, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(signature ?? '');
  const fresh = Math.abs(Date.now() / 1000 - Number(timestamp)) <= 300;

  return a.length === b.length && crypto.timingSafeEqual(a, b) && fresh;
}
```

## Retries

A delivery is successful when your endpoint answers with a 2xx status. Any other status, a timeout or a connection error is a failed attempt.

BYOMailer tries each delivery up to 5 times. The waits between the attempts are 1 minute, 5 minutes, 15 minutes and 1 hour. After the last failed attempt, the delivery status is `failed`.

The request timeout is `WEBHOOKS_TIMEOUT_SECONDS` (default 10 seconds). Keep it below 30 seconds, the time limit of the delivery job.

Two failures get no retry:

- The account sent more than `WEBHOOKS_DELIVERY_RATE_PER_MINUTE` deliveries (default 60) in one minute. The error is `rate_limited: per-client delivery rate limit exceeded`.
- At delivery time, the host of the URL resolves to a blocked IP address. The error starts with `Blocked by SSRF guard:`.

A retry has the same `X-Byomailer-Delivery` UUID. Use it to find duplicate requests in your receiver.

## Auto-disable

BYOMailer counts the failed deliveries of each endpoint in a row. A successful delivery sets the count to 0.

When the count reaches `WEBHOOKS_DISABLE_AFTER_FAILURES` (default 15), BYOMailer disables the endpoint. The list of endpoints shows `Paused — <count> failures`. A disabled endpoint gets no new deliveries.

To enable the endpoint again, correct your receiver. Then click the enable button of the endpoint on the list of endpoints. BYOMailer sets the failure count to 0.

## Test an endpoint

Open the endpoint and click **Send test delivery**. BYOMailer queues a delivery with the event `webhook.test`:

```json
{
  "event": "webhook.test",
  "occurred_at": "2026-11-17T10:00:00+00:00",
  "message": "This is a test delivery from BYOMailer."
}
```

The test delivery has the same headers and signature as a real delivery. An account can send 10 test deliveries each minute.

## The delivery log

The endpoint page shows the last 50 deliveries. Each delivery has these fields:

| Field | Meaning |
|---|---|
| Event | The event of the delivery. |
| Status | `pending`, `success` or `failed`. |
| Attempts | The number of attempts. |
| Response status | The HTTP status of the last answer. |
| Response body | The first `WEBHOOKS_RESPONSE_BODY_CAP_BYTES` bytes of the last answer (default 2048). |
| Error | The error of the last failed attempt. |

Every day, the scheduler runs `model:prune` for the deliveries. It deletes the deliveries that are older than `WEBHOOKS_DELIVERY_RETENTION_DAYS` (default 30).

## Environment variables

| Variable | Default | Meaning |
|---|---|---|
| `WEBHOOKS_MAX_PER_CLIENT` | 25 | The maximum number of endpoints for each account. |
| `WEBHOOKS_DISABLE_AFTER_FAILURES` | 15 | The failed deliveries in a row that disable an endpoint. |
| `WEBHOOKS_TIMEOUT_SECONDS` | 10 | The timeout of each request, in seconds. Keep it below 30. |
| `WEBHOOKS_RESPONSE_BODY_CAP_BYTES` | 2048 | The number of bytes of the answer that BYOMailer keeps. |
| `WEBHOOKS_DELIVERY_RATE_PER_MINUTE` | 60 | The maximum deliveries each minute for each account. |
| `WEBHOOKS_DELIVERY_RETENTION_DAYS` | 30 | The number of days that BYOMailer keeps the delivery log. |

BYOMailer sends the deliveries on the `webhooks` queue. Queue workers must run. See [Queues and Horizon](../self-hosting/queues-and-horizon.md).
