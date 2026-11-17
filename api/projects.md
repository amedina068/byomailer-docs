---
title: Projects
description: List, read, create, rename and delete projects, which group newsletters, sequences and automations.
order: 14
---

# Projects

A project groups newsletters, sequences and automations. To put a newsletter in a project, send `project_ids` to the [newsletter endpoints](newsletters.md). To list the newsletters or sequences of a project, use the `project` query parameter of [newsletters](newsletters.md) or [sequences](sequences.md).

## The project object

| Field | Type | Description |
|---|---|---|
| `id` | integer | The project ID. |
| `uuid` | string | The project UUID. |
| `name` | string | The name. |
| `newsletters_count` | integer | The number of newsletters. Only in the list and get responses. |
| `sequences_count` | integer | The number of sequences. Only in the list and get responses. |
| `automations_count` | integer | The number of automations. Only in the list and get responses. |
| `visual_automations_count` | integer | The number of visual automations. Only in the list and get responses. |
| `created_at` | string | The creation time. |

## List projects

`GET /api/v1/projects`

Returns the projects of your account, newest first. Cursor pagination.

| Query parameter | Type | Description |
|---|---|---|
| `per_page` | integer | `1` or more. A value more than `100` becomes `100`. The default is `25`. |
| `cursor` | string | The cursor of the next or previous page. |

```bash
curl https://byomailer.example/api/v1/projects \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`:

```json
{
  "data": [
    {
      "id": 2,
      "uuid": "8b7c6d5e-7777-4c3b-9d7e-1a2b3c4d5e6f",
      "name": "Spring launch",
      "newsletters_count": 3,
      "sequences_count": 1,
      "automations_count": 0,
      "visual_automations_count": 0,
      "created_at": "2026-02-01T09:00:00.000000Z"
    }
  ],
  "links": { "first": null, "last": null, "prev": null, "next": null },
  "meta": {
    "path": "https://byomailer.example/api/v1/projects",
    "per_page": 25,
    "next_cursor": null,
    "prev_cursor": null
  }
}
```

## Get a project

`GET /api/v1/projects/{projectId}`

| Path parameter | Type | Description |
|---|---|---|
| `projectId` | integer | The project ID. |

```bash
curl https://byomailer.example/api/v1/projects/2 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `200`: a `data` object with the project and its counts.

## Create a project

`POST /api/v1/projects`

| Body field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | Yes | 255 characters or fewer. Unique in your account. The comparison ignores case. |

```bash
curl -X POST https://byomailer.example/api/v1/projects \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"name": "Spring launch"}'
```

Response `201`: a `data` object with the project, without the counts.

A name that already exists gets `422` with `A project with this name already exists.`

## Rename a project

`PATCH /api/v1/projects/{projectId}`

The body fields are the same as for [Create a project](#create-a-project).

```bash
curl -X PATCH https://byomailer.example/api/v1/projects/2 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"name": "Spring launch 2026"}'
```

Response `200`: the project, without the counts.

## Delete a project

`DELETE /api/v1/projects/{projectId}`

```bash
curl -X DELETE https://byomailer.example/api/v1/projects/2 \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

Response `204` with no body.
