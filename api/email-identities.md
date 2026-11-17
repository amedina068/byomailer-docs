---
title: Sender identities
description: List and read the sender identities of your account.
order: 12
---

# Sender identities

A sender identity is a verified address or domain in your AWS SES account. BYOMailer sends from it. In the code and in the API paths, a sender identity is an "email identity". See [Sender identities](../using-byomailer/sender-identities.md) for the concepts.

The REST API is read-only for sender identities. Use the dashboard to add or verify one. The MCP server can also create one. See [MCP tools reference](../mcp/tools-reference.md).

## The sender identity object

| Field | Type | Description |
|---|---|---|
| `id` | integer | The identity ID. Use it as `email_identity_id` in a newsletter. |
| `uuid` | string | The identity UUID. |
| `email` | string | The sender address. |
| `name` | string or null | The sender name. |
| `domain` | string | The domain of the address. |
| `identity_status` | string | `pending`, `verifying`, `verified` or `failed`. |
| `verified_at` | string or null | The time of the verification. |
| `created_at` | string | The creation time. |
| `updated_at` | string | The time of the last change. |

A newsletter can use only an identity with the status `verified`.

## List sender identities

`GET /api/v1/email-identities`

Returns the sender identities of your account, newest first. Cursor pagination.

| Query parameter | Type | Description |
|---|---|---|
| `identity_status` | string | `pending`, `verifying`, `verified` or `failed`. |
| `per_page` | integer | From `1` to `100`. The default is `25`. |
| `cursor` | string | The cursor of the next or previous page. |

```bash
curl "https://byomailer.example/api/v1/email-identities?identity_status=verified" \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": [
    {
      "id": 3,
      "uuid": "1a2b3c4d-5555-4c3b-9d7e-1a2b3c4d5e6f",
      "email": "news@example.com",
      "name": "Example News",
      "domain": "example.com",
      "identity_status": "verified",
      "verified_at": "2026-01-02T09:00:00.000000Z",
      "created_at": "2026-01-01T09:00:00.000000Z",
      "updated_at": "2026-01-02T09:00:00.000000Z"
    }
  ],
  "links": { "first": null, "last": null, "prev": null, "next": null },
  "meta": {
    "path": "https://byomailer.example/api/v1/email-identities",
    "per_page": 25,
    "next_cursor": null,
    "prev_cursor": null
  }
}
```

## Get a sender identity

`GET /api/v1/email-identities/{emailIdentityId}`

| Path parameter | Type | Description |
|---|---|---|
| `emailIdentityId` | integer | The identity ID. |

```bash
curl https://byomailer.example/api/v1/email-identities/3 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`: a `data` object with the sender identity.
