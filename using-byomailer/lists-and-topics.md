---
title: Lists and topics
description: Group contacts in lists, ask for a double opt-in, and let contacts choose topics inside a list.
order: 2
---

# Lists and topics

A list is a group of contacts. A contact can be on many lists. You use lists to import contacts, to target newsletters and sequences, and to start automations.

A topic is a content category inside one list, for example "Product updates" or "Events". A contact on the list can stop one topic and stay on the list.

## Create a list

1. Open **Lists** in the sidebar.
2. Create a new list.
3. Enter the name of the list. The name has a maximum of 255 characters and must be unique in the account.
4. Save the list.

You can also create a list from the contact page and from the import page.

The list page shows the number of contacts, the topics of the list, and the imports into the list. Click **View Contacts** to open the contacts page.

The dashboard cannot delete a list. The API can delete a list. See [API: Lists](../api/lists.md).

## Add contacts to a list

You can add contacts to a list in these ways:

| Method | Opt-in email | Opt-in state after the add |
| --- | --- | --- |
| **Lists** panel on the contact page | Not sent | Not confirmed |
| CSV import | Not sent | Confirmed at the time of the import |
| API (`POST /api/v1/lists/{listId}/contacts`) | Sent if the list has double opt-in | Confirmed at once if the list has no double opt-in |
| MCP tools (`create-contact`, `add-contact-to-list`, `bulk-update-contacts`) | Sent if the list has double opt-in | Confirmed at once if the list has no double opt-in |

BYOMailer stores the opt-in state in the `opted_in_at` field of the list membership.

When a contact joins a list, BYOMailer subscribes the contact to all topics of the list. If the contact stopped a topic before, the topic stays stopped.

## Double opt-in

With double opt-in, BYOMailer sends a confirmation email to each contact that the API or the MCP server adds to the list. The contact clicks the link in the email to confirm.

### Turn on double opt-in

Before you start, make sure that you have a verified sender identity. See [Sender identities](sender-identities.md).

1. Open the list and click **Edit**.
2. Turn on **Double opt-in**.
3. In **Send from**, select the sender identity.
4. Enter the **Subject**. The default is `Confirm your subscription`.
5. Write the **Content**. To start from the default text, click **Use template**.
6. Put `{{opt_in_url}}` in the content. This is the confirmation link.
7. Save the list.

When double opt-in is on, the subject, the content and the sender identity are required.

The subject and the content can use template variables, for example `{{ name }}`. The default content is:

```html
<p>Welcome! Click the link below to confirm your subscription:</p>
<p><a href="{{opt_in_url}}">Confirm Subscription</a></p>
```

### What happens

1. A team member, an automation, the API, the MCP server or an import adds the contact to the list.
2. A queued job sends the opt-in email through the Amazon SES credentials of the account.
3. The contact clicks the link. The link has the form `https://byomailer.example/opt-in/<uuid>`.
4. BYOMailer sets `opted_in_at` and shows the page "Subscription Confirmed".
5. On the first confirmation, BYOMailer sends the `contact.subscribed` webhook event.

The queue worker must run for step 2. See [Queues and Horizon](../self-hosting/queues-and-horizon.md).

The opt-in link uses the main host of the instance (`APP_URL`). The host of a custom link domain also accepts the `opt-in/` path. See [Custom domains](custom-domains.md).

### Unconfirmed contacts

BYOMailer adds the contact to the list before the contact confirms. Until the contact confirms, these rules apply:

- A list filter with **any** or **all** on a newsletter or a sequence skips the contact. The filter counts the contact only when `opted_in_at` has a value.
- A list filter with **none** excludes the contact, confirmed or not.
- The contact gets no topics of the list. BYOMailer adds the topics when the contact confirms.
- An import into the list does not set `opted_in_at`.

BYOMailer sends the opt-in email one time, when the contact joins the list. A second add of a contact that is already on the list sends no email. The job sends no email to an unsubscribed contact or to a contact that confirmed.

If you turn on double opt-in for a list that has contacts, the contacts without `opted_in_at` stop matching the list filter. Contacts that the API or an import added before have a value. Contacts that the dashboard or an automation added before have no value.

The opt-in email has a `List-Unsubscribe` header. If the contact uses this link, or the `{{ unsubscribe_url }}` link of the opt-in email, BYOMailer unsubscribes the contact.

## Topics

Topics let a contact stop one kind of email and stay on the list. The contact chooses topics in the preference center. See [Unsubscribe and preferences](unsubscribe-and-preferences.md).

### Create a topic

1. Open the list.
2. In **Topics**, click **New topic**.
3. Enter the name. The name has a maximum of 255 characters and must be unique in the list.
4. Enter a description if you want one. It has a maximum of 1000 characters. The preference center shows it.
5. Click **Create topic**.

When you create a topic, a queued job subscribes all contacts that are on the list at that time.

### Edit or delete a topic

The dashboard has no form to edit a topic. To change the name or the description, use the API. See [API: Topics](../api/topics.md).

To delete a topic, click **Delete** in its row, then **Delete topic**. BYOMailer deletes the topic and all subscription states of the topic. You cannot undo this.

### Topic subscribers

The **Subscribers** column of the **Topics** table shows the number of contacts that are subscribed to the topic. A contact that stopped the topic does not count.

The contact page shows the topics that the contact is subscribed to.

### How topics affect sending

A topic changes who gets an email only when the newsletter or the sequence has a topic filter. A list filter alone sends to all contacts on the list, also to the contacts that stopped a topic. To respect the topic choices, add a topic filter. See [Segments and filters](segments-and-filters.md).

## Related pages

- [Contacts](contacts.md)
- [Imports and exports](imports-and-exports.md)
- [Unsubscribe and preferences](unsubscribe-and-preferences.md)
- [API: Lists](../api/lists.md)
- [API: Topics](../api/topics.md)
