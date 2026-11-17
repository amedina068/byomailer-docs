---
title: OpenAPI and Postman
description: Get the OpenAPI document and the Postman collection of the API, and make the static OpenAPI file again.
order: 16
---

# OpenAPI and Postman

Each instance serves a machine-readable description of the API in two formats: an OpenAPI document and a Postman collection. Use them to make a client, to test the API, or to load the API into a tool.

## The OpenAPI document

The `dedoc/scramble` package makes the OpenAPI 3 document from the code. It reads the routes, the controllers, the form requests and the API resources. The document is the contract of the API.

| Path | Content | Login |
|---|---|---|
| `/docs/api` | An interactive reference made from the document. | Not necessary |
| `/docs/api.json` | The document, made at request time from the current code. | Not necessary |
| `/documentation/openapi` | A download of the static file `public/docs/openapi.json`, as `byomailer-openapi-schema.json`. | Not necessary |

The server URL in the document is `/api/v1` on the host of `APP_URL`. The document does not have the unversioned redirect route.

The static file uses `https://byomailer.example` as the host. The `/documentation/openapi` route replaces that host with your `APP_URL`. If the static file does not exist, the route runs `php artisan scramble:export` first.

The `API_VERSION` environment variable sets `info.version` in the document. The default is `1.0.0`.

## The Postman collection

`GET /documentation/postman` downloads `byomailer-postman-collection.json`. You can also click **Download Postman Collection** in **Settings**, **API Tokens**.

The collection has one folder for each resource. It uses bearer authentication and two collection variables:

| Variable | Value |
|---|---|
| `base_url` | The `APP_URL` of the instance. |
| `api_token` | Empty. Put your API token here. |

To use the collection:

1. Download the collection.
2. Import the file into Postman.
3. In the collection variables, set `api_token` to your API token.
4. If the value of `base_url` is not the URL of your instance, correct it.
5. Send a request from a folder.

WARNING: Do not share or export a Postman collection that contains your token. The token gives full access to your account.

## The Markdown reference

`GET /byomailer-docs.md` returns the file `public/docs/api-documentation.md` as Markdown. It has request and response examples for each endpoint. The route replaces `https://byomailer.example` with your `APP_URL`.

## Make the static OpenAPI file again

The runtime document at `/docs/api.json` changes with the code. The static file `public/docs/openapi.json` does not. If you add or change an API endpoint, make the static file again:

1. Go to the folder of the app.
2. Run `php artisan scramble:analyze`.
3. If the command reports errors, correct them. Then run it again.
4. Run `php artisan scramble:export`.
5. Read the diff of `public/docs/openapi.json`.
6. Make sure that the diff has the new or changed endpoint, with its parameters, body and response.
7. Update the Postman collection, `public/docs/api-documentation.md` and the API reference page of the in-app documentation.
8. Commit `public/docs/openapi.json` with your change.

```bash
php artisan scramble:analyze
php artisan scramble:export
git diff public/docs/openapi.json
```

Run these commands in a development checkout of the app, not in a Docker container. The `docker-compose.yml` file does not mount the source code into the containers. So a file that you export in a container does not reach your checkout. See [Installation with Docker](../getting-started/installation-docker.md).
