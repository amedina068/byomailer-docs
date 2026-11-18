---
title: OpenAPI and Postman
description: Find the OpenAPI document and the Postman files of the API, import them into Postman, Insomnia or Bruno, and make them again.
order: 16
---

# OpenAPI and Postman

The API has a machine-readable description in two formats: an OpenAPI document and a Postman collection. Use them to make a client, to test the API, or to load the API into a tool.

## The files

The app repository has these files in `docs/api/`:

| File | Content |
|---|---|
| `docs/api/openapi.yaml` | The OpenAPI 3.1 document. It has each endpoint, with a summary, a description, the parameters, the request body, the responses and the error responses. |
| `docs/api/postman_collection.json` | A Postman v2.1 collection, with one folder for each tag of the document. |
| `docs/api/postman_environment.json` | A Postman environment with the `baseUrl` and `token` variables. |

`public/docs/openapi.json` has the same OpenAPI document as JSON.

The `dedoc/scramble` package makes the OpenAPI document from the code. It reads the routes, the controllers, the form requests and the API resources. The document is the contract of the API. CI makes the files again on each pull request, and fails when a committed file is not current.

The tags of the document are: Contacts, Lists, Topics, Tags, Newsletters, Sequences, Blocks, Email templates, Email identities, Email logs, Projects and Webhooks.

## The document on an instance

Each instance also serves the document. These pages do not need a login.

| Path | Content |
|---|---|
| `/docs/api` | An interactive reference made from the document. |
| `/docs/api.json` | The document, made at request time from the current code. |
| `/documentation/openapi` | A download of `public/docs/openapi.json`, as `byomailer-openapi-schema.json`. |

The files in the repository use `https://byomailer.example` as the host. The `/documentation/openapi` route replaces that host with your `APP_URL`. If the static file does not exist, the route runs `php artisan scramble:export` first.

The `API_VERSION` environment variable sets `info.version` in the document. The default is `1.0.0`.

## The variables

The collection and the environment have two variables:

| Variable | Placeholder value | Set it to |
|---|---|---|
| `baseUrl` | `https://app.example.com` | The URL of your instance, without `/api/v1`. For example `https://mail.example.com`. |
| `token` | `YOUR_API_TOKEN` | An API token. See [Authentication](authentication.md). |

Each request URL starts with `{{baseUrl}}/api/v1`. The collection sends `token` as a bearer token on each request.

WARNING: Do not share or export a collection or an environment that contains your token. The token gives access to the data of your account.

## Import into Postman

1. Get `postman_collection.json` and `postman_environment.json` from `docs/api/` of the app repository.
2. In Postman, click **Import**.
3. Select the two files.
4. Open **Environments** and select the **BYOMailer** environment.
5. Set `baseUrl` to the URL of your instance.
6. Set `token` to your API token. Keep the type **secret**.
7. In the environment selector at the top right, select **BYOMailer**.
8. Open a folder of the collection and send a request.

Each request in the collection has its optional query parameters turned off. Turn on a parameter before you use it.

## Import into Insomnia

1. Get `postman_collection.json` from `docs/api/` of the app repository.
2. In Insomnia, click **Import**.
3. Select the file. Insomnia makes a collection from it.
4. Open the base environment of the collection.
5. Set `baseUrl` to the URL of your instance.
6. Set `token` to your API token.
7. Send a request.

Insomnia can also import `openapi.yaml`. Then Insomnia makes its own variables from the `servers` section, and the request URLs end in `/api/v1`. Use the Postman collection to keep the variables of this page.

## Import into Bruno

1. Get `postman_collection.json` from `docs/api/` of the app repository.
2. In Bruno, click **Import Collection**.
3. Select **Postman Collection**, then select the file.
4. Select a folder for the new collection.
5. Open the collection settings, then **Vars**.
6. Set `baseUrl` to the URL of your instance.
7. Set `token` to your API token.
8. Send a request.

To keep the token out of the collection files, put `token` in a Bruno environment and mark it as secret.

## The Postman collection of the dashboard

The dashboard has its own collection. It is not the same file as `docs/api/postman_collection.json`.

`GET /documentation/postman` downloads `byomailer-postman-collection.json`. You can also click **Download Postman Collection** in **Settings**, **API Tokens**. This collection has one folder for each resource and two collection variables:

| Variable | Value |
|---|---|
| `base_url` | The `APP_URL` of the instance. |
| `api_token` | Empty. Put your API token here. |

## The Markdown reference

`GET /byomailer-docs.md` returns the file `public/docs/api-documentation.md` as Markdown. It has request and response examples for each endpoint. The route replaces `https://byomailer.example` with your `APP_URL`.

## Make the files again

If you add or change an API endpoint, make the files again in a development checkout of the app:

1. Go to the folder of the app.
2. Run the migrations. Scramble reads the column types from the database.
3. Run `php artisan scramble:analyze`.
4. If the command reports errors, correct them. Then run it again.
5. Run `composer api-docs`.
6. Read the diff of `docs/api/` and `public/docs/openapi.json`.
7. Make sure that the diff has the new or changed endpoint, with its parameters, body and responses.
8. Commit the files with your change.

```bash
php artisan migrate
php artisan scramble:analyze
composer api-docs
git diff docs/api public/docs/openapi.json
```

`composer api-docs` runs two commands:

- `php artisan byomailer:openapi` writes `docs/api/openapi.yaml` and `public/docs/openapi.json`. The files use `https://byomailer.example` as the host, not your `APP_URL`.
- `php artisan byomailer:postman` writes the collection and the environment. It runs a pinned version of `openapi-to-postmanv2` with `npx`, so it needs Node and network access the first time.

Do not run `php artisan scramble:export` for a commit. That command writes the host of your `APP_URL` into the file.

Run these commands in a development checkout of the app, not in a Docker container. The `docker-compose.yml` file does not mount the source code into the containers. So a file that you make in a container does not reach your checkout. See [Installation with Docker](../getting-started/installation-docker.md).
