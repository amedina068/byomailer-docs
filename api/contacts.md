---
title: Contacts
description: List, read, create, update and unsubscribe contacts, and add or remove them from lists.
order: 4
---

# Contacts

A contact is one email address in your account. See [Contacts](../using-byomailer/contacts.md) for the concepts.

The API has no endpoint that deletes a contact.

## The contact object

| Field | Type | Description |
|---|---|---|
| `id` | integer | The contact ID. |
| `uuid` | string | The contact UUID. |
| `name` | string or null | The name. |
| `email` | string | The email address. |
| `extra_attributes` | object | The custom attributes. |
| `unsubscribed_at` | string or null | The time of the unsubscribe, or `null`. |
| `unsubscribed_by_contact` | boolean | `true` if the contact unsubscribed itself. |
| `tags` | array | The tags: `id`, `uuid`, `name`, `created_at`. |
| `lists` | array | The lists: `id`, `uuid`, `name`, `opt_in_enabled`, `created_at`. |
| `topics` | array | The topics that the contact is subscribed to: `id`, `uuid`, `list_id`, `name`, `description`, `created_at`. |
| `sequences` | array | The sequences of the contact: `id`, `name`, `status`. |
| `created_at` | string | The creation time. |

## List contacts

`GET /api/v1/contacts`

Returns the contacts of your account, newest first. Cursor pagination. See [API overview](overview.md#cursor-pagination).

| Query parameter | Type | Description |
|---|---|---|
| `lists[]` | integer | A list ID. The contact must be on one or more of the lists. |
| `tags[]` | integer | A tag ID. The contact must have one or more of the tags. |
| `topics[]` | integer | A topic ID. The contact must be subscribed to one or more of the topics. |
| `search` | string | A part of the name or of the email address. |
| `include_unsubscribed` | boolean | If `true`, the response also has unsubscribed contacts. The default is `false`. |
| `per_page` | integer | From `1` to `100`. The default is `25`. |
| `cursor` | string | The cursor of the next or previous page. |

Here, `tags[]` takes tag IDs. The [filter format](filters.md) takes tag names.

```bash
curl "https://byomailer.example/api/v1/contacts?lists[]=1&search=example.com&per_page=50" \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": [
    {
      "id": 1,
      "uuid": "9b1c6d1e-2f4a-4c3b-9d7e-1a2b3c4d5e6f",
      "name": "Ana Lopez",
      "email": "ana@example.com",
      "extra_attributes": { "company": "Example Inc" },
      "unsubscribed_at": null,
      "unsubscribed_by_contact": false,
      "tags": [
        { "id": 3, "uuid": "5d2e8a90-1111-4c3b-9d7e-1a2b3c4d5e6f", "name": "customer", "created_at": "2026-01-10T08:00:00.000000Z" }
      ],
      "lists": [
        { "id": 1, "uuid": "7f3a2b10-2222-4c3b-9d7e-1a2b3c4d5e6f", "name": "Weekly", "opt_in_enabled": false, "created_at": "2026-01-10T08:00:00.000000Z" }
      ],
      "topics": [],
      "sequences": [
        { "id": 7, "name": "Onboarding", "status": "live" }
      ],
      "created_at": "2026-01-15T10:30:00.000000Z"
    }
  ],
  "links": { "first": null, "last": null, "prev": null, "next": null },
  "meta": {
    "path": "https://byomailer.example/api/v1/contacts",
    "per_page": 50,
    "next_cursor": null,
    "prev_cursor": null
  }
}
```

## Get a contact

`GET /api/v1/contacts/{contactId}`

Returns one contact. The response has unsubscribed contacts too.

| Path parameter | Type | Description |
|---|---|---|
| `contactId` | integer | The contact ID. |

```bash
curl https://byomailer.example/api/v1/contacts/1 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`: a `data` object with the contact.

## Add a contact to a list

`POST /api/v1/lists/{listId}/contacts`

Creates a contact, or updates the contact that has the same email address. Then it adds the contact to the list.

| Path parameter | Type | Description |
|---|---|---|
| `listId` | integer | The list ID. |

| Body field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | Yes | A valid email address. |
| `name` | string or null | No | 255 characters or fewer. |
| `tags` | array of strings | No | Tag names to add. Each name has 255 characters or fewer. BYOMailer creates a tag that does not exist. |
| `remove_tags` | array of strings | No | Tag names to remove. Each name has 255 characters or fewer. BYOMailer ignores a name that has no tag. |
| any other key | any JSON value | No | BYOMailer stores the key and its value as a custom attribute in `extra_attributes`. |

A tag name in `tags` and in `remove_tags` is an error. The comparison ignores case and spaces at the start and end.

```bash
curl -X POST https://byomailer.example/api/v1/lists/1/contacts \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ana@example.com",
    "name": "Ana Lopez",
    "tags": ["customer"],
    "company": "Example Inc",
    "plan": "pro"
  }'
```

Response: `201` with the contact if BYOMailer created it. `200` with the contact if it already existed.

What BYOMailer does:

- For an existing contact, it merges the new custom attributes with the old ones. A key that you send replaces the old value of that key.
- If the list needs opt-in, BYOMailer queues the opt-in email. Else it marks the contact as opted in to the list.
- If the contact is unsubscribed and did not unsubscribe itself, BYOMailer resubscribes it.
- If the contact unsubscribed itself, it stays unsubscribed.
- If the email address is on the blacklist, a new contact gets `422` with `This email address has been blacklisted.` An existing contact stays unsubscribed.

See [Unsubscribe and preferences](../using-byomailer/unsubscribe-and-preferences.md) and [Tags and attributes](../using-byomailer/tags-and-attributes.md).

## Update a contact

`PATCH /api/v1/contacts/{contactId}`

`PUT /api/v1/contacts/{contactId}`

Changes the fields that you send. The body fields are the same as for [Add a contact to a list](#add-a-contact-to-a-list), but `email` is optional. A new `email` must not belong to another contact of your account.

```bash
curl -X PATCH https://byomailer.example/api/v1/contacts/1 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["vip"],
    "remove_tags": ["trial"],
    "plan": "enterprise"
  }'
```

Response `200`: the updated contact.

The resubscribe and blacklist rules of the create call also apply here.

`PUT` and `PATCH` do the same partial update. You can send the current `email` of the contact. The request does not get `422` for it.

## Unsubscribe a contact

`POST /api/v1/contacts/{contactId}/unsubscribe`

Marks the contact as unsubscribed by your account. If the contact is already unsubscribed, BYOMailer keeps the first `unsubscribed_at` time. It sets `unsubscribed_by_contact` to `false`. The request has no body.

```bash
curl -X POST https://byomailer.example/api/v1/contacts/1/unsubscribe \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`: the contact.

Because `unsubscribed_by_contact` is `false`, a later create or update call resubscribes the contact.

## Remove a contact from a list

`DELETE /api/v1/lists/{listId}/contacts/{contactId}`

Removes the contact from one list. The contact stays in your account and on its other lists.

```bash
curl -X DELETE https://byomailer.example/api/v1/lists/1/contacts/1 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`: the contact, with its remaining lists.
