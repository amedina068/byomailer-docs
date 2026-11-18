---
title: Tags
description: List, create, rename and delete tags.
order: 7
---

# Tags

A tag is a label on a contact. See [Tags and attributes](../using-byomailer/tags-and-attributes.md) for the concepts. To add or remove a tag on a contact, send `tags` or `remove_tags` to the [contact endpoints](contacts.md).

The tag endpoints work on all the tags of your account, also the tags that another team member made.

## The tag object

| Field | Type | Description |
|---|---|---|
| `id` | integer | The tag ID. |
| `uuid` | string | The tag UUID. |
| `name` | string | The name. |
| `created_at` | string | The creation time. |

## List tags

`GET /api/v1/tags`

Returns all the tags of your account, newest first. This endpoint has no pagination.

```bash
curl https://byomailer.example/api/v1/tags \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": [
    {
      "id": 3,
      "uuid": "5d2e8a90-1111-4c3b-9d7e-1a2b3c4d5e6f",
      "name": "customer",
      "created_at": "2026-01-10T08:00:00.000000Z"
    }
  ]
}
```

## Create a tag

`POST /api/v1/tags`

| Body field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | Yes | 255 characters or fewer. Unique among the tags of your account. |

```bash
curl -X POST https://byomailer.example/api/v1/tags \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"name": "vip"}'
```

Response `201`: a `data` object with the tag.

## Rename a tag

`PATCH /api/v1/tags/{tagId}`

| Path parameter | Type | Description |
|---|---|---|
| `tagId` | integer | The tag ID. |

| Body field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | Yes | 255 characters or fewer. Unique among the tags of your account. |

```bash
curl -X PATCH https://byomailer.example/api/v1/tags/3 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"name": "customers"}'
```

Response `200`: the updated tag.

A saved [filter](filters.md) stores tag names, not tag IDs. BYOMailer does not change saved filters when you rename a tag. If a filter uses the old name, update the filter.

## Delete a tag

`DELETE /api/v1/tags/{tagId}`

```bash
curl -X DELETE https://byomailer.example/api/v1/tags/3 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `204` with no body.
