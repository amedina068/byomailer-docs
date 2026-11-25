---
title: SDKs
description: Install and use the BYOMailer SDKs for JavaScript and TypeScript, PHP, Python and Ruby.
order: 1
---

# SDKs

BYOMailer has SDKs for JavaScript and TypeScript, PHP, Python and Ruby. Each SDK is a client for the [REST API](../api/overview.md) of one BYOMailer instance. This page describes version 0.2.0 of each SDK.

The status of the SDKs:

- Version 0.2.0 is not released. No version tag exists.
- Each SDK repository on GitHub is public.
- No SDK is on a package registry yet. There is no package on npm, Packagist, PyPI or RubyGems.
- Each SDK uses the [MIT license](#license).

| Language | Repository | Package name |
|---|---|---|
| JavaScript and TypeScript | `amedina068/byomailer-js` | `byomailer` |
| PHP | `amedina068/byomailer-php` | `byomailer/byomailer-php` |
| Python | `amedina068/byomailer-python` | `byomailer` |
| Ruby | `amedina068/byomailer-ruby` | `byomailer` |

## What the SDKs share

The four SDKs have the same design and the same behavior. The method names follow the style of each language, with the same argument order.

- **One instance.** The client takes the URL of your instance, for example `https://mail.example.com`, and adds `/api/v1`. No SDK has a default URL, because each user runs their own instance.
- **One token.** The client sends a personal [API token](../api/authentication.md) as `Authorization: Bearer <token>`. A read-only token gets a 403 error on each call that changes data.
- **All operations.** Each SDK covers each operation of the API: contacts, lists, topics, tags, newsletters, sequences, blocks, email templates, email identities, email logs, projects and webhook endpoints.
- **Admin calls.** Only a token of an admin user can use the webhook endpoint calls. Other tokens get a 403 error.
- **Custom attributes.** You give the custom attributes of a contact as one map. The SDK sends each key at the top level of the request body, as the [API](../api/contacts.md#add-a-contact-to-a-list) expects. The keys `email`, `name`, `tags` and `remove_tags` are not allowed in this map.
- **New or existing contact.** When you add a contact to a list, the result tells you if the contact is new (HTTP 201) or existing (HTTP 200).
- **CSV export.** The export of the mails of a sequence step returns the CSV text, not JSON.
- **Cursor pagination.** The SDK reads one page, or walks all pages. `per_page` is 1 to 100. The default is 25.
- **Typed errors.** Each SDK has one error class for each HTTP status group, and one for a connection failure.
- **Timeout.** One attempt has a time limit of 30 seconds.
- **Retries.** The SDK retries a 429 and a connection error before the send for each call. It retries a 5xx, a read timeout or a reset after the send only for an [idempotent call](#retries). The default is 2 retries, with exponential backoff and jitter.
- **Webhook verification.** A server-side helper verifies the signature and the timestamp of a [webhook](../api/webhooks.md) delivery. It returns the same fields and the same failure reasons in the four SDKs.
- **No telemetry.** The SDKs send no data to other hosts. The JavaScript, Python and Ruby SDKs have no runtime dependencies.

The SDKs differ in some details, for example the names of the error classes and the pagination helpers. Each section below tells where they differ.

## Install from git

Each command below installs the newest commit of the `main` branch.

### JavaScript and TypeScript

```bash
npm install github:amedina068/byomailer-js
```

The package has a `prepare` script. During the install, npm builds the files in `dist/`. For Bun, use `bun add github:amedina068/byomailer-js`.

### PHP

Add the GitHub repository to the `composer.json` file of your project:

```json
{
    "repositories": [
        { "type": "vcs", "url": "https://github.com/amedina068/byomailer-php" }
    ]
}
```

Then install the package from the `main` branch:

```bash
composer require byomailer/byomailer-php:dev-main
```

Give `:dev-main`, because the repository has no version tag.

The repository is public, so Composer needs no token.

The SDK sends requests through a PSR-18 HTTP client. If your project has no PSR-18 client, install Guzzle:

```bash
composer require guzzlehttp/guzzle
```

### Python

```bash
pip install "git+https://github.com/amedina068/byomailer-python.git"
```

With uv, use this command:

```bash
uv add "git+https://github.com/amedina068/byomailer-python.git"
```

### Ruby

Add the gem to your Gemfile:

```ruby
gem "byomailer", github: "amedina068/byomailer-ruby"
```

Then run `bundle install`.

## Requirements

| Language | Runtime versions | Framework integration | Dependencies |
|---|---|---|---|
| JavaScript and TypeScript | Node.js 20, 22 and 24. Bun 1.x and Deno 2.x (smoke test only). Cloudflare Workers (no test in CI). | Examples for Next.js and Express | None. The SDK uses the global `fetch` and Web Crypto. |
| PHP | PHP 8.2, 8.3 and 8.4 | Laravel 11, 12 and 13. Laravel 13 needs PHP 8.3 or later. | A PSR-18 HTTP client. Guzzle is the default. |
| Python | Python 3.10, 3.11, 3.12, 3.13 and 3.14 | Examples for Django and FastAPI | None. The SDK uses the standard library. |
| Ruby | Ruby 3.2, 3.3 and 3.4 | Rails 7.2, 8.0 and 8.1 | None. The gem uses the standard library. |

The JavaScript package contains ESM and CommonJS builds, with types for both. The Python package has full type hints and a `py.typed` file. The Ruby gem has RBS signatures in `sig/`.

## Quick start

Make an API token in BYOMailer, in **Settings > API Tokens**. Keep the token in an environment variable. Then make a client and add a contact to list 3.

WARNING: Keep the token on the server. Do not put the token in browser code. The token gives access to the data of your account.

### JavaScript and TypeScript

```ts
import { Byomailer } from "byomailer";

const mailer = new Byomailer({
	baseUrl: "https://mail.example.com",
	token: process.env.BYOMAILER_TOKEN!,
});

const { contact, created } = await mailer.contacts.add(3, {
	email: "ana@example.com",
	name: "Ana",
});
```

### PHP

```php
use Byomailer\Byomailer;

$byomailer = new Byomailer('https://mail.example.com', getenv('BYOMAILER_TOKEN'));

$contact = $byomailer->contacts()->add(3, 'ana@example.com', name: 'Ana');

$contact->wasRecentlyCreated; // true for a new contact
```

### Python

```python
import os

from byomailer import BYOMailer

client = BYOMailer("https://mail.example.com", token=os.environ["BYOMAILER_TOKEN"])

contact = client.contacts.add(3, "ana@example.com", name="Ana")
print(contact.created)  # True for a new contact
```

### Ruby

```ruby
require "byomailer"

client = Byomailer::Client.new(url: "https://mail.example.com", token: ENV["BYOMAILER_TOKEN"])

contact = client.contacts.add(3, "ana@example.com", name: "Ana")
contact.created?   # => true for a new contact
```

## Configuration

The PHP, Python and Ruby SDKs accept the instance URL with or without a trailing `/api/v1`. For the JavaScript SDK, give the root URL of the instance.

### JavaScript and TypeScript

Give the options to `new Byomailer({ ... })`.

| Option | Default | Description |
|---|---|---|
| `baseUrl` | (required) | The root URL of your instance. |
| `token` | (required) | The API token. |
| `timeout` | `30000` | The time limit for one attempt, in milliseconds. |
| `maxRetries` | `2` | The maximum number of retries after the first attempt. `0` stops retries. |
| `fetch` | the global `fetch` | A `fetch` function for a proxy, for logs or for tests. |

Each method also accepts `{ signal, timeout, maxRetries }` as its last argument. These values replace the client values for that call. The `signal` is an `AbortSignal`. It also stops a retry delay.

### PHP

Give the options to the constructor of `Byomailer\Byomailer`.

| Option | Default | Description |
|---|---|---|
| `url` | (required) | The URL of your instance. |
| `token` | (required) | The API token. |
| `timeout` | `30.0` | The time limit in seconds. The SDK uses it only when it makes the Guzzle client. |
| `retries` | `2` | The number of retries, or a `RetryPolicy` object. |
| `httpClient` | `null` | Your own PSR-18 client. If you give a client, set its timeout yourself. |

In Laravel, the package registers a service provider and the `Byomailer` facade. Set these environment variables:

| Variable | Default |
|---|---|
| `BYOMAILER_URL` | (required) |
| `BYOMAILER_TOKEN` | (required) |
| `BYOMAILER_WEBHOOK_SECRET` | (required for webhook verification) |
| `BYOMAILER_TIMEOUT` | `30` |
| `BYOMAILER_RETRIES` | `2` |
| `BYOMAILER_WEBHOOK_TOLERANCE` | `300` |

To publish the configuration file, run `php artisan vendor:publish --tag=byomailer-config`.

### Python

Give the options to `BYOMailer(...)`.

| Option | Default | Description |
|---|---|---|
| `base_url` | `$BYOMAILER_URL` | The URL of your instance. |
| `token` | `$BYOMAILER_TOKEN` | The API token. |
| `timeout` | `30.0` | The seconds to wait for the connection and for each read. `None` sets no limit. |
| `max_retries` | `2` | The number of retries. `0` stops retries. |
| `transport` | `UrllibTransport()` | The callable that sends the HTTP requests. Give your own to use another HTTP library. |

The default transport does not follow redirects, because a redirect can send the token to another host.

### Ruby

Give the options to `Byomailer::Client.new`, or set them in `Byomailer.configure`. The module methods, for example `Byomailer.contacts`, use the client of `Byomailer.configure`.

| Option | Default | Description |
|---|---|---|
| `url` | `ENV["BYOMAILER_URL"]` | The URL of your instance. |
| `token` | `ENV["BYOMAILER_TOKEN"]` | The API token. |
| `webhook_secret` | `ENV["BYOMAILER_WEBHOOK_SECRET"]` | The secret of your webhook endpoint. Only `Byomailer::Webhook.verify` uses it. |
| `timeout` | `30` | The seconds to wait for a connection and for a response. |
| `max_retries` | `2` | The number of retries. `0` stops retries. |

`Byomailer::Client.new` does not read the environment variables. Only `Byomailer.configure` reads them.

In Rails, the Railtie reads `Rails.application.credentials.byomailer` (`url`, `token` and `webhook_secret`). An initializer that calls `Byomailer.configure` runs after the Railtie, so its values win. The generator `bin/rails generate byomailer:install` writes `config/initializers/byomailer.rb`.

## Pagination

Most list endpoints use [cursor pagination](../api/overview.md#cursor-pagination). Each SDK can read one page, or walk all pages. When the SDK walks all pages, it sends the next request only when your loop needs the next page.

```ts
// JavaScript: await gives one page. for await gives each item of each page.
const page = await mailer.contacts.list({ per_page: 100 });
const next = await mailer.contacts.list({ cursor: page.meta.next_cursor ?? undefined });

for await (const contact of mailer.contacts.list({ per_page: 100 })) {
	console.log(contact.email);
}
```

```php
// PHP: list() gives a CursorPage. all() gives a generator of items.
$page = $byomailer->contacts()->list(perPage: 100);
$next = $byomailer->contacts()->list(perPage: 100, cursor: $page->nextCursor);

foreach ($byomailer->contacts()->all(perPage: 100) as $contact) {
    echo $contact->email;
}
```

```python
# Python: list() gives a Page. iter() walks all pages.
page = client.contacts.list(per_page=100)
next_page = client.contacts.list(per_page=100, cursor=page.next_cursor)

for contact in client.contacts.iter(per_page=100):
    print(contact.email)
```

```ruby
# Ruby: list gives a Byomailer::Page. each_record walks all pages.
page = client.contacts.list(per_page: 100)
page = page.next_page if page.next_page?

client.contacts.list(per_page: 100).each_record { |contact| puts contact.email }
```

| | JavaScript | PHP | Python | Ruby |
|---|---|---|---|---|
| One page | `await list()` | `list()` | `list()` | `list` |
| All items | `for await`, `.toArray()` | `all()` | `iter()` | `each_record` |
| Each page | `.pages()` | (none) | (none) | `next_page` |
| Next cursor | `page.meta.next_cursor` | `$page->nextCursor` | `page.next_cursor` | `page.next_cursor` |

`tags.list`, `blocks.list` and `topics.list` return all items in one array. These endpoints have no pages.

## Errors

Each SDK has one base error class. Each HTTP error has the status and the response body.

| Case | JavaScript | PHP | Python | Ruby (`Byomailer::`) |
|---|---|---|---|---|
| Base class | `ByomailerError` | `ByomailerException` | `BYOMailerError` | `Error` |
| 401: the token is missing or not valid | `AuthenticationError` | `AuthenticationException` | `AuthenticationError` | `AuthenticationError` |
| 403: a read-only token, or a user who is not an admin | `AuthorizationError` | `AuthorizationException` | `AuthorizationError` | `AuthorizationError` |
| 404: the record is not in your account | `NotFoundError` | `NotFoundException` | `NotFoundError` | `NotFoundError` |
| 422: the instance refused a field | `ValidationError` | `ValidationException` | `ValidationError` | `ValidationError` |
| 429: too many requests | `RateLimitError` | `RateLimitException` | `RateLimitError` | `RateLimitError` |
| 5xx: the instance failed | `ServerError` | `ServerException` | `ServerError` | `ServerError` |
| Another error status (parent of the classes above) | `ApiError` | `ApiException` | `APIError` | `ApiError` |
| No response | `ConnectionError` | `ConnectionException` | `APIConnectionError` | `ConnectionError` |
| Timeout | `TimeoutError` | `ConnectionException` | `APITimeoutError` | `ConnectionError` |
| A webhook delivery is not valid | `WebhookVerificationError` | `WebhookVerificationException` | `WebhookVerificationError` | `WebhookVerificationError` |
| The URL, the token or the webhook secret is empty | `TypeError` | `MissingCredentialsException` | `ValueError` | `ConfigurationError` |

The PHP SDK also has `UnexpectedResponseException` for a response body that is not in the expected format. In Python, `APITimeoutError` is a subclass of `APIConnectionError`.

To read the field errors of a 422 and the wait of a 429:

| | JavaScript | PHP | Python | Ruby |
|---|---|---|---|---|
| Field errors | `error.errors` | `$exception->errors()`, `has()`, `first()` | `error.errors` | `error.errors` |
| Seconds to wait | `error.retryAfter` | `$exception->retryAfter()` | `error.retry_after` | `error.retry_after` |
| HTTP status | `error.status` | `$exception->status` | `error.status_code` | `error.status` |

The JavaScript errors also have a `code`, for example `validation_error` or `rate_limit`. Use `isByomailerError()` and a `switch` on `code`.

## Retries

The four SDKs use the same retry rule and the same values. The SDK sends a failed request again, up to the number of retries. The default is 2 retries.

- **Backoff.** The wait starts at 0.5 seconds and doubles on each retry: 0.5, 1, 2, 4, and 8 seconds at most. Jitter makes each wait a random value between half and all of this value.
- **`Retry-After`.** If the response has a `Retry-After` header, the SDK waits for that time.
- **Long waits.** If `Retry-After` is more than 60 seconds, the SDK does not retry. It raises the error at once.
- **429.** The SDK retries a 429 for each call. The rate limiter refuses the request before the instance does the work.
- **Connection not made.** The SDK retries a DNS failure, a refused connection or a connect timeout for each call, also a write that is not idempotent. The instance did not get the request, so a retry is safe.
- **5xx, read timeouts and resets after the send.** The SDK retries these only for an idempotent call. The instance can have done the work, so a second call can do it two times.
- **Other 4xx.** The SDK does not retry.

A call is idempotent when a second call gives the same result and has no second effect. Each GET and each DELETE is idempotent. These writes are also idempotent:

| Call | JavaScript | PHP | Python | Ruby |
|---|---|---|---|---|
| Update a contact | `contacts.update()` | `contacts()->update()` | `contacts.update()` | `contacts.update` |
| Unsubscribe a contact | `contacts.unsubscribe()` | `contacts()->unsubscribe()` | `contacts.unsubscribe()` | `contacts.unsubscribe` |
| Subscribe a contact again | `contacts.subscribe()` | `contacts()->subscribe()` | `contacts.subscribe()` | `contacts.subscribe` |
| Count the recipients of filters | `newsletters.countRecipients()` | `newsletters()->countRecipients()` | `newsletters.count_recipients()` | `newsletters.count_recipients` |
| Rename a list, a tag or a project | `rename()` | `rename()` | `rename()` | `rename` |
| Update a topic, a block or a webhook endpoint | `update()` | `update()` | `update()` | `update` |
| Replace the content variables of a newsletter or a sequence | `replaceVariables()` | `replaceVariables()` | `replace_variables()` | `replace_variables` |
| Replace the filters of a sequence step | `sequences.replaceStepFilters()` | `sequences()->replaceStepFilters()` | `sequences.replace_step_filters()` | `sequences.replace_step_filters` |

The other writes are not idempotent. For example, a second call that adds a contact to a list changes the result from new to existing. A newsletter update with the status `live` can start the send, and a second call then gets a 422.

To change the retries in PHP, give a `RetryPolicy` with `retries`, `baseDelayMs`, `maxDelayMs` and `maxRetryAfter`. `RetryPolicy::none()` stops retries.

The SDKs retry a DELETE after a lost response. If the first DELETE worked, the retry gets a 404, and the SDK raises the not found error.

The API allows 300 requests each minute for each user. Three endpoints have a lower [rate limit](../api/overview.md#rate-limits):

| Call | Limit |
|---|---|
| Count the recipients of filters | 30 a minute |
| Send a test email of a newsletter | 5 a minute |
| Send a test webhook delivery | 10 a minute |

## Webhook verification

BYOMailer signs each [webhook delivery](../api/webhooks.md#delivery-behavior). The helper of each SDK verifies the delivery and returns a verified event.

WARNING: Verify webhooks only on your server. Do not put the endpoint secret in browser code or in a mobile app. With the secret, any person can send you fake events.

The helper does these steps:

1. It reads the `X-Byomailer-Signature` header. If the header is missing, the reason is `signature`. The header names are not case-sensitive.
2. It reads the `X-Byomailer-Timestamp` header. If the header is missing or is not a Unix time, the reason is `timestamp`.
3. It calculates the HMAC-SHA256 of the timestamp, a dot (`.`) and the raw body. The key is the full secret, with its `whsec_` prefix.
4. It changes the signature header to lowercase. Then it compares the header with `sha256=` and the digest, in constant time. If they are not equal, the reason is `signature`.
5. It refuses a timestamp that is more than 300 seconds before or after the current time. The reason is `timestamp`. You can change this tolerance.
6. It decodes the JSON body. If the body is not a JSON object, the reason is `payload`.

Give the raw request body, byte for byte. Do not decode the JSON and encode it again. The instance escapes Unicode as `\uXXXX` and does not escape `/`, so a new encoding gives other bytes.

| | JavaScript | PHP | Python | Ruby |
|---|---|---|---|---|
| Helper | `verifyWebhook({ body, headers, secret })` | `(new Webhook($secret))->verify($body, $headers)` | `verify_webhook(body, headers, secret)` | `Byomailer::Webhook.verify(body, headers)` |
| Result | A `VerifiedWebhook` object | A `WebhookEvent` object | A `WebhookEvent` object | A `Byomailer::Webhook::Event` |
| Tolerance | `tolerance` option | `tolerance` constructor argument | `tolerance` argument | `tolerance:` keyword |
| Current time for tests | `now` (a `Date`) | `$now` (Unix seconds) | `now` (Unix seconds) | `now:` (a `Time`) |
| Failure reason | `"signature"`, `"timestamp"`, `"payload"` | `VerificationFailure::Signature`, `Timestamp`, `Payload` | `"signature"`, `"timestamp"`, `"payload"` | `:signature`, `:timestamp`, `:payload` |
| Sign a body in your tests | (none) | (none) | `byomailer.webhooks.sign()` | `Byomailer::Webhook.sign` |

Each payload has `event` and `occurred_at`. The other fields depend on the event. See [The payload](../using-byomailer/webhooks.md#the-payload).

The events are `contact.subscribed`, `contact.unsubscribed`, `contact.resubscribed`, `newsletter.sent`, `sequence_step.sent`, `sequence.completed` and `webhook.test`. The helper accepts an event type that it does not know, because a new version of BYOMailer can add events. For an A/B newsletter, `newsletter.sent` arrives one time, when the winner is picked.

The verified event has these fields in each SDK:

| Field | JavaScript | PHP | Python | Ruby |
|---|---|---|---|---|
| The event type: `event` of the payload, or the `X-Byomailer-Event` header | `type` | `$type` | `type` | `type` |
| The decoded JSON body | `payload` | `$payload` | `payload` | `payload` |
| The Unix time when the instance signed the delivery | `timestamp` | `$timestamp` | `timestamp` | `timestamp` |
| The UUID of the delivery, from the `X-Byomailer-Delivery` header | `deliveryId` | `$deliveryId` | `delivery_id` | `delivery_id` |

The PHP `WebhookEvent` also has `occurredAt`, the `occurred_at` date, and the helpers `is()` and `contact()`. The Ruby payload is a `Byomailer::Record`.

### The delivery ID

The `X-Byomailer-Delivery` header has a UUID for each delivery. BYOMailer sends a delivery again after a failure. Use the delivery ID to find a delivery that you received before.

If the header is missing or empty, the verification passes and the delivery ID is null (`null`, `None` or `nil`). An older instance does not send the header.

### Express

Use `express.raw()` on the webhook route. `express.json()` parses the body, and then the raw bytes are lost.

```ts
import express from "express";
import { verifyWebhook, WebhookVerificationError } from "byomailer";

const app = express();

app.post("/webhooks/byomailer", express.raw({ type: "application/json" }), async (req, res) => {
	try {
		const { type, payload, deliveryId } = await verifyWebhook({
			body: req.body, // a Buffer
			headers: req.headers,
			secret: process.env.BYOMAILER_WEBHOOK_SECRET!,
		});

		if (type === "contact.unsubscribed") {
			// Update your own database.
		}

		res.sendStatus(204);
	} catch (error) {
		if (error instanceof WebhookVerificationError) {
			res.status(400).send(error.reason);
			return;
		}
		throw error;
	}
});
```

In a Next.js Route Handler, give `await request.text()` as the body and `request.headers` as the headers.

### Laravel

The container gives a `Webhook` object with the secret and the tolerance of the configuration.

```php
use Byomailer\Exceptions\WebhookVerificationException;
use Byomailer\Webhooks\Webhook;
use Byomailer\Webhooks\WebhookEvent;
use Illuminate\Http\Request;

class ByomailerWebhookController
{
    public function __invoke(Request $request, Webhook $webhook)
    {
        try {
            $event = $webhook->verify($request->getContent(), $request->headers->all());
        } catch (WebhookVerificationException) {
            abort(400);
        }

        if ($event->is(WebhookEvent::CONTACT_UNSUBSCRIBED)) {
            $email = $event->contact()['email'];
            $deliveryId = $event->deliveryId;
        }

        return response()->noContent();
    }
}
```

If the route is in `routes/web.php`, remove it from CSRF protection. BYOMailer sends no CSRF token.

### Django

```python
from django.conf import settings
from django.http import HttpRequest, HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from byomailer import WebhookVerificationError, verify_webhook


@csrf_exempt
@require_POST
def byomailer_webhook(request: HttpRequest) -> HttpResponse:
    try:
        event = verify_webhook(request.body, request.headers, settings.BYOMAILER_WEBHOOK_SECRET)
    except WebhookVerificationError:
        return HttpResponseBadRequest()

    if event.type == "contact.unsubscribed":
        print(event.payload["contact"]["email"], event.delivery_id)
    return HttpResponse(status=204)
```

`request.body` is the raw body. The Python SDK has no framework code. The README of the SDK also has an example for FastAPI.

### Rails

```ruby
class ByomailerWebhooksController < ActionController::API
  def create
    event = Byomailer::Webhook.verify(request.raw_post, request.headers)

    case event.type
    when "contact.unsubscribed" then Subscriber.goodbye(event.payload.contact.email, event.delivery_id)
    end

    head :ok
  rescue Byomailer::WebhookVerificationError
    head :bad_request
  end
end
```

`Byomailer::Webhook.verify` reads the secret from `config.webhook_secret`. To give the secret directly, pass `secret:`. The headers can be the Rails `request.headers`, a Rack env or a Hash.

## Subscribe a contact again

Version 0.2.0 adds the subscribe call. It calls [`POST /contacts/{contactId}/subscribe`](../api/contacts.md#subscribe-a-contact-again).

| JavaScript | PHP | Python | Ruby |
|---|---|---|---|
| `mailer.contacts.subscribe(42)` | `$byomailer->contacts()->subscribe(42)` | `client.contacts.subscribe(42)` | `client.contacts.subscribe(42)` |

The subscription of a contact changes only through these calls:

- `unsubscribe` unsubscribes the contact from all email. The contact stays on its lists.
- `subscribe` clears an unsubscribe that an admin or the API made. A subscribed contact does not change.
- The call that adds a contact to a list also clears an unsubscribe that an admin or the API made.
- The update of a contact never changes the subscription.

An unsubscribe through an email link stays. Only the contact can subscribe again. In two cases, `subscribe` raises the validation error of the SDK, with the error on one field:

| Field | Cause |
|---|---|
| `contact` | The contact unsubscribed through an email link. |
| `email` | The email address is on the blacklist. |

```ts
// JavaScript
import { ValidationError } from "byomailer";

try {
	await mailer.contacts.subscribe(42);
} catch (error) {
	if (error instanceof ValidationError && "contact" in error.errors) {
		// The contact unsubscribed through an email link.
	}
}
```

```php
// PHP
use Byomailer\Exceptions\ValidationException;

try {
    $byomailer->contacts()->subscribe(42);
} catch (ValidationException $exception) {
    $exception->has('contact'); // The contact unsubscribed through an email link.
    $exception->has('email');   // The email address is on the blacklist.
}
```

```python
# Python
from byomailer import ValidationError

try:
    client.contacts.subscribe(42)
except ValidationError as error:
    if "contact" in error.errors:
        print("The contact unsubscribed through an email link.")
```

```ruby
# Ruby
begin
  client.contacts.subscribe(42)
rescue Byomailer::ValidationError => error
  error.errors["contact"]   # The contact unsubscribed through an email link.
  error.errors["email"]     # The email address is on the blacklist.
end
```

Each SDK retries `subscribe` after a 5xx, a connection error or a timeout, because a second call does not change the contact.

On a list with opt-in, the call that adds a contact sends the opt-in email only when the contact is new on the list. The contact gets newsletters and sequence emails from this list only after the confirmation.

The contact calls have the same names and the same argument order. The list ID comes first:

| Action | JavaScript | PHP | Python | Ruby |
|---|---|---|---|---|
| Add to a list | `contacts.add(listId, { email })` | `contacts()->add($listId, $email)` | `contacts.add(list_id, email)` | `contacts.add(list_id, email)` |
| New contact? | `created` in the result | `$contact->wasRecentlyCreated` | `contact.created` | `contact.created?` |
| Remove from a list | `contacts.removeFromList(listId, contactId)` | `contacts()->removeFromList($listId, $contactId)` | `contacts.remove_from_list(list_id, contact_id)` | `contacts.remove_from_list(list_id, contact_id)` |

The other calls also have the same names in the four SDKs. For example, `pickWinner` (`pick_winner`) picks the A/B winner, and `sendTest` (`send_test`) sends a test email of a newsletter or a test webhook delivery. PHP and Ruby use `find` to get one record, and JavaScript and Python use `get`.

## The two sequence types

A sequence has two types in each SDK. The [list of sequences](../api/sequences.md#list-sequences) returns summaries. [One sequence](../api/sequences.md#get-a-sequence) returns the full record.

| Type | Calls | Fields |
|---|---|---|
| `SequenceSummary` | The list calls | `id`, `name`, `status`, `steps_count`, `contacts_count`, `completed_count`, `active_count` and `project_ids` |
| `Sequence` | The get call | The fields of the summary. Also `steps`, `segment_id`, `filters`, `content_variables` and `created_at`. |

| | JavaScript | PHP | Python | Ruby |
|---|---|---|---|---|
| List | `sequences.list()` | `sequences()->list()`, `all()` | `sequences.list()`, `iter()` | `sequences.list` |
| One sequence | `sequences.get(id)` | `sequences()->find($id)` | `sequences.get(id)` | `sequences.find(id)` |
| Summary type | `SequenceSummary` | `Byomailer\Data\SequenceSummary` | `byomailer.SequenceSummary` | `Byomailer::SequenceSummary` |
| Full type | `Sequence` | `Byomailer\Data\Sequence` | `byomailer.Sequence` | `Byomailer::Sequence` |

`completed_count` is the number of contacts that finished the sequence. `active_count` is the number of contacts that did not finish it.

The `status` filter of the list accepts `draft`, `live` or `paused`. In PHP, the filter is the enum `Byomailer\Enums\SequenceStatus`, with the cases `Draft`, `Live` and `Paused`:

```php
use Byomailer\Enums\SequenceStatus;

$page = $byomailer->sequences()->list(status: SequenceStatus::Live);
```

A list item does not have `steps`, `filters` or `content_variables`. To read these fields, get the full sequence.

The export of the mails of a step does not send the `current_only` filter. The instance ignores this filter, and the export always has the full history of the step. If you give `current_only` to the Ruby gem, the gem gives a deprecation warning.

## License

Each SDK uses the MIT license. The `LICENSE` file of each repository has the full text. The BYOMailer app has its own license.

## More information

The README of each SDK has an example for each method. See these pages for the API:

- [API overview](../api/overview.md)
- [Authentication](../api/authentication.md)
- [Webhook endpoints](../api/webhooks.md)
- [Webhooks](../using-byomailer/webhooks.md)
