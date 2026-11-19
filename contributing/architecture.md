---
title: Architecture
description: The stack, the folders and the main rules of the BYOMailer code, for contributors.
order: 1
---

# Architecture

BYOMailer is a Laravel app with an Inertia and Vue dashboard. Each account sends email through its own Amazon SES account. This page explains the parts of the code that a contributor must know before a change.

To install the app on your computer, read [Development setup](development-setup.md). To run the checks, read [Testing](testing.md).

## Stack

The versions come from `composer.json` and `package.json`.

| Part | Packages |
|---|---|
| Language | PHP 8.4. PHP 8.5 does not work. Read [Development setup](development-setup.md). |
| Framework | Laravel 13 (`laravel/framework`) |
| Dashboard | Inertia 3 (`inertiajs/inertia-laravel`, `@inertiajs/vue3`), Vue 3.5, Tailwind CSS 4, Vite 7 |
| Route helpers for the frontend | Laravel Wayfinder (`laravel/wayfinder`, `@laravel/vite-plugin-wayfinder`) |
| Authentication | Laravel Fortify for the login, Laravel Sanctum for API tokens |
| Queues | Laravel Horizon (Redis) |
| MCP server | Laravel MCP (`laravel/mcp`) |
| API documentation | Scramble (`dedoc/scramble`) makes the OpenAPI document. |
| AWS | `aws/aws-sdk-php`, `aws/aws-php-sns-message-validator` |
| Email editor | Tiptap 3 |
| Other | `spatie/laravel-medialibrary` (uploads), `maatwebsite/excel` (imports and exports), `geoip2/geoip2` (location of opens and clicks) |
| Tests | PHPUnit 12, Vitest 4 with `happy-dom` |
| Code style | Pint, ESLint 9, Prettier 3, `vue-tsc` |

Production uses MySQL and Redis. The tests and local development use SQLite.

## Folders

| Folder | Content |
|---|---|
| `app/Http/Controllers` | The controllers of the dashboard, the API (`Api/`) and the settings (`Settings/`) |
| `app/Http/Requests` | The FormRequests. They validate the input. |
| `app/Http/Resources` | The JSON resources of the API |
| `app/Http/Middleware` | The middleware, for example `RestrictHostToLinkRoutes` |
| `app/Models` | The Eloquent models. `app/Models/Concerns/BelongsToClient.php` is the tenant trait. |
| `app/Scopes` | `ClientScope` |
| `app/Services` | The logic that talks to AWS, Cloudflare and other services, and the send rules |
| `app/Jobs` | The queued jobs, for example `SendNewsletterChunkJob` and `ProcessSesEventJob` |
| `app/Events`, `app/Listeners` | The events and the listeners. Laravel finds the listeners in `app/Listeners`. |
| `app/Mail` | The mailables, for example `NewsletterMail` and `OptInMail` |
| `app/Mcp` | The MCP server, its tools and its traits |
| `app/Console/Commands` | The Artisan commands |
| `app/Support` | Helper classes, for example `ContentVariables` and `AutomationDefinition` |
| `routes/` | `web.php`, `settings.php`, `api.php`, `ai.php` (the MCP server) and `console.php` (the schedule) |
| `resources/js/pages` | The Inertia pages |
| `resources/js/components`, `composables`, `layouts` | The shared Vue code |
| `resources/js/actions`, `resources/js/routes`, `resources/js/wayfinder` | Route helpers that Wayfinder makes. Git ignores these folders. |
| `database/` | The migrations, the factories and the seeders |
| `tests/` | `Unit/`, `Feature/`, `Concerns/`, `Ssr/` and `load/`. Read [Testing](testing.md). |
| `public/docs/` | `openapi.json` and `api-documentation.md` |
| `deploy/` | Files for the Docker image |

## Multi-tenancy

A `Client` is an account. A `Client` has many users. Each resource model, for example a contact, a list or a newsletter, has a `client_id` column and uses the `BelongsToClient` trait.

`BelongsToClient` does two things:

- It adds the global scope `ClientScope`.
- When BYOMailer creates a record, it sets `client_id` from the logged-in user, if `client_id` is empty.

`ClientScope` adds `where client_id = <client of the logged-in user>` to each query. It does this only when a user is logged in.

WARNING: Do not trust `ClientScope` in a job, a webhook, a console command or a scheduled task. These have no logged-in user. The scope then does nothing, and a query returns the rows of every account.

In code without a logged-in user, obey these rules:

1. Start the query with `withoutGlobalScopes()`.
2. Filter by `client_id` yourself.
3. When you create a record, set `client_id` yourself.

The unsubscribe, preference and opt-in pages also have no logged-in user. Before they change data, make sure that the contact belongs to the same account as the email. `BackfillTopicSubscribersJob`, `ProcessSesEventJob` and `ProcessContactImportBatchJob` show the correct pattern.

A request with an API token and an MCP request have a logged-in user. There, `ClientScope` works.

## Send path

Each campaign email goes out through the SES account of the account that sends it.

| Class | Job |
|---|---|
| `UserMailerFactory::mailerFor($user)` | Builds a mailer with the SES credentials of the user. Use it for each campaign email. Do not use `Mail::to()`, which uses the mailer of the instance. |
| `EmailSendingGate::evaluate($user)` | Decides if the user can send. It blocks a deactivated user and an AWS account where SES paused sending. Read `->allowed`. |
| `SendableContentCheck::problems()` | Finds a blank subject or a blank body. These problems block a newsletter or a step from going live. |
| `SendableContentCheck::warnings()` | Finds content without `{{ unsubscribe_url }}` and an account without a postal address. These warnings never block a send. Show them to the user. |

If `mail.use_ses_api` is `false` (`MAIL_USE_SES_API`), `UserMailerFactory` uses the default mailer of the instance instead.

Newsletter chunks and sequence mails go through the `ses-sending` rate limiter. It uses Redis (`RateLimitedWithRedis`) and follows the send rate of the SES account.

If you add a new send path, gate it with `EmailSendingGate::evaluate()`. Run `SendableContentCheck::problems()` before a newsletter or a step goes live.

## SES event path

SES reports each event (send, delivery, open, click, bounce, complaint) through Amazon SNS. When an account connects AWS, BYOMailer creates an SNS topic in that AWS account. The `sns_topic_arn` column of `EmailCredential` stores the topic.

BYOMailer can receive the events in two ways:

| Path | How it works |
|---|---|
| SQS | The topic sends the events to the SQS queue in `SES_EVENTS_SQS_QUEUE_URL`. The `ses-events:poll` command reads the queue. |
| HTTP | SNS posts to `POST /webhooks/ses` (`SesWebhookController`). The controller accepts a message only one time, and only if AWS signed it, it comes from a known topic, and it is less than 24 hours old. |

Both paths dispatch `ProcessSesEventJob` on the `ses-events` queue. The job finds the accounts that own the topic. Then it looks for the contact mail in those accounts only. It handles the send, delivery, open, click, bounce, complaint, reject, rendering failure and delivery delay events.

For the operator view, read [SES events](../self-hosting/ses-events.md).

## Queues and the schedule

Horizon runs these queues: `default`, `newsletter`, `sequences`, `automations`, `ses-events`, `tracking-domains` and `webhooks`. `config/horizon.php` has the supervisors.

`routes/console.php` has the schedule. For example, `SendDueNewsletterContactMails` and `SendDueSequenceStepContactMails` run each minute. For the full list, read [Scheduler](../self-hosting/scheduler.md).

## Template variables

Email content uses `{{ variable }}` placeholders.

- The `Message` model stores the subject and the content of a newsletter, a sequence step or a list. It is polymorphic (`messageable`).
- The `DetectsTemplateVariables` trait finds the placeholders. The `ReplacesTemplateVariables` trait replaces them. Both are in `app/Support/`.
- The `BuildsFromContactMail` trait (`app/Mail/Concerns/`) holds the shared logic of `NewsletterMail` and `OptInMail`.
- `Contact::getTemplateAttribute()` reads a value from a column of the contact, then from `extra_attributes`.
- `Message::resolveTemplateData()` fills an empty value from the content variables of the newsletter or sequence, then from the attribute defaults of the account.
- `Message::templateData()` fills `unsubscribe_url`, `preferences_url` and `postal_address`. `OptInMail` adds `opt_in_url`.
- `content`, `unsubscribe_url`, `preferences_url` and `opt_in_url` are reserved names. The editor does not show them as variables that a user can set.

## Link domains

A sender identity can have a custom link domain, for example `links.example.com`. The unsubscribe and preference links of its email then use that host.

The `RestrictHostToLinkRoutes` middleware runs first on each request (`bootstrap/app.php`). On the host of `APP_URL`, it allows all routes. On a verified custom link domain, it allows only the paths in `RestrictHostToLinkRoutes::ALLOWED_PATHS`: `unsubscribe/*`, `one-click-unsubscribe/*`, `resubscribe/*`, `preferences/*`, `opt-in/*`, `build/*` and `up`. On any other host, it returns `404`.

If you add a route that a contact opens from an email, do these two steps:

1. Add its path to `RestrictHostToLinkRoutes::ALLOWED_PATHS`.
2. Build its URL with the host from `ContactMail::linkDomainHost()`. If that method returns `null`, use the host of `APP_URL`.

For a signed URL on a custom host, call `URL::forceRootUrl()` and `URL::forceScheme('https')`. Then set both back to `null`. `ContactMail::preferencesLink()` shows the pattern. Do not add a dashboard, auth or API route to `RestrictHostToLinkRoutes::ALLOWED_PATHS`.

For the user view, read [Custom domains](../using-byomailer/custom-domains.md).

## Rules for PHP code

- Do not add `declare(strict_types=1);`.
- Import each class with `use` at the top of the file. Do not write an inline fully-qualified name.
- Models use `protected $guarded = [];`. Validate input in a FormRequest.
- Give each method a return type and a type for each parameter.
- Put logic that talks to an external API in a service under `app/Services/`, not in a model.
- Give a non-CRUD action its own invokable controller. One controller method returns one type of response.
- Do not write SQL for one database engine. Build JSON expressions through the query grammar.
- Put a new listener in `app/Listeners` only. Laravel finds it there. `EventListenerRegistrationTest` counts the listeners of each event.

## API changes

Scramble makes the OpenAPI document from the controllers, the FormRequests and the resources. This document is the API contract. When you add or change an endpoint, do these steps:

1. Run `php artisan scramble:analyze`. It must report no errors.
2. Run `php artisan scramble:export`. Commit the new `public/docs/openapi.json`.
3. Update the Postman collection in `app/Http/Controllers/DocumentationPostmanController.php`.
4. Update `public/docs/api-documentation.md`.

For the API, read [API overview](../api/overview.md) and [OpenAPI](../api/openapi.md).

## Frontend rules

- Use Node 24.
- Obey the style guide of the app repository (the file STYLE_GUIDE.md): Phosphor icons, the `bm-*` CSS variables, a maximum radius of 6px, and JetBrains Mono for numbers.
- When a deferred prop loads on a page, show a skeleton until it arrives.
