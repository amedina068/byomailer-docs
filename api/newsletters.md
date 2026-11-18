---
title: Newsletters
description: List, create, change, schedule, test and delete newsletters, and count their audience.
order: 8
---

# Newsletters

A newsletter is one email that BYOMailer sends to the contacts that match its filters. See [Newsletters](../using-byomailer/newsletters.md) and [A/B tests](../using-byomailer/ab-tests.md) for the concepts.

## Statuses

| Status | Meaning |
|---|---|
| `draft` | Not scheduled. You can change it and delete it. |
| `scheduled` | BYOMailer sends it at `scheduled_at`. You can change it. You cannot delete it. |
| `queued` | BYOMailer is sending it. You cannot change it. |
| `ab_testing` | The A/B test is in progress. |
| `sent` | The send is complete. |
| `failed` | The send failed. |

The API accepts only two values in the `status` body field: `draft` and `live`. BYOMailer changes `live` to `scheduled` or `queued`. See [Send or schedule a newsletter](#send-or-schedule-a-newsletter).

## The newsletter object

| Field | Type | Description |
|---|---|---|
| `id` | integer | The newsletter ID. |
| `uuid` | string | The newsletter UUID. |
| `title` | string | The internal title. |
| `status` | string | See [Statuses](#statuses). |
| `subject` | string or null | The subject. For an A/B test, the subject of variant A. |
| `preview_text` | string or null | The preview text. |
| `email_identity_id` | integer or null | The ID of the sender identity. |
| `email_identity` | object or null | The sender identity. See [Sender identities](email-identities.md). |
| `email_template_id` | integer or null | The ID of the template. |
| `from_email` | string or null | The sender address. |
| `from_name` | string or null | The sender name. |
| `scheduled_at` | string or null | The send time. |
| `sent_at` | string or null | The time when the send was complete. |
| `segment_id` | integer or null | The saved segment, if the dashboard set one. Read-only. |
| `filters` | array | The audience filters. See [Filters](filters.md). |
| `content_variables` | object | The default value of each `{{ variable }}`. |
| `ab_test_enabled` | boolean | `true` if the newsletter has a variant B. |
| `ab_test_winner_variant` | string or null | `a` or `b` after you choose a winner. |
| `subject_b` | string or null | The subject of variant B. |
| `preview_text_b` | string or null | The preview text of variant B. |
| `total_contacts_reached` | integer | The number of contacts that the send reached. |
| `project_ids` | array of integers | The projects of the newsletter. |
| `metrics` | object | `total`, `sent`, `pending`, `opened`, `bounced`, `unsubscribed`, `complained`, `open_rate`, `unsubscribe_rate`. |
| `html_content` | string or null | The HTML body. Only in a single newsletter, not in the list. |
| `text_content` | string or null | The text body. Only in a single newsletter. |
| `html_content_b` | string or null | The HTML body of variant B. Only in a single newsletter. |
| `text_content_b` | string or null | The text body of variant B. Only in a single newsletter. |
| `created_at` | string | The creation time. |
| `updated_at` | string | The time of the last change. |

`open_rate` and `unsubscribe_rate` are percentages of `sent`, with one decimal place. If `sent` is `0`, they are `0`.

## List newsletters

`GET /api/v1/newsletters`

Returns the newsletters of your account, newest first. Cursor pagination. The items do not have `html_content`, `text_content`, `html_content_b` or `text_content_b`.

| Query parameter | Type | Description |
|---|---|---|
| `status` | string | `draft`, `scheduled`, `queued`, `ab_testing`, `sent` or `failed`. |
| `search` | string | A part of the title or of the subject. 255 characters or fewer. |
| `project` | integer | A project ID. Only the newsletters of that project. |
| `per_page` | integer | `1` or more. A value more than `100` becomes `100`. The default is `25`. |
| `cursor` | string | The cursor of the next or previous page. |

```bash
curl "https://byomailer.example/api/v1/newsletters?status=sent" \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": [
    {
      "id": 41,
      "uuid": "6c1d2e3f-4444-4c3b-9d7e-1a2b3c4d5e6f",
      "title": "February update",
      "status": "sent",
      "subject": "What is new in February",
      "preview_text": null,
      "email_identity_id": 3,
      "email_identity": {
        "id": 3,
        "uuid": "1a2b3c4d-5555-4c3b-9d7e-1a2b3c4d5e6f",
        "email": "news@example.com",
        "name": "Example News",
        "domain": "example.com",
        "identity_status": "verified",
        "verified_at": "2026-01-02T09:00:00.000000Z",
        "created_at": "2026-01-01T09:00:00.000000Z",
        "updated_at": "2026-01-02T09:00:00.000000Z"
      },
      "email_template_id": null,
      "from_email": "news@example.com",
      "from_name": "Example News",
      "scheduled_at": "2026-02-03T09:00:00.000000Z",
      "sent_at": "2026-02-03T09:04:12.000000Z",
      "segment_id": null,
      "filters": [],
      "content_variables": {},
      "ab_test_enabled": false,
      "ab_test_winner_variant": null,
      "subject_b": null,
      "preview_text_b": null,
      "total_contacts_reached": 1250,
      "project_ids": [],
      "metrics": {
        "total": 1250,
        "sent": 1250,
        "pending": 0,
        "opened": 512,
        "bounced": 4,
        "unsubscribed": 3,
        "complained": 0,
        "open_rate": 41,
        "unsubscribe_rate": 0.2
      },
      "created_at": "2026-02-01T09:00:00.000000Z",
      "updated_at": "2026-02-03T09:04:12.000000Z"
    }
  ],
  "links": { "first": null, "last": null, "prev": null, "next": null },
  "meta": {
    "path": "https://byomailer.example/api/v1/newsletters",
    "per_page": 25,
    "next_cursor": null,
    "prev_cursor": null
  }
}
```

## Get a newsletter

`GET /api/v1/newsletters/{newsletterId}`

Returns one newsletter with its full content.

```bash
curl https://byomailer.example/api/v1/newsletters/42 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": {
    "id": 42,
    "uuid": "0e7b5a3c-4444-4c3b-9d7e-1a2b3c4d5e6f",
    "title": "March update",
    "status": "draft",
    "subject": "What is new in March",
    "preview_text": "Three new features",
    "email_identity_id": 3,
    "email_identity": {
      "id": 3,
      "uuid": "1a2b3c4d-5555-4c3b-9d7e-1a2b3c4d5e6f",
      "email": "news@example.com",
      "name": "Example News",
      "domain": "example.com",
      "identity_status": "verified",
      "verified_at": "2026-01-02T09:00:00.000000Z",
      "created_at": "2026-01-01T09:00:00.000000Z",
      "updated_at": "2026-01-02T09:00:00.000000Z"
    },
    "email_template_id": null,
    "from_email": "news@example.com",
    "from_name": "Example News",
    "scheduled_at": null,
    "sent_at": null,
    "segment_id": null,
    "filters": [
      { "connector": "and", "category": "tags", "mode": "any", "values": ["customer"] }
    ],
    "content_variables": { "first_name": "there" },
    "ab_test_enabled": false,
    "ab_test_winner_variant": null,
    "subject_b": null,
    "preview_text_b": null,
    "total_contacts_reached": 0,
    "project_ids": [],
    "metrics": {
      "total": 0,
      "sent": 0,
      "pending": 0,
      "opened": 0,
      "bounced": 0,
      "unsubscribed": 0,
      "complained": 0,
      "open_rate": 0,
      "unsubscribe_rate": 0
    },
    "html_content": "<p>Hi {{ first_name }}</p><p><a href=\"{{ unsubscribe_url }}\">Unsubscribe</a></p>",
    "text_content": "Hi {{ first_name }}",
    "html_content_b": null,
    "text_content_b": null,
    "created_at": "2026-03-01T09:00:00.000000Z",
    "updated_at": "2026-03-01T09:00:00.000000Z"
  }
}
```

## Create a newsletter

`POST /api/v1/newsletters`

| Body field | Type | Required | Rules |
|---|---|---|---|
| `title` | string or null | No | 255 characters or fewer. The default is `Untitled newsletter`. |
| `subject` | string or null | If `status` is `live` | 255 characters or fewer. |
| `preview_text` | string or null | No | 255 characters or fewer. Safe HTML. |
| `html_content` | string or null | If `status` is `live` | 524288 characters (512 KB) or fewer. Safe HTML. |
| `status` | string | No | `draft` or `live`. The default is `draft`. |
| `scheduled_at` | string or null | If `status` is `live` | A date and time. Not allowed unless `status` is `live`. Not more than 60 seconds in the past. |
| `email_identity_id` | integer or null | If `status` is `live` | A verified sender identity of your account. |
| `email_template_id` | integer or null | No | A template of your account. |
| `ab_test_enabled` | boolean | No | `true` adds a variant B. |
| `subject_b` | string or null | If `ab_test_enabled` is `true` | 255 characters or fewer. |
| `preview_text_b` | string or null | No | 255 characters or fewer. Safe HTML. |
| `html_content_b` | string or null | If `ab_test_enabled` is `true` | 524288 characters or fewer. Safe HTML. |
| `content_variables` | object or null | No | Each value is a string of 255 characters or fewer, or `null`. |
| `filters` | array | No | 20 filters or fewer. See [Filters](filters.md). |
| `project_ids` | array of integers | No | Projects of your account. |

BYOMailer makes `text_content` from `html_content`. You cannot send `text_content`.

"Safe HTML" means that the HTML is valid and has no unsafe content. BYOMailer refuses these tags: `script`, `iframe`, `object`, `embed`, `form`, `input`, `textarea`, `select`, `button`, `applet`, `meta`, `link`, `base`, `svg`, `math`. It also refuses event attributes such as `onclick`, and `javascript:` and `vbscript:` URLs.

```bash
curl -X POST https://byomailer.example/api/v1/newsletters \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "March update",
    "subject": "What is new in March",
    "html_content": "<p>Hi {{ first_name }}</p><p><a href=\"{{ unsubscribe_url }}\">Unsubscribe</a></p>",
    "content_variables": { "first_name": "there" },
    "filters": [
      { "category": "tags", "mode": "any", "values": ["customer"] }
    ]
  }'
```

Response `201`: the newsletter.

BYOMailer saves `email_identity_id` for a draft and for a `live` request. To send a [test email](#send-a-test-email), the newsletter must have a sender identity.

## Change a newsletter

`PATCH /api/v1/newsletters/{newsletterId}`

Changes the fields that you send. You can change only a newsletter with the status `draft` or `scheduled`. For other statuses, the response is `422` with the error key `status`.

The body fields are the same as for [Create a newsletter](#create-a-newsletter), with these differences:

- All fields are optional. Send one or more fields. An empty body gets `422` with `At least one field must be provided.`
- `subject_b` and `html_content_b` are optional, also when `ab_test_enabled` is `true`.
- `ab_test_enabled: false` deletes variant B.
- `filters` replaces all the filters.
- `status: draft` returns a scheduled newsletter to `draft`.

```bash
curl -X PATCH https://byomailer.example/api/v1/newsletters/42 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"subject": "What is new this month"}'
```

Response `200`: the newsletter.

## Send or schedule a newsletter

To send or schedule a newsletter, create it or change it with `status: live` and a `scheduled_at` time:

- If `scheduled_at` is now or in the past (60 seconds or less), the status becomes `queued` and BYOMailer starts the send.
- If `scheduled_at` is in the future, the status becomes `scheduled`. The scheduler checks each minute and sends it when the time comes.

A `live` request must pass these checks. In a change request, BYOMailer uses the saved values for the fields that you do not send.

| Check | Error key |
|---|---|
| The subject is not empty. | `subject` |
| The HTML body is not empty. | `html_content` |
| If the A/B test is on, the subject and the body of variant B are not empty. | `subject_b`, `html_content_b` |
| A verified sender identity is set. | `email_identity_id` |
| SES did not pause sending for the AWS account. | `ses_account` |
| The AWS credentials have the SES permissions `ses:CreateEmailTemplate`, `ses:DeleteEmailTemplate` and `ses:SendBulkEmail`. | `ses_permissions` |

```bash
curl -X PATCH https://byomailer.example/api/v1/newsletters/42 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "live",
    "scheduled_at": "2026-03-10T09:00:00Z",
    "email_identity_id": 3
  }'
```

CAUTION: Send `status: live` only when the content and the audience are final. If `scheduled_at` is not in the future, BYOMailer starts the send at once.

See [Deliverability](../using-byomailer/deliverability.md) and [Connect AWS SES](../getting-started/connect-aws-ses.md).

## Delete a newsletter

`DELETE /api/v1/newsletters/{newsletterId}`

Deletes a newsletter with the status `draft`, with its messages and mails. For other statuses, the response is `422` with the error key `status`.

```bash
curl -X DELETE https://byomailer.example/api/v1/newsletters/42 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `204` with no body.

## Count the audience

`POST /api/v1/newsletters/contacts/preview`

Counts the contacts that match the filters and can receive mail. The count does not include unsubscribed contacts, sunset contacts and blacklisted addresses. This endpoint saves nothing. Rate limit: 30 requests each minute.

| Body field | Type | Required | Rules |
|---|---|---|---|
| `filters` | array | No | 20 filters or fewer. See [Filters](filters.md). With no filters, the count has all the contacts that can receive mail. |

```bash
curl -X POST https://byomailer.example/api/v1/newsletters/contacts/preview \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"filters": [{"category": "lists", "mode": "any", "values": [1]}]}'
```

Response `200`:

```json
{
  "count": 1250
}
```

## Send a test email

`POST /api/v1/newsletters/{newsletterId}/test-mail`

Sends the newsletter to the email address of the token user. The newsletter must have a sender identity. The request has no body. Rate limit: 5 requests each minute.

```bash
curl -X POST https://byomailer.example/api/v1/newsletters/42/test-mail \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "message": "Test email sent to owner@example.com",
  "sent_to": "owner@example.com"
}
```

If the newsletter has no sender identity, the response is `422` with the error key `email_identity_id` and the message `Please select a sender before sending a test email.` If the send fails, the error key is `send`.

## Choose the A/B winner

`POST /api/v1/newsletters/{newsletterId}/ab-winner`

Stores the winning variant, sets the status to `sent`, and sets `sent_at`. The newsletter must have the status `ab_testing` and a variant B. Else the response is `422`.

| Body field | Type | Required | Rules |
|---|---|---|---|
| `winner_variant` | string | Yes | `a` or `b`. |

```bash
curl -X POST https://byomailer.example/api/v1/newsletters/42/ab-winner \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"winner_variant": "b"}'
```

Response `200`: the newsletter.

## Get the content variables

`GET /api/v1/newsletters/{newsletterId}/variables`

Returns the `{{ variables }}` that the subject and the body use (`detected_variables`), and the default of each variable (`content_variables`). A default fills a variable when the contact has no value for it. The list does not have the reserved variables `content`, `unsubscribe_url`, `preferences_url`, `opt_in_url` and `postal_address`.

```bash
curl https://byomailer.example/api/v1/newsletters/42/variables \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": {
    "newsletter_id": 42,
    "detected_variables": ["first_name"],
    "content_variables": { "first_name": "there" }
  }
}
```

A detected variable with no saved default has the value `""`.

## Replace the content variables

`PATCH /api/v1/newsletters/{newsletterId}/variables`

Replaces all the saved defaults. You can change only a newsletter with the status `draft` or `scheduled`. A default can name a variable that the content does not use yet.

| Body field | Type | Required | Rules |
|---|---|---|---|
| `content_variables` | object or null | Yes | Each value is a string of 255 characters or fewer, or `null`. Send `{}` to remove all the defaults. |

```bash
curl -X PATCH https://byomailer.example/api/v1/newsletters/42/variables \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"content_variables": {"first_name": "friend"}}'
```

Response `200`: the same shape as [Get the content variables](#get-the-content-variables).
