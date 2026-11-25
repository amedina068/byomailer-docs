---
title: Link clicks
description: Read the clicks of each link of a newsletter or a sequence step, and the contacts who clicked one link.
order: 9
---

# Link clicks

These endpoints report who clicked which link in a newsletter or a sequence step. See [Link clicks](../using-byomailer/link-clicks.md) for named links and the report.

- A **named link** has a `data-bm-link` attribute on its `<a>` tag, for example `<a href="https://example.com/sale" data-bm-link="black-friday">`. It groups its clicks by its name.
- A link without a name groups by its URL without the `utm_*` parameters and without the `#fragment`.
- Each link has a **link key**: `name:<link name>` or `url:<url>`. Send the key to the contacts endpoint.
- `click_rate` is the unique contacts divided by the delivered mails, times 100. If no mail is delivered, it is `null`.
- BYOMailer does not filter bot clicks. The clicks can include link scanners, for example Microsoft Safe Links.

A read-only API token can read these endpoints. A newsletter or a step of another account gives `404`.

## List the links of a newsletter

`GET /api/v1/newsletters/{newsletterId}/links`

Returns the links of the newsletter with their clicks. The links with the most unique contacts come first.

| Field | Type | Description |
|---|---|---|
| `delivered` | integer | The number of delivered mails. |
| `links[].key` | string | The link key. |
| `links[].name` | string or null | The link name, or `null` for a link without a name. |
| `links[].url` | string or null | The URL without `utm_*` parameters. For a named link, the URL with the most clicks. |
| `links[].unique_contacts` | integer | The number of contacts who clicked the link. |
| `links[].total_clicks` | integer | All clicks on the link, also repeated clicks. |
| `links[].click_rate` | number or null | The click rate, rounded to 2 decimals. |

```bash
curl https://byomailer.example/api/v1/newsletters/12/links \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": {
    "delivered": 3,
    "links": [
      {
        "key": "name:black-friday",
        "name": "black-friday",
        "url": "https://example.com/sale",
        "unique_contacts": 2,
        "total_clicks": 3,
        "click_rate": 66.67
      },
      {
        "key": "url:https://example.com/blog",
        "name": null,
        "url": "https://example.com/blog",
        "unique_contacts": 1,
        "total_clicks": 1,
        "click_rate": 33.33
      }
    ]
  }
}
```

## List the contacts who clicked a link of a newsletter

`GET /api/v1/newsletters/{newsletterId}/links/contacts`

Returns the contacts who clicked one link, with cursor pagination.

| Query parameter | Type | Description |
|---|---|---|
| `link` | string | Required. A link key from the link list, for example `name:black-friday` or `url:https://example.com/blog`. |
| `per_page` | integer | 1 to 200. The default is 50. |
| `cursor` | string | The `meta.next_cursor` of the previous page. |

| Field | Type | Description |
|---|---|---|
| `contact_mail_id` | integer | The mail that the contact received. |
| `contact_id` | integer | The contact. |
| `email` | string | The email address of the contact. |
| `name` | string or null | The name of the contact. |
| `clicks` | integer | The number of clicks of the contact on this link. |
| `first_clicked_at` | string or null | The time of the first click on this link (ISO 8601). |

```bash
curl "https://byomailer.example/api/v1/newsletters/12/links/contacts?link=name:black-friday&per_page=50" \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": [
    {
      "contact_mail_id": 9081,
      "contact_id": 42,
      "email": "ana@example.com",
      "name": "Ana",
      "clicks": 2,
      "first_clicked_at": "2026-10-27T14:05:12+00:00"
    }
  ],
  "links": { "first": null, "last": null, "prev": null, "next": null },
  "meta": {
    "path": "https://byomailer.example/api/v1/newsletters/12/links/contacts",
    "per_page": 50,
    "next_cursor": null,
    "prev_cursor": null
  }
}
```

If `link` is missing or does not start with `name:` or `url:`, the API returns `422` with the error `The link must be a key from the link list.`

## List the links of a sequence step

`GET /api/v1/sequences/{sequenceId}/steps/{sequenceStepId}/links`

Returns the links of the step with their clicks. The response has the same shape as [List the links of a newsletter](#list-the-links-of-a-newsletter).

```bash
curl https://byomailer.example/api/v1/sequences/7/steps/31/links \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

## List the contacts who clicked a link of a sequence step

`GET /api/v1/sequences/{sequenceId}/steps/{sequenceStepId}/links/contacts`

Returns the contacts who clicked one link of the step, with cursor pagination. The query parameters and the response have the same shape as [List the contacts who clicked a link of a newsletter](#list-the-contacts-who-clicked-a-link-of-a-newsletter).

```bash
curl "https://byomailer.example/api/v1/sequences/7/steps/31/links/contacts?link=name:pricing" \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

A step that is not in the sequence gives `404`.
