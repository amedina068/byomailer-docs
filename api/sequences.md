---
title: Sequences
description: Read sequences, steps and their stats, change content variables and step filters, and export the mails of a step.
order: 9
---

# Sequences

A sequence sends a series of emails (steps) to each contact, with a delay between the steps. See [Sequences](../using-byomailer/sequences.md) for the concepts.

The REST API cannot create a sequence, add a step, change the content, or change a status. Use the dashboard or the MCP server for that. See [MCP tools reference](../mcp/tools-reference.md).

Sequence statuses: `draft`, `live` and `paused`. Step statuses: `draft` and `live`.

## List sequences

`GET /api/v1/sequences`

Returns the sequences of your account. Live sequences come first, then the other sequences by name. Cursor pagination.

| Query parameter | Type | Description |
|---|---|---|
| `status` | string | `draft`, `live` or `paused`. |
| `search` | string | A part of the name. 255 characters or fewer. |
| `project` | integer | A project ID. Only the sequences of that project. |
| `per_page` | integer | `1` or more. A value more than `100` becomes `100`. The default is `25`. |
| `cursor` | string | The cursor of the next or previous page. |

```bash
curl "https://byomailer.example/api/v1/sequences?status=live" \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": [
    {
      "id": 7,
      "name": "Onboarding",
      "status": "live",
      "steps_count": 4,
      "contacts_count": 318,
      "completed_count": 0,
      "active_count": 318,
      "project_ids": [2]
    }
  ],
  "links": { "first": null, "last": null, "prev": null, "next": null },
  "meta": {
    "path": "https://byomailer.example/api/v1/sequences",
    "per_page": 25,
    "next_cursor": null,
    "prev_cursor": null
  }
}
```

TODO(owner): The API sequence queries do not count completed contacts, so `completed_count` is always `0` and `active_count` equals `contacts_count`. The dashboard controller counts them. Must the API do the same?

## Get a sequence

`GET /api/v1/sequences/{sequenceId}`

Returns one sequence with all its steps and their content.

| Field | Type | Description |
|---|---|---|
| `id`, `name`, `status` | | The sequence. |
| `contacts_count`, `completed_count`, `active_count`, `steps_count` | integer | The counts. |
| `steps` | array | The steps. See [The step object](#the-step-object). |
| `segment_id` | integer or null | The saved segment, if the dashboard set one. Read-only. |
| `filters` | array | The filters of the sequence. See [Filters](filters.md). |
| `content_variables` | object | The default value of each `{{ variable }}`. |
| `created_at` | string | The creation time. |
| `project_ids` | array of integers | The projects of the sequence. |

```bash
curl https://byomailer.example/api/v1/sequences/7 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

## The step object

| Field | Type | Description |
|---|---|---|
| `id` | integer | The step ID. |
| `sequence_id` | integer | The sequence ID. |
| `delay_days` | integer | The delay before the step. |
| `delay_type` | string | The unit of `delay_days`: `days` or `hours`. |
| `status` | string | `draft` or `live`. |
| `filters` | array | The filters of the step. A contact that does not match them skips this step. |
| `message` | object or null | The content: `id`, `subject`, `preview_text`, `html_content`, `text_content`, `email_identity_id`, `email_template_id`, `template_slot_content`, `email_template`, `email_identity`. |
| `created_at` | string | The creation time. |

In a step, `message.email_template` has `id`, `name`, `html_content`, `is_default`, `is_system`, `archived_at`, `created_at` and `updated_at`. `message.email_identity` is the full sender identity, with its DNS records, tracking options, reply-to address and custom domains.

## Get a step

`GET /api/v1/sequences/{sequenceId}/steps/{sequenceStepId}`

```bash
curl https://byomailer.example/api/v1/sequences/7/steps/31 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": {
    "id": 31,
    "sequence_id": 7,
    "delay_days": 0,
    "delay_type": "days",
    "status": "live",
    "filters": [],
    "message": {
      "id": 88,
      "subject": "Welcome",
      "preview_text": "Glad that you are here",
      "html_content": "<p>Hi {{ first_name }}</p>",
      "text_content": "Hi {{ first_name }}",
      "email_identity_id": 3,
      "email_template_id": null,
      "template_slot_content": "<p>Hi {{ first_name }}</p>",
      "email_template": null,
      "email_identity": null
    },
    "created_at": "2026-02-01T09:00:00.000000Z"
  }
}
```

## Replace the filters of a step

`PATCH /api/v1/sequences/{sequenceId}/steps/{sequenceStepId}/filters`

Replaces the filters of one step. A contact that does not match the step filters skips only the email of this step. This endpoint works on draft and live steps.

| Body field | Type | Required | Rules |
|---|---|---|---|
| `filters` | array | Yes | 20 filters or fewer. Send `[]` to remove all the filters. See [Filters](filters.md). |

```bash
curl -X PATCH https://byomailer.example/api/v1/sequences/7/steps/31/filters \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"filters": [{"category": "tags", "mode": "any", "values": ["vip"]}]}'
```

Response `200`: the step, with the saved filters.

## Get the stats of a sequence

`GET /api/v1/sequences/{sequenceId}/stats`

```bash
curl https://byomailer.example/api/v1/sequences/7/stats \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": {
    "id": 7,
    "name": "Onboarding",
    "status": "live",
    "stats": { "contacts": 318, "completed": 120, "unsubscribed": 6, "clicked": 121 },
    "mail_metrics": {
      "total": 1180,
      "sent": 1180,
      "delivered": 1170,
      "pending": 0,
      "skipped": 14,
      "opened": 540,
      "bounced": 10,
      "unsubscribed": 6,
      "complained": 0,
      "delivery_rate": 99.2,
      "open_rate": 45.8,
      "unsubscribe_rate": 0.5
    }
  }
}
```

`stats` counts contacts. `mail_metrics` counts mails of all the steps. The rates are percentages of `sent`, with one decimal place. If `sent` is `0`, the rates are `null`.

## Get the stats of a step

`GET /api/v1/sequences/{sequenceId}/steps/{sequenceStepId}/stats`

BYOMailer counts each contact only in the furthest step that the contact reached.

```bash
curl https://byomailer.example/api/v1/sequences/7/steps/31/stats \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`: `id`, `sequence_id`, `subject`, `delay_days`, `delay_type`, `status`, `stats` (`contacts`, `unsubscribed`, `clicked`) and `mail_metrics` (the same fields as for the sequence).

## Get the content variables

`GET /api/v1/sequences/{sequenceId}/variables`

Returns the `{{ variables }}` that the steps use (`detected_variables`), and the default of each variable (`content_variables`). The list does not have the reserved variables `content`, `unsubscribe_url`, `preferences_url` and `opt_in_url`.

```bash
curl https://byomailer.example/api/v1/sequences/7/variables \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": {
    "sequence_id": 7,
    "detected_variables": ["checkout_url", "first_name"],
    "content_variables": { "checkout_url": "https://example.com/checkout", "first_name": "" }
  }
}
```

## Replace the content variables

`PATCH /api/v1/sequences/{sequenceId}/variables`

Replaces all the saved defaults. This endpoint works on draft, live and paused sequences.

| Body field | Type | Required | Rules |
|---|---|---|---|
| `content_variables` | object or null | Yes | Each value is a string of 255 characters or fewer, or `null`. Send `{}` to remove all the defaults. |

```bash
curl -X PATCH https://byomailer.example/api/v1/sequences/7/variables \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"content_variables": {"first_name": "there"}}'
```

Response `200`: the same shape as [Get the content variables](#get-the-content-variables).

## Export the mails of a step

`GET /api/v1/sequences/{sequenceId}/steps/{sequenceStepId}/contact-mails/export`

Returns a CSV file with one row for each mail of the step. The file name is `sequence-<sequenceId>-step-<stepId>-contact-mails.csv`.

| Query parameter | Type | Description |
|---|---|---|
| `contact_id` | integer | One contact. |
| `status` | string | `pending`, `sent`, `delivered`, `opened`, `bounced`, `rejected`, `complained`, `unsubscribed`, `failed` or `skipped`. |
| `filter` | string | `all`, `pending`, `sent`, `delivered`, `opened`, `clicked`, `bounced`, `rejected`, `complained`, `unsubscribed`, `failed` or `skipped`. |
| `search` | string | A part of the subject, or of the email address or name of the contact. |
| `sent_after` | string | A date. Only mails sent at or after it. |
| `sent_before` | string | A date on or after `sent_after`. Only mails sent at or before it. |
| `sort` | string | `id`, `email`, `name`, `subject`, `status`, or a time column (`scheduled_at`, `sent_at`, `delivered_at`, `opened_at`, `clicked_at`, `bounced_at`, `rejected_at`, `complained_at`, `unsubscribed_at`, `created_at`). The default is `id`. |
| `direction` | string | `asc` or `desc`. The default is `desc`. |
| `current_only` | boolean | Accepted, but it has no effect. |

The CSV columns: `email`, `name`, `status`, `variant`, `subject`, `from_email`, `from_name`, `scheduled_at`, `sent_at`, `delivered_at`, `opened_at`, `clicked_at`, `bounced_at`, `complained_at`, `rejected_at`, `unsubscribed_at`, `failure_reason`, `body`.

```bash
curl "https://byomailer.example/api/v1/sequences/7/steps/31/contact-mails/export?filter=opened" \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -o step-31-mails.csv
```

TODO(owner): `SequenceStepContactMailExportController` validates `current_only` but does not pass it to `ContactMailQuery::forUser()`. Must the export use it?
