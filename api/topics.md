---
title: Topics
description: List, create, change and delete the topics of a list.
order: 6
---

# Topics

A topic is a subject inside a list. A contact can unsubscribe from one topic and stay on the list. See [Lists and topics](../using-byomailer/lists-and-topics.md) for the concepts.

The topic endpoints accept only a list that the token user made. For a list of another team member, the API returns `404`.

## The topic object

| Field | Type | Description |
|---|---|---|
| `id` | integer | The topic ID. |
| `uuid` | string | The topic UUID. |
| `list_id` | integer | The ID of the list of the topic. |
| `name` | string | The name. |
| `description` | string or null | The description. |
| `created_at` | string | The creation time. |

## List the topics of a list

`GET /api/v1/lists/{listId}/topics`

Returns all the topics of the list, newest first. This endpoint has no pagination.

| Path parameter | Type | Description |
|---|---|---|
| `listId` | integer | The list ID. |

```bash
curl https://byomailer.example/api/v1/lists/1/topics \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": [
    {
      "id": 12,
      "uuid": "3c9d0e21-3333-4c3b-9d7e-1a2b3c4d5e6f",
      "list_id": 1,
      "name": "Product updates",
      "description": "New features and fixes.",
      "created_at": "2026-01-15T10:30:00.000000Z"
    }
  ]
}
```

## Create a topic

`POST /api/v1/lists/{listId}/topics`

| Body field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | Yes | 255 characters or fewer. Unique in the list. |
| `description` | string or null | No | 1000 characters or fewer. |

```bash
curl -X POST https://byomailer.example/api/v1/lists/1/topics \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"name": "Events", "description": "Webinars and meetups."}'
```

Response `201`: a `data` object with the topic.

After BYOMailer creates the topic, a queued job subscribes all the current contacts of the list to the new topic.

## Change a topic

`PATCH /api/v1/lists/{listId}/topics/{topicId}`

| Path parameter | Type | Description |
|---|---|---|
| `listId` | integer | The list ID. |
| `topicId` | integer | The topic ID. |

The body fields are the same as for [Create a topic](#create-a-topic). `name` is required.

If you do not send `description`, BYOMailer sets it to `null`.

```bash
curl -X PATCH https://byomailer.example/api/v1/lists/1/topics/12 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"name": "Product news", "description": "New features."}'
```

Response `200`: the updated topic.

## Delete a topic

`DELETE /api/v1/lists/{listId}/topics/{topicId}`

```bash
curl -X DELETE https://byomailer.example/api/v1/lists/1/topics/12 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `204` with no body.
