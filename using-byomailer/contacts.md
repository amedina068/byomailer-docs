---
title: Contacts
description: Add and edit contacts, read their email history, and manage the subscribed, unsubscribed and sunset states.
order: 1
---

# Contacts

A contact is one person that can get email from your account. Each contact has an email address, an optional name, attributes, tags, lists and topics. BYOMailer also records each email that it sends to the contact.

## The contact record

| Field | What it holds |
| --- | --- |
| `email` | The email address. It is required, with a maximum of 255 characters. It is unique in the account. |
| `name` | The name of the contact. It is optional, with a maximum of 255 characters. |
| `extra_attributes` | The custom attributes of the contact. See [Tags and attributes](tags-and-attributes.md). |
| `unsubscribed_at` | The date and time of the unsubscribe. It is empty when the contact is subscribed. |
| `unsubscribed_by_contact` | `true` when the contact unsubscribed with a link in an email. `false` when a team member or a bounce unsubscribed the contact. |
| `sunset_at` | The date and time when the sunset run marked the contact as inactive. See [Sunset of inactive contacts](#sunset-of-inactive-contacts). |
| `last_engaged_at` | The date and time of the last click of the contact in an email. |
| `soft_bounce_count` | The number of soft bounces after the last delivery. |
| `country`, `timezone` | The country code and the time zone of the last email open. BYOMailer reads them from the IP address of the open. |
| `uuid` | A unique ID that BYOMailer uses in links. |

BYOMailer finds the country and the time zone with a MaxMind GeoLite2 database. If the database file is not available, these fields stay empty. See [Optional integrations](../self-hosting/optional-integrations.md).

## Add a contact

1. Open **Contacts** in the sidebar.
2. Click **Create contact**.
3. Enter the email address. Enter a name if you have one.
4. Save the contact.

If a contact with the same email already exists, BYOMailer shows the error `A contact with this email already exists.`

You can also add contacts with a CSV import, the API or the MCP server. See [Imports and exports](imports-and-exports.md), [API: Contacts](../api/contacts.md) and [MCP tools reference](../mcp/tools-reference.md).

TODO(owner): The dashboard and the API have no route that deletes a contact. Is there a supported way to delete a contact, for example for a GDPR erasure request?

## The contacts page

The **Contacts** page shows 25 contacts on each page, newest first. You can use these controls:

| Control | What it does |
| --- | --- |
| Search | Finds contacts by name or email. |
| **Lists** | Shows only the contacts on the lists that you select. |
| **Tags** | Shows only the contacts with the tags that you select. |
| **Status** > **Include unsubscribed** | Also shows the unsubscribed contacts. By default the page hides them. |
| **Export** | Downloads the contacts that match the current filters as CSV. |
| **Import contacts** | Opens the CSV import. |
| **Add to sequence** | Adds the selected contacts to a live sequence. |

The page does not hide sunset contacts. It hides only the unsubscribed contacts.

TODO(owner): The page text says "Inactive or unsubscribed contacts are hidden by default", but `ContactController::index` filters only on `unsubscribed_at`. Must the page also hide sunset contacts?

## The contact page

Click a contact to open its page. The page has these parts:

- **Header**: the name and the email. Click the name or the email to edit it. The header also shows the ID of the contact and the status badge.
- **Attributes**: add, edit or remove an attribute. See [Tags and attributes](tags-and-attributes.md).
- **Tags**: add or remove tags. You can create a tag from this panel.
- **Lists**: add or remove lists. You can create a list from this panel.
- **Sequences**: the sequences of the contact. Click the plus button to add the contact to a live sequence.
- **Topics**: the topics that the contact is subscribed to.
- **Messages sent**: the history of emails. See [Email history](#email-history).

When you add a contact to a list on this page, BYOMailer does not send the opt-in email. See [Lists and topics](lists-and-topics.md).

You can add a contact only to a live sequence. BYOMailer adds the contact only if it matches the filters of the sequence. See [Sequences](sequences.md).

## Email history

The **Messages sent** table shows the last 15 emails that BYOMailer sent to the contact, newest first. Each row has these columns:

| Column | What it shows |
| --- | --- |
| **Subject** | The subject of the email. |
| **Status** | The status of the email. |
| **Scheduled / Sent** | The send time, or the scheduled time if there is no send time. |
| **Unsubscribed** | The time when the contact unsubscribed with a link in this email. |

Click **View** to open the full email, with its content and its events.

BYOMailer updates the status of an email from the events of Amazon SES. These are the status values:

| Status | Meaning |
| --- | --- |
| `pending` | The email waits for its send time. |
| `sent` | SES accepted the email. |
| `delivered` | The mail server of the contact accepted the email. |
| `opened` | The contact opened the email or clicked a link in it. |
| `bounced` | The email bounced. |
| `complained` | The contact marked the email as spam. |
| `rejected` | SES rejected the email. |
| `failed` | BYOMailer did not send the email. The `failure_reason` field gives the cause. |
| `skipped` | A sequence step skipped the contact. |

See [SES events](../self-hosting/ses-events.md) for how the events reach BYOMailer.

## Subscription states

The status badge on the contact page shows one of three states:

| State | Condition | Does BYOMailer send email? |
| --- | --- | --- |
| **Subscribed** | `unsubscribed_at` and `sunset_at` are empty. | Yes |
| **Unsubscribed** | `unsubscribed_at` has a value. | No |
| **Sunset** | `sunset_at` has a value and `unsubscribed_at` is empty. | No |

If both fields have a value, the badge shows **Unsubscribed**.

### How a contact becomes unsubscribed

| Cause | `unsubscribed_by_contact` |
| --- | --- |
| The contact clicks the unsubscribe link, uses one-click unsubscribe, or uses the preference center. | `true` |
| A team member clicks **Unsubscribe** on the contact page. | `false` |
| SES reports a hard bounce (bounce type `Permanent`). | `false` |
| SES reports a complaint. | `false` |
| SES reports the third soft bounce in a row. | `false` |

A delivery sets the soft bounce count back to 0. A hard bounce, a complaint or the third soft bounce also puts the address on the suppression list of the account. BYOMailer does not send to an address on the suppression list, even if the contact is subscribed again. See [Deliverability](deliverability.md).

When a contact becomes unsubscribed, BYOMailer does these steps:

1. It removes the pending emails of the contact that are not sent.
2. It removes the contact from all its sequences.
3. It sends the `contact.unsubscribed` webhook event. It does not send this event for a bounce or a complaint.

When an unsubscribed contact is subscribed again, BYOMailer sends the `contact.resubscribed` webhook event. See [Webhooks](webhooks.md).

### Unsubscribe or subscribe a contact

To unsubscribe a contact, click **Unsubscribe** on the contact page.

To subscribe a contact again, click **Subscribe** on the contact page. The button shows only when a team member, a bounce or a complaint unsubscribed the contact. If the contact unsubscribed with a link, only the contact can subscribe again. See [Unsubscribe and preferences](unsubscribe-and-preferences.md).

The API and the MCP server also change this state. If the API or the MCP server saves a contact that a team member or a bounce unsubscribed, BYOMailer subscribes the contact again. It does not do this when the address is on the suppression list.

## Sunset of inactive contacts

Sunset stops email to contacts that do not click. It protects the sending reputation of your account. Sunset is off by default.

### Turn on sunset

1. Open **Settings** > **Profile**.
2. In **Sunset inactive contacts**, select a period, for example **No clicks in 90 days**.
3. Save the profile.

The menu has the periods 30, 60, 90, 180 and 365 days. The validation accepts a value from 30 to 730 days. After you save, the page shows how many contacts the next run will mark.

### How the sunset run works

The command `php artisan contacts:apply-sunset` runs every day at 04:00. The scheduler must run for this. See [Scheduler](../self-hosting/scheduler.md).

The run marks a contact as sunset when all of these conditions are true:

- The contact is not unsubscribed and is not sunset.
- The last click of the contact is older than the period. If the contact never clicked, the date when you added the contact is older than the period.
- BYOMailer sent 3 or more emails to the contact during the period.

Only clicks count. Opens do not count, because Apple Mail Privacy Protection opens emails automatically. A contact that got fewer than 3 emails in the period is not inactive.

When the run marks a contact, BYOMailer sets the pending sequence emails of the contact to `failed` with the reason `sunset`. Newsletters skip sunset contacts.

### Reactivate a contact

A sunset contact gets email again in two cases:

- The contact clicks a link in an email. BYOMailer clears `sunset_at` at once.
- A team member clicks **Reactivate** on the contact page.

Reactivate clears only `sunset_at`. It does not change the subscription state. If the contact does not click during the next period, the run can mark it again.

If you set sunset to **Off**, the run stops. The contacts that are already sunset stay sunset. Reactivate them on their contact pages.

## Related pages

- [Lists and topics](lists-and-topics.md)
- [Tags and attributes](tags-and-attributes.md)
- [Segments and filters](segments-and-filters.md)
- [Unsubscribe and preferences](unsubscribe-and-preferences.md)
