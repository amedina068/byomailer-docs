---
title: Email templates
description: List and read the email templates of your account.
order: 10
---

# Email templates

A template is the HTML layout around the content of a newsletter or a step. See [Templates and blocks](../using-byomailer/templates-and-blocks.md) for the concepts.

The template endpoints are read-only. Use the dashboard to create, change or archive a template. To use a template in a newsletter, send its ID as `email_template_id`. See [Newsletters](newsletters.md).

## The template object

| Field | Type | Description |
|---|---|---|
| `id` | integer | The template ID. |
| `name` | string | The name. |
| `html_content` | string | The HTML of the template. |
| `is_default` | boolean | `true` if this is the default template of the account. |
| `archived_at` | string or null | The time of the archive, or `null`. |
| `created_at` | string | The creation time. |
| `updated_at` | string | The time of the last change. |

## List templates

`GET /api/v1/email-templates`

Returns the templates of your account, newest first. Cursor pagination. By default, the list has only templates that are not archived.

| Query parameter | Type | Description |
|---|---|---|
| `archived` | boolean | If `true`, the list has only archived templates. The default is `false`. |
| `is_default` | boolean | If set, the list has only templates with this `is_default` value. |
| `per_page` | integer | `1` or more. A value more than `100` becomes `100`. The default is `25`. |
| `cursor` | string | The cursor of the next or previous page. |

```bash
curl "https://byomailer.example/api/v1/email-templates?archived=false" \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": [
    {
      "id": 5,
      "name": "Brand layout",
      "html_content": "<html><body><div>{{ content }}</div><a href=\"{{ unsubscribe_url }}\">Unsubscribe</a></body></html>",
      "is_default": true,
      "archived_at": null,
      "created_at": "2026-01-05T09:00:00.000000Z",
      "updated_at": "2026-01-05T09:00:00.000000Z"
    }
  ],
  "links": { "first": null, "last": null, "prev": null, "next": null },
  "meta": {
    "path": "https://byomailer.example/api/v1/email-templates",
    "per_page": 25,
    "next_cursor": null,
    "prev_cursor": null
  }
}
```

## Get the default template

`GET /api/v1/email-templates/default`

Returns the default template of your account. It must not be archived. If the account has no default template, the response is `404`.

```bash
curl https://byomailer.example/api/v1/email-templates/default \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`: a `data` object with the template.

## Get a template

`GET /api/v1/email-templates/{emailTemplateId}`

Returns one template. Archived templates are included.

| Path parameter | Type | Description |
|---|---|---|
| `emailTemplateId` | integer | The template ID. |

```bash
curl https://byomailer.example/api/v1/email-templates/5 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`: a `data` object with the template.
