---
title: API overview
description: The base URL, the request format, pagination, errors and rate limits of the BYOMailer REST API.
order: 1
---

# API overview

The REST API gives programmatic access to the data of your account. It covers contacts, lists, topics, tags, newsletters, sequences, templates, blocks, sender identities, email logs, projects and webhooks. Each request uses an API token. See [Authentication](authentication.md).

## Base URL

All endpoints are under `/api/v1` on the host of your instance:

```
https://byomailer.example/api/v1
```

The API answers only on the host of `APP_URL`. A request to a custom link domain or to another host gets `404`. See [Custom domains](../using-byomailer/custom-domains.md).

## Unversioned paths

A request to an unversioned path, for example `/api/contacts`, gets a `308 Permanent Redirect` to the same path under `/api/v1`. The redirect keeps the query string and the HTTP method. New code must use the `/api/v1` paths.

If you use curl with an old path, add `-L` to follow the redirect:

```bash
curl -L https://byomailer.example/api/contacts \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

## Request format

1. Send the token in the `Authorization: Bearer <your-token>` header.
2. Send `Accept: application/json` on each request.
3. For a `POST`, `PUT` or `PATCH` request with a body, send JSON with `Content-Type: application/json`.

Each error on an `/api` path is JSON, also when a request has no `Accept` header. Send the header to make the format of the response clear.

Each response body is JSON. A single record is in a `data` object. A list of records is in a `data` array.

```bash
curl https://byomailer.example/api/v1/lists \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

## Data scope

Each request acts for the user that owns the token. BYOMailer limits each query to the account of that user. Team members of the same account see the same contacts, lists, topics, tags, newsletters and sequences. A record of another account gets `404`, as if it does not exist.

The [webhook](webhooks.md) endpoints accept only a token of an admin.

## Cursor pagination

Most list endpoints use cursor pagination. They have no page numbers and no total count.

| Query parameter | Type | Description |
|---|---|---|
| `per_page` | integer | The number of records on each page. The default is `25`. The maximum is `100`. A larger value becomes `100`. |
| `cursor` | string | The value of `meta.next_cursor` or `meta.prev_cursor` from the previous response. |

The response has a `links` object and a `meta` object:

```json
{
  "data": [],
  "links": {
    "first": null,
    "last": null,
    "prev": null,
    "next": "https://byomailer.example/api/v1/contacts?cursor=eyJpZCI6MTAxLCJfcG9pbnRzVG9OZXh0SXRlbXMiOnRydWV9"
  },
  "meta": {
    "path": "https://byomailer.example/api/v1/contacts",
    "per_page": 25,
    "next_cursor": "eyJpZCI6MTAxLCJfcG9pbnRzVG9OZXh0SXRlbXMiOnRydWV9",
    "prev_cursor": null
  }
}
```

To read all the records:

1. Send the first request with no `cursor`.
2. Read `meta.next_cursor` in the response.
3. If `meta.next_cursor` is `null`, stop. You have the last page.
4. Send the same request again with `cursor=<meta.next_cursor>`.

These list endpoints return all the records in one response, with no pagination: `GET /tags`, `GET /lists/{listId}/topics` and `GET /blocks`.

## Status codes

| Code | Meaning |
|---|---|
| `200` | The request is complete. |
| `201` | BYOMailer created a record. |
| `202` | BYOMailer accepted the request and does the work in the queue (webhook test). |
| `204` | BYOMailer deleted the record. The body is empty. |
| `308` | The path is unversioned. Follow the `Location` header. |
| `401` | The token is missing, not valid, or refused. See [Authentication](authentication.md). |
| `403` | The token has no access for the request, or the user does not have the necessary role. See [Token abilities and expiry](authentication.md#token-abilities-and-expiry). |
| `404` | The record does not exist, or it belongs to another account. The message names the record and the ID, for example `No contact with ID 5 exists in this account.` |
| `422` | The input is not valid. Read the `errors` object. |
| `429` | You sent too many requests. See [Rate limits](#rate-limits). |

## Errors

An error response has a `message` field:

```json
{
  "message": "Unauthenticated."
}
```

A `422` response also has an `errors` object. Each key is a field name. Each value is a list of messages:

```json
{
  "message": "The name field is required.",
  "errors": {
    "name": [
      "The name field is required."
    ]
  }
}
```

For a field in an array, the key has the index, for example `filters.0.values`.

## Rate limits

Most endpoints have no rate limit. These endpoints have one:

| Endpoint | Limit | Counted for each |
|---|---|---|
| `POST /api/v1/newsletters/{newsletterId}/test-mail` | 5 requests each minute | user |
| `POST /api/v1/newsletters/contacts/preview` | 30 requests each minute | user |
| `POST /api/v1/webhook-endpoints/{webhookEndpointId}/test` | 10 requests each minute | account |

If you are over the limit, the response is `429`. The `Retry-After` header gives the number of seconds to wait.

## Interactive documentation

Each instance serves the OpenAPI document of the API. The pages do not need a login.

| Path | Content |
|---|---|
| `/docs/api` | An interactive API reference, made from the OpenAPI document. |
| `/docs/api.json` | The OpenAPI document as JSON. |
| `/documentation/api` | The API reference pages of the in-app documentation. |

The app repository also has the OpenAPI document and a Postman collection in `docs/api/`. See [OpenAPI and Postman](openapi.md) for the files, the import steps and how to make the files again.

## Other ways to use the data

The MCP server gives AI clients access to the same account data. See [MCP overview](../mcp/overview.md).
