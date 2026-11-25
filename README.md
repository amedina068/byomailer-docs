# BYOMailer documentation

This repository holds the documentation of BYOMailer, a self-hosted email marketing app that sends through the Amazon SES account of each account.

Each Markdown file is one page. The folder of a file is the section of the page.

The code of the app is in a separate repository. The docs describe that code, and the check script compares the pages with it.

## Pages

### Getting started

- [Introduction](getting-started/introduction.md)
- [Install with Docker](getting-started/installation-docker.md)
- [Install without Docker](getting-started/installation-manual.md)
- [Configuration](getting-started/configuration.md)
- [Connect AWS SES](getting-started/connect-aws-ses.md)
- [Send your first newsletter](getting-started/first-newsletter.md)
- [Upgrade BYOMailer](getting-started/upgrading.md)
- [Release notes](getting-started/release-notes.md)

### Self-hosting

- [Reverse proxy and TLS](self-hosting/reverse-proxy-and-tls.md)
- [SES events](self-hosting/ses-events.md)
- [Queues and Horizon](self-hosting/queues-and-horizon.md)
- [Scheduler](self-hosting/scheduler.md)
- [System mail](self-hosting/system-mail.md)
- [Storage](self-hosting/storage.md)
- [Backups](self-hosting/backups.md)
- [Accounts and registration](self-hosting/accounts-and-registration.md)
- [Recover access](self-hosting/recover-access.md)
- [Optional integrations](self-hosting/optional-integrations.md)
- [Troubleshooting](self-hosting/troubleshooting.md)

### Using BYOMailer

- [Contacts](using-byomailer/contacts.md)
- [Lists and topics](using-byomailer/lists-and-topics.md)
- [Tags and attributes](using-byomailer/tags-and-attributes.md)
- [Imports and exports](using-byomailer/imports-and-exports.md)
- [Segments and filters](using-byomailer/segments-and-filters.md)
- [Newsletters](using-byomailer/newsletters.md)
- [A/B tests](using-byomailer/ab-tests.md)
- [Sequences](using-byomailer/sequences.md)
- [Automations](using-byomailer/automations.md)
- [Templates and blocks](using-byomailer/templates-and-blocks.md)
- [Sender identities](using-byomailer/sender-identities.md)
- [Custom domains](using-byomailer/custom-domains.md)
- [Deliverability](using-byomailer/deliverability.md)
- [Unsubscribe and preferences](using-byomailer/unsubscribe-and-preferences.md)
- [Teams](using-byomailer/teams.md)
- [Webhooks](using-byomailer/webhooks.md)

### REST API

- [API overview](api/overview.md)
- [Authentication](api/authentication.md)
- [Filters](api/filters.md)
- [Contacts](api/contacts.md)
- [Lists](api/lists.md)
- [Topics](api/topics.md)
- [Tags](api/tags.md)
- [Newsletters](api/newsletters.md)
- [Sequences](api/sequences.md)
- [Email templates](api/email-templates.md)
- [Blocks](api/blocks.md)
- [Sender identities](api/email-identities.md)
- [Email logs](api/email-logs.md)
- [Projects](api/projects.md)
- [Webhook endpoints](api/webhooks.md)
- [OpenAPI and Postman](api/openapi.md)

### SDKs

- [SDKs](sdks/overview.md)

### MCP server

- [MCP server overview](mcp/overview.md)
- [Connect an MCP client](mcp/connect-clients.md)
- [MCP tools reference](mcp/tools-reference.md)

### Contributing to the app

- [Architecture](contributing/architecture.md)
- [Development setup](contributing/development-setup.md)
- [Testing](contributing/testing.md)
- [Release process](contributing/release-process.md)

## Write a page

1. Put the page in the folder of its section.
2. Give the file a short name in kebab case, for example `sender-identities.md`.
3. Start the file with front matter.
4. Write the page in Simple English. Read [CONTRIBUTING.md](CONTRIBUTING.md).
5. Add the page to the list in this README.
6. Run the checks.

### Front matter

Each page starts with three fields:

```yaml
---
title: Sequences
description: Send a series of emails to each contact, with a delay between the steps.
order: 8
---
```

| Field | What it does |
|---|---|
| `title` | The title of the page in the navigation and in the browser tab. |
| `description` | One sentence for the search results and the social cards. |
| `order` | An integer. It sets the position of the page in its section, from low to high. |

After the front matter, start the body with `# <title>`.

### Links

- Link to another page with a relative path and the `.md` extension, for example `[Backups](../self-hosting/backups.md)`.
- Link to a heading with its slug, for example `[Rate limits](api/overview.md#rate-limits)`.
- Use the example host `https://byomailer.example` in URLs of an instance.

## Run the checks

The check script needs Node 20 or later. It has no dependencies.

To check the front matter and the links only:

```bash
node scripts/check-docs.mjs
```

To also check the artisan commands, the environment variables and the API endpoints against the app, give the path of an app checkout:

```bash
BYOMAILER_APP_PATH=../byomailer node scripts/check-docs.mjs
```

The script then makes sure that:

- each `php artisan <command>` in a page exists in the app,
- each environment variable in the code of a page exists in `.env.example`, `config/`, the Docker files, `deploy/`, the tests or the CI of the app,
- each internal link and each anchor resolves.
- each endpoint on an API page (`GET /api/v1/...` and each `https://byomailer.example/api/v1/...` URL) is an operation or a path in `docs/api/openapi.yaml` of the app,
- each operation of `docs/api/openapi.yaml` is on an API page.

If the app checkout has no `docs/api/openapi.yaml`, the script skips the API endpoint check and prints a warning.

If the app checkout has a `vendor/` folder, the script reads the command list from `php artisan list`. If not, it reads the command signatures in `app/Console/Commands`.

The environment variable check reads each upper-case name with an underscore in code marks. Write an SES event name such as RENDERING_FAILURE without code marks, or the check reports it.

The CI runs the same script on each push and pull request. The CI clones the public app repository `amedina068/byomailer` and runs all the checks.

## Generate the MCP tools reference

`mcp/tools-reference.md` comes from the tool classes of the app. Do not edit it by hand. To make it again, run this command with an app checkout that has `vendor/`. Use PHP 8.4:

```bash
BYOMAILER_APP_PATH=../byomailer php scripts/generate-mcp-tools-reference.php > mcp/tools-reference.md
```

## Open questions

A line that starts with `TODO(owner):` is a question for the maintainer. The code did not give the answer. To list the open questions, run:

```bash
grep -rn "TODO(owner):" --include=*.md .
```
