---
title: Unsubscribe and preferences
description: The unsubscribe links, one-click unsubscribe, resubscribe, the preference center, and the compliance warnings before a send.
order: 14
---

# Unsubscribe and preferences

Each newsletter email and each sequence email gets its own unsubscribe links. A contact can unsubscribe from all email, subscribe again, or choose topics in the preference center. BYOMailer also adds the one-click unsubscribe headers that Gmail and Yahoo require from bulk senders.

## The links in an email

BYOMailer makes these links for each email, from the `uuid` of the email record:

| Link | Path | How you add it |
| --- | --- | --- |
| Unsubscribe page | `/unsubscribe/<uuid>` | Put `{{ unsubscribe_url }}` in the content. |
| Preference center | `/preferences/<uuid>?signature=<signature>` | Put `{{ preferences_url }}` in the content. |
| One-click unsubscribe | `/one-click-unsubscribe/<uuid>` | BYOMailer adds it to the `List-Unsubscribe` header. |

The host of the links is the custom link domain of the sender identity, if the domain is verified. If not, the host is the main host of the instance (`APP_URL`). See [Custom domains](custom-domains.md).

The unsubscribe links work only for newsletter and sequence emails. If the contact and the newsletter or the sequence do not belong to the same team member, the link returns `404`.

### Placeholders

| Placeholder | Value |
| --- | --- |
| `{{ unsubscribe_url }}` | The link to the unsubscribe page of this email. |
| `{{ preferences_url }}` | The signed link to the preference center of this email. |
| `{{ postal_address }}` | The postal address of the account. See [Postal address](#postal-address). |

These names are reserved. Do not use them as attribute names.

Example footer:

```html
<p>{{ postal_address }}</p>
<p>
  <a href="{{ unsubscribe_url }}">Unsubscribe</a> ·
  <a href="{{ preferences_url }}">Email preferences</a>
</p>
```

## The unsubscribe page

1. The contact clicks the `{{ unsubscribe_url }}` link.
2. BYOMailer shows the page "Unsubscribe from these emails?".
3. The contact clicks **Yes, unsubscribe me**.
4. BYOMailer unsubscribes the contact and shows a confirmation with a **Subscribe Again** button.

The first visit to the page does not change anything. Link scanners and mail clients open each link in an email. Because of this, only the button unsubscribes the contact.

If the contact already unsubscribed, the page shows "You are already unsubscribed" and a **Subscribe again** button.

When a contact unsubscribes, BYOMailer does these steps:

1. It sets `unsubscribed_at` on the contact and `unsubscribed_by_contact` to `true`.
2. It sets `unsubscribed_at` on the email record. The contact page shows this time in the history.
3. It removes the pending emails of the contact and removes the contact from all sequences.
4. It sends the `contact.unsubscribed` webhook event. See [Webhooks](webhooks.md).

## One-click unsubscribe (RFC 8058)

Each newsletter email and each sequence email has these headers:

```text
List-Unsubscribe: <https://byomailer.example/one-click-unsubscribe/<uuid>>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

Mailbox providers show an unsubscribe button next to the sender. When the contact clicks it, the provider sends a `POST` to the link. BYOMailer unsubscribes the contact and returns `200` with the text `Unsubscribed`.

The `one-click-unsubscribe/*` path has no CSRF check, because the provider sends no cookies and no token. The action is idempotent. A second `POST` changes nothing.

Some older mail clients send a `GET` to this link. BYOMailer then shows the normal unsubscribe page, and the contact must confirm.

BYOMailer adds the headers also when the content has no `{{ unsubscribe_url }}` link.

## Resubscribe

A contact that unsubscribed can subscribe again in these ways:

- The **Subscribe again** button on the unsubscribe page.
- The link `/resubscribe/<uuid>`. It shows the page "Subscribe again?". The contact confirms with a button.
- The **Resubscribe** button in the preference center.

As with the unsubscribe page, a `GET` does not change anything. Only the confirmation button changes the state.

When a contact subscribes again, BYOMailer clears `unsubscribed_at`, sets `unsubscribed_by_contact` to `false`, and sends the `contact.resubscribed` webhook event.

A contact that unsubscribed with a link can subscribe again only with these links. The dashboard does not show the **Subscribe** button for this contact. See [Contacts](contacts.md).

## The preference center

The preference center lets a contact choose topics. It shows the topics of each list that the contact is on. For each topic, it shows the name, the description, the list name, and the state **Subscribed** or **Paused**.

The contact can do these actions:

| Action | Result |
| --- | --- |
| Turn topics on or off, then click **Save preferences** | BYOMailer saves the topic states. If the contact was unsubscribed and turns on one or more topics, BYOMailer subscribes the contact again. |
| **Turn off all topics** | Turns off all topics on the page. The contact must then click **Save preferences**. |
| **Unsubscribe from all emails**, then **Yes, unsubscribe** | BYOMailer unsubscribes the contact and pauses all topics. |
| **Resubscribe** | BYOMailer subscribes the contact again and turns on all paused topics. |

A topic choice changes who gets an email only when the newsletter or the sequence has a topic filter. See [Lists and topics](lists-and-topics.md) and [Segments and filters](segments-and-filters.md).

### The signed link

The link to the preference center has a signature. If the signature is not valid, BYOMailer refuses the page. The signature does not expire.

If you move the instance to a new host, add the old URL to `APP_PREVIOUS_URLS`. Then the signed links in old emails continue to work. See [Configuration](../getting-started/configuration.md).

The unsubscribe and resubscribe links have no signature. The `uuid` of the email record identifies the contact.

## Test emails

A test email has the same links. When you open them, the pages show a notice. No action changes a contact.

## Postal address

Laws such as CAN-SPAM ask for a postal address in each marketing email.

1. Open **Settings** > **Profile**.
2. Enter the address in **Postal address**. The maximum is 500 characters.
3. Save the profile.
4. Put `{{ postal_address }}` in the footer of your templates.

The field is optional. The address belongs to the account, so each team member sees the same value.

## Compliance warnings

BYOMailer checks the content before a newsletter is scheduled or sent, and before a sequence or a step goes live. The check gives two kinds of results:

- Problems block the send: an empty subject or an empty body.
- Warnings never block the send. The sender is responsible for them.

These are the warnings:

| Warning | Condition |
| --- | --- |
| `The content has no unsubscribe link ({{ unsubscribe_url }}). Laws such as CAN-SPAM and GDPR ask for an unsubscribe link in marketing email. BYOMailer still adds the one-click List-Unsubscribe header that Gmail and Yahoo require for bulk senders.` | The HTML and the text of the content have no `{{ unsubscribe_url }}`. |
| `Variant B has no unsubscribe link ({{ unsubscribe_url }}).` followed by the same reason | Variant B of an A/B test has no `{{ unsubscribe_url }}`. |
| `Your account has no postal address. Laws such as CAN-SPAM ask for a postal address in each marketing email. Add it in Settings, Profile, and put {{ postal_address }} in the footer.` | The account has no postal address. |

For a sequence, BYOMailer shows the unsubscribe warning for each live step without the link. The text starts with `Step #<id>:`.

The check looks for `{{ unsubscribe_url }}` only. It does not look for `{{ preferences_url }}`.

## Related pages

- [Contacts](contacts.md)
- [Lists and topics](lists-and-topics.md)
- [Newsletters](newsletters.md)
- [Sequences](sequences.md)
- [Deliverability](deliverability.md)
