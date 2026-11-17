---
title: Email logs
description: Read the log of the calls that BYOMailer made to Amazon SES.
order: 13
---

# Email logs

BYOMailer writes an email log row for each call that it makes to Amazon SES with the credentials of your account. For a bulk send, it writes one row for each recipient. The email log endpoints are read-only.

## The email log object

| Field | Type | Description |
|---|---|---|
| `id` | integer | The log ID. |
| `provider` | string | `ses`. |
| `operation` | string | The name of the SES operation, for example `SendBulkEmail` or `SendEmail`. |
| `recipient` | string or null | The recipient address, for a send operation. |
| `message_id` | string or null | The SES message ID. |
| `status` | string | See [Status values](#status-values). |
| `error` | string or null | The error message, if the call failed. |
| `request_payload` | object or null | The request that BYOMailer sent to SES. `null` for a bulk send row. |
| `response_payload` | object or null | The response of SES. |
| `sns_payload` | object or null | The last SES event for the message, from Amazon SNS. |
| `logged_at` | string | The time of the call. |
| `created_at` | string | The creation time of the row. |

## Status values

| Value | Meaning |
|---|---|
| `sent` | SES accepted a send operation. |
| `success` | SES accepted an operation that is not a send. |
| `failed` | The call failed, or SES refused one recipient of a bulk send. |

When SES reports an event for the message, BYOMailer changes `status` to the status of the mail, for example `delivered` or `bounced`. It also stores the event in `sns_payload`.

## List email logs

`GET /api/v1/email-logs`

Returns the email logs of your account, newest `logged_at` first. Cursor pagination.

| Query parameter | Type | Description |
|---|---|---|
| `status` | string | The exact status. |
| `operation` | string | The exact SES operation name. |
| `recipient` | string | A part of the recipient address. |
| `per_page` | integer | From `1` to `100`. The default is `25`. |
| `cursor` | string | The cursor of the next or previous page. |

```bash
curl "https://byomailer.example/api/v1/email-logs?status=failed" \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": [
    {
      "id": 1,
      "provider": "ses",
      "operation": "SendBulkEmail",
      "recipient": "ana@example.com",
      "message_id": "0102018e-abcd-1234-5678-abcdef123456",
      "status": "delivered",
      "error": null,
      "request_payload": null,
      "response_payload": { "Status": "SUCCESS", "MessageId": "0102018e-abcd-1234-5678-abcdef123456" },
      "sns_payload": { "eventType": "Delivery", "mail": { "messageId": "0102018e-abcd-1234-5678-abcdef123456" } },
      "logged_at": "2026-03-10T09:00:02.000000Z",
      "created_at": "2026-03-10T09:00:02.000000Z"
    }
  ],
  "links": { "first": null, "last": null, "prev": null, "next": null },
  "meta": {
    "path": "https://byomailer.example/api/v1/email-logs",
    "per_page": 25,
    "next_cursor": null,
    "prev_cursor": null
  }
}
```

## Get an email log

`GET /api/v1/email-logs/{emailLogId}`

| Path parameter | Type | Description |
|---|---|---|
| `emailLogId` | integer | The log ID. |

```bash
curl https://byomailer.example/api/v1/email-logs/1 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`: a `data` object with the email log.

See [Troubleshooting](../self-hosting/troubleshooting.md) and [Deliverability](../using-byomailer/deliverability.md).
