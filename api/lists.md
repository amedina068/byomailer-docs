---
title: Lists
description: List, create, rename and delete the lists of your account.
order: 5
---

# Lists

A list is a group of contacts. See [Lists and topics](../using-byomailer/lists-and-topics.md) for the concepts. To add or remove a contact, see [Contacts](contacts.md).

## The list object

| Field | Type | Description |
|---|---|---|
| `id` | integer | The list ID. |
| `uuid` | string | The list UUID. |
| `name` | string | The name. |
| `opt_in_enabled` | boolean | `true` if a new contact must confirm by email. |
| `created_at` | string | The creation time. |

The API cannot change `opt_in_enabled` or the opt-in email. Use the dashboard for that.

## List lists

`GET /api/v1/lists`

Returns the lists of your account, newest first. Cursor pagination. See [API overview](overview.md#cursor-pagination).

| Query parameter | Type | Description |
|---|---|---|
| `per_page` | integer | `1` or more. A value more than `100` becomes `100`. The default is `25`. |
| `cursor` | string | The cursor of the next or previous page. |

```bash
curl https://byomailer.example/api/v1/lists \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": [
    {
      "id": 1,
      "uuid": "7f3a2b10-2222-4c3b-9d7e-1a2b3c4d5e6f",
      "name": "Weekly",
      "opt_in_enabled": false,
      "created_at": "2026-01-10T08:00:00.000000Z"
    }
  ],
  "links": { "first": null, "last": null, "prev": null, "next": null },
  "meta": {
    "path": "https://byomailer.example/api/v1/lists",
    "per_page": 25,
    "next_cursor": null,
    "prev_cursor": null
  }
}
```

## Create a list

`POST /api/v1/lists`

| Body field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | Yes | 255 characters or fewer. |

```bash
curl -X POST https://byomailer.example/api/v1/lists \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"name": "Product news"}'
```

Response `201`: a `data` object with the list.

## Rename a list

`PATCH /api/v1/lists/{listId}`

| Path parameter | Type | Description |
|---|---|---|
| `listId` | integer | The list ID. |

| Body field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | Yes | 255 characters or fewer. |

```bash
curl -X PATCH https://byomailer.example/api/v1/lists/1 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"name": "Weekly digest"}'
```

Response `200`: the updated list.

## Delete a list

`DELETE /api/v1/lists/{listId}`

Deletes the list. The contacts stay in your account. The database removes their membership in this list.

```bash
curl -X DELETE https://byomailer.example/api/v1/lists/1 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `204` with no body.
