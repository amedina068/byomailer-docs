---
title: Blocks
description: List, read, create, change and delete reusable HTML blocks.
order: 11
---

# Blocks

A block is a reusable piece of HTML. To put a block in an email, write `{{ block.<name> }}` in the content. BYOMailer replaces the placeholder with the HTML of the block when it sends the email. See [Templates and blocks](../using-byomailer/templates-and-blocks.md).

## The block object

| Field | Type | Description |
|---|---|---|
| `id` | integer | The block ID. |
| `uuid` | string | The block UUID. |
| `name` | string | The name that you use in the placeholder. |
| `html_content` | string | The HTML of the block. |
| `created_at` | string | The creation time. |
| `updated_at` | string | The time of the last change. |

## List blocks

`GET /api/v1/blocks`

Returns all the blocks of your account, newest first. This endpoint has no pagination.

```bash
curl https://byomailer.example/api/v1/blocks \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": [
    {
      "id": 4,
      "uuid": "6e1f2a3b-6666-4c3b-9d7e-1a2b3c4d5e6f",
      "name": "footer",
      "html_content": "<p>Example Inc, 1 Main Street, Springfield</p>",
      "created_at": "2026-01-20T09:00:00.000000Z",
      "updated_at": "2026-01-20T09:00:00.000000Z"
    }
  ]
}
```

## Get a block

`GET /api/v1/blocks/{blockId}`

| Path parameter | Type | Description |
|---|---|---|
| `blockId` | integer | The block ID. |

```bash
curl https://byomailer.example/api/v1/blocks/4 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`: a `data` object with the block.

## Create a block

`POST /api/v1/blocks`

| Body field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | Yes | 255 characters or fewer. Lowercase letters, digits and `_` only. Unique in your account. |
| `html_content` | string | Yes | Safe HTML. |

"Safe HTML" means that the HTML is valid and has no unsafe content. BYOMailer refuses these tags: `script`, `iframe`, `object`, `embed`, `form`, `input`, `textarea`, `select`, `button`, `applet`, `meta`, `link`, `base`, `svg`, `math`. It also refuses event attributes such as `onclick`, and `javascript:` and `vbscript:` URLs.

```bash
curl -X POST https://byomailer.example/api/v1/blocks \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"name": "footer", "html_content": "<p>Example Inc, 1 Main Street, Springfield</p>"}'
```

Response `201`: a `data` object with the block.

A name with other characters gets `422` with `The name may only contain lowercase letters, numbers, and underscores.`

## Change a block

`PATCH /api/v1/blocks/{blockId}`

The body fields are the same as for [Create a block](#create-a-block). Both fields are required.

```bash
curl -X PATCH https://byomailer.example/api/v1/blocks/4 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"name": "footer", "html_content": "<p>Example Inc, 2 Main Street, Springfield</p>"}'
```

Response `200`: the updated block.

If you change the name, update the `{{ block.<name> }}` placeholders that use the old name.

## Delete a block

`DELETE /api/v1/blocks/{blockId}`

```bash
curl -X DELETE https://byomailer.example/api/v1/blocks/4 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `204` with no body.
