---
title: MCP server overview
description: Connect an AI assistant to BYOMailer through the Model Context Protocol, and learn the rules that protect live campaigns.
order: 1
---

# MCP server overview

BYOMailer has an MCP server (Model Context Protocol). An AI assistant, for example Claude Code or Cursor, can use it to read and change the data of one account. The assistant can read stats and content, write drafts, manage contacts, and change the status of live records after the user confirms.

The server uses the `laravel/mcp` package. Its name is `BYOMailer` and its version is `1.0.0`. It has tools only. It has no resources and no prompts.

To connect a client, read [Connect an MCP client](connect-clients.md). For the arguments and the results of each tool, read the [tools reference](tools-reference.md).

## Endpoint

| Item | Value |
|---|---|
| URL | `https://byomailer.example/mcp` (the host of `APP_URL`, then `/mcp`) |
| Transport | Streamable HTTP. The routes are `POST /mcp`, `GET /mcp` and `DELETE /mcp`. |
| Authentication | `Authorization: Bearer <your-token>` |
| Rate limit | 60 requests each minute for each user (the `mcp` rate limiter) |
| Route file | `routes/ai.php` |
| Server class | `app/Mcp/Servers/ByoMailerServer.php` |

The server is available only on the host of `APP_URL`. On a custom link domain, `/mcp` returns `404`. The `RestrictHostToLinkRoutes` middleware does this. For more about link domains, read [Custom domains](../using-byomailer/custom-domains.md).

## Authentication

The server accepts an API token only. It uses the same Sanctum tokens as the REST API. The route has the `auth:sanctum` middleware.

- A team member creates an API token in **Settings, API Tokens** (`/settings/api-tokens`). For the steps, read [Connect an MCP client](connect-clients.md).
- The server does not offer OAuth. The app registers no OAuth routes for the MCP server.
- A token has an expiration date, or no expiration date if you selected **Never**. After the date, the request gets `401`. `config/sanctum.php` sets no global expiration time.
- A token works for the account of its user. All data that the tools read or change belongs to that account.
- BYOMailer refuses the token of a user that the owner deactivated. It also refuses the token of an archived team member and of a team member with an open invitation. The request then gets `401`.

## Access levels

The server shows and runs only the tools that the token and the user can use. `ByoMailerServer::createContext()` filters the tools on each request:

| Token and user | Tools |
|---|---|
| A read and write token of an admin or an editor | All tools. |
| A read-only token (ability `read`) | Only the tools with the `IsReadOnly` annotation, for example the list, details, stats and content tools. |
| Any token of a viewer | Only the tools with the `IsReadOnly` annotation. |
| A token without the `read` ability | No tools. |

`tools/list` does not show a tool that the token cannot use. A call to such a tool gets the JSON-RPC error `-32602` with the message `Tool [<name>] not found.`

For more about tokens, read [API authentication](../api/authentication.md).

## Tool names

The server publishes 44 tools. Some tool names end with `-tool`, for example `create-newsletter-tool`. Other tool names have no suffix, for example `schedule-newsletter`.

The server instructions, the tool descriptions and the error messages use the names that `tools/list` returns. This page uses the same names.

## Workflow for newsletters

1. Call `list-newsletters-tool` to find the newsletter ids.
2. To read the results of a newsletter, call `newsletter-stats-tool`. To read the subject and the body, call `newsletter-content-tool`.
3. To write a new newsletter, call `view-newsletter-filters-tool` first. It returns the filter schema and the tags, lists, topics and attributes of the account.
4. Call `calculate-newsletter-contacts-tool` with the filters. It counts the recipients and saves nothing.
5. Call `create-newsletter-tool`. It saves a draft.
6. To change the draft, call `update-newsletter-tool`. Only the fields that you send change.
7. Set the sender identity with `email_identity_id`. A test mail and a schedule need a sender identity.
8. Call `send-newsletter-test-mail-tool`. It sends one copy to the email address of the token user.
9. Call `schedule-newsletter` with the action `schedule` and a future `scheduled_at`. This is a status change. Read [Status changes](#status-changes).

`schedule-newsletter` never sends a newsletter at once. The action `unschedule` sets a scheduled newsletter back to draft. A newsletter that is sending or sent is locked. The update tool returns an error for it.

## Workflow for sequences

1. Call `create-sequence-tool`. It saves a draft sequence. You can send `filters` in the format of `view-newsletter-filters-tool`. Only the contacts that match the filters get the sequence.
2. Call `create-sequence-step-tool` for each email. Set the delay after the previous step with `delay_type` (`days` or `hours`) and `delay_days`.
3. A step can have its own filters. A contact that does not match them skips only that step.
4. To change the sequence or a step, call `update-sequence-tool` or `update-sequence-step-tool`.
5. Call `send-sequence-step-test-mail-tool` to send one step to the email address of the token user.
6. Call `set-sequence-status` and `set-sequence-step-status` with the status `live`. These are status changes. Read [Status changes](#status-changes).

A sequence sends only through its live steps. Activate the sequence and each step that must send.

To read a sequence, use `list-sequences-tool`, `sequence-content-tool`, `sequence-step-content-tool`, `sequence-stats-tool` and `sequence-step-stats-tool`.

To read the emails that BYOMailer sent, use `list-contact-mails-tool`, `list-sequence-step-contact-mails-tool` and `contact-mail-details-tool`. `export-sequence-step-contact-mails-tool` returns a URL to a CSV file. Get the file with the same bearer token.

## Workflow for contacts

| Task | Tool |
|---|---|
| Find one contact by exact email, also an unsubscribed contact | `find-contact` |
| List contacts with filters and a search, page by page | `list-contacts` |
| Add a contact, or use the contact that has this email | `create-contact` |
| Add a contact to one more list | `add-contact-to-list` |
| Add tags to a contact | `add-tags-to-contact` |
| Remove a contact from one list | `remove-contact-from-list` |
| Change up to 100 contacts in one call | `bulk-update-contacts` |
| Add a tag to the account | `create-tag-tool` |

- `list-contacts` returns `next_after_id`. To get the next page, send it as `after_id`.
- `bulk-update-contacts` can change the name, add and remove tags, set and remove attributes, and add to and remove from lists. Each item reports `updated` or `failed`. A failed item does not stop the other items.
- If a list requires opt-in, adding a contact to it queues the opt-in email.
- Tag, list and attribute changes run the live automations of the account.
- To find the list ids, call `view-newsletter-filters-tool`.

For more about contacts, read [Contacts](../using-byomailer/contacts.md).

## Workflow for sender identities

A sender identity is a verified sending domain in the AWS SES account of the account.

1. Call `create-email-identity-tool`. It registers the domain in SES and returns the DNS records. The account must have AWS credentials in the dashboard first.
2. Publish the DNS records at the DNS provider of the domain.
3. Call `refresh-email-identity-status-tool`. It asks SES for the verification status.
4. Call `email-identity-details-tool` to see each DNS record and its `verified` flag.

`update-email-identity-tracking-tool` turns open tracking and click tracking on or off. `list-email-identities-tool` lists the identities. Only an identity with `identity_status` `verified` can send mail. The MCP server cannot delete a sender identity.

For more about sender identities, read [Sender identities](../using-byomailer/sender-identities.md).

## Workflow for automations

1. Call `view-automation-options` to get the condition types, the action types and the ids.
2. Call `create-automation`. BYOMailer always saves a new automation as paused (`is_live` is `false`).
3. To change it, call `update-automation`.
4. Make sure that each sequence in an `add_sequence` action is live.
5. Call `set-automation-status` with `is_live` set to `true`. This is a status change. Read [Status changes](#status-changes).

| Item | Values |
|---|---|
| Condition types | `contact_added_to_list`, `removed_from_list`, `tag_added`, `removed_tag`, `added_to_sequence`, `sequence_finished`, `attribute_changed` |
| Action types | `add_tag`, `add_list`, `remove_tag`, `remove_list`, `add_sequence` |

A paused automation can add contacts to a draft sequence. A live automation needs live sequences, because it drops each contact that it cannot enroll. A live automation runs on new events only. It does not run on contacts that matched before. The MCP server cannot delete an automation.

For more about automations, read [Automations](../using-byomailer/automations.md).

## Drafts only

The create tools never make a record that sends:

- `create-newsletter-tool` saves a newsletter with the status `draft`.
- `create-sequence-tool` and `create-sequence-step-tool` save the status `draft`.
- `create-automation` saves the automation as paused.

The create tools have no status argument. If a client sends `status`, BYOMailer ignores it.

## Live records and `confirm_live`

A live record affects real contacts now. These records are live:

| Record | Live when |
|---|---|
| Newsletter | Its status is `scheduled`. |
| Sequence | Its status is `live`. |
| Sequence step | Its status is `live`. |
| Automation | `is_live` is `true`. |

The `ConfirmsLiveEdits` trait (`app/Mcp/Concerns/ConfirmsLiveEdits.php`) adds the `confirm_live` argument to the tools that can change a live record.

### Edits to a live record

`update-newsletter-tool`, `update-sequence-tool`, `update-sequence-step-tool` and `update-automation` refuse to change a live record without `confirm_live`. They return an error and save nothing. The error has this form:

```text
Newsletter #42 is live. It is scheduled to send to real contacts at 2026-11-20T15:00:00+00:00. No change was saved. Show the user the changes, ask the user to confirm, then call this tool again with confirm_live set to true.
```

The assistant must show the change to the user. After the user confirms, the assistant calls the tool again with `confirm_live` set to `true`. A draft or a paused record needs no confirmation.

The scheduler can start the send of a newsletter while `update-newsletter-tool` runs. Then the tool returns the error `Newsletter #42 is queued and can no longer be edited.` and saves nothing.

### Status changes

`schedule-newsletter`, `set-sequence-status`, `set-sequence-step-status` and `set-automation-status` need two calls:

1. The first call saves nothing. It returns a preview with `applied` set to `false`. The preview shows the change, the contacts and mails that it affects, `effects`, and `warnings`.
2. The assistant shows the preview to the user.
3. After the user confirms, the assistant calls the tool again with the same arguments and `confirm_live` set to `true`.
4. The result has `applied` set to `true` and a `message`.

The scheduler can start the send of a newsletter between the preview and the confirmed call. Then `schedule-newsletter` returns `applied` set to `false`, and the newsletter does not change. The `message` is one of these texts. The second text is the same as in the dashboard.

- `The send already started, so the newsletter was not scheduled.`
- `The send already started, so the newsletter did not go back to draft.`

These tools run the same checks as the dashboard. For example, a sequence cannot go live if the account cannot send email. A step cannot go live without a subject or a body. A newsletter without a sender identity cannot get a schedule.

WARNING: Do not let an assistant send `confirm_live` before the user confirms. The server does not store the preview. A call with `confirm_live` set to `true` applies the change at once, also without a preview first.

## Content variables

Email content can have `{{ variable }}` placeholders. At send time, BYOMailer fills each placeholder from the contact. A content variable is the default value for a placeholder when the contact has no value.

BYOMailer fills a placeholder in this order:

1. The value of the contact (a column such as `name` or `email`, then a custom attribute).
2. The content variable of the newsletter or the sequence.
3. The default value of the attribute for the account.

| Tool | Use |
|---|---|
| `create-newsletter-tool`, `update-newsletter-tool` | Set `content_variables` for a newsletter. |
| `create-sequence-tool`, `update-sequence-tool` | Set `content_variables` for a sequence. The steps use them. |
| `newsletter-content-tool`, `sequence-content-tool` | Read the saved `content_variables` and the detected variables. |

`content_variables` is an object of variable name to text, for example `{"checkout_url": "https://example.com/checkout"}`. Each value has a maximum of 255 characters. The object replaces all saved defaults. An empty object removes them.

The names `content`, `unsubscribe_url`, `preferences_url` and `opt_in_url` are reserved. BYOMailer fills them when it renders the email. For more about placeholders, read [Templates and blocks](../using-byomailer/templates-and-blocks.md).

The subject, the preview text and the body can also use Liquid tags and filters, for example `{% if vip %}` and `{{ name | default: "friend" }}`. The create and update tools refuse content that is not valid Liquid. The error names the line. For the rules, read [Liquid](../using-byomailer/templates-and-blocks.md#liquid).

## Warnings

A missing `{{ unsubscribe_url }}` link and a missing postal address never block a status change. The sender is responsible for them. `schedule-newsletter`, `set-sequence-status` and `set-sequence-step-status` return them in `warnings`, in the preview and in the result. The assistant must show the warnings to the user.

The `SendableContentCheck` service makes these warnings:

```text
The content has no unsubscribe link ({{ unsubscribe_url }}). Laws such as CAN-SPAM and GDPR ask for an unsubscribe link in marketing email. BYOMailer still adds the one-click List-Unsubscribe header that Gmail and Yahoo require for bulk senders.
```

```text
Your account has no postal address. Laws such as CAN-SPAM ask for a postal address in each marketing email. Add it in Settings, Profile, and put {{ postal_address }} in the footer.
```

For an A/B test, a third warning starts with `Variant B has no unsubscribe link`. For more, read [Unsubscribe and preferences](../using-byomailer/unsubscribe-and-preferences.md).

## Results and errors

A successful tool call returns JSON in `structuredContent`. The `content` array has the same JSON as text.

An error has one of these forms:

| Error | Form |
|---|---|
| No token, a wrong token, or a refused user | HTTP `401` |
| More than 60 requests in one minute | HTTP `429` |
| A request on a host that is not the host of `APP_URL` | HTTP `404` |
| An unknown tool name | JSON-RPC error `-32602` with the message `Tool [<name>] not found.` |
| A validation error | A tool result with `isError` set to `true`. The text has the validation messages, divided by spaces. |
| A refused action | A tool result with `isError` set to `true`. The text gives the cause and the next step. |
| An unexpected error | A tool result with `isError` set to `true` and the text `An internal server error occurred.` |

Examples of refused actions:

```text
No newsletter found with id 42.
```

```text
Newsletter #42 is sent and can no longer be edited. Only draft and scheduled newsletters can be updated.
```

```text
Newsletter #42 has no sender. Set email_identity_id with update-newsletter first.
```

If `APP_DEBUG` is `true`, an unexpected error shows the message of the exception. If `APP_DEBUG` is `false`, BYOMailer reports the exception and shows the general text.

A tool cannot find a record of another account. It returns the same "not found" error as for an id that does not exist.
