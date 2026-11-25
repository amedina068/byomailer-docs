---
title: Link clicks
description: Name the links of an email, see who clicked each link, and start an automation when a contact clicks a named link.
order: 9
---

# Link clicks

BYOMailer counts the clicks on each link of a newsletter or a sequence step. It shows the contacts who clicked each link. An automation can also start when a contact clicks a named link.

BYOMailer counts clicks only when the sender identity has **Track clicks** on. See [Open and click tracking](sender-identities.md#open-and-click-tracking).

## Named links

A link without a name groups its clicks by its URL. But the final URL of a link can change. BYOMailer adds UTM parameters, and a `{{ variable }}` gives each contact a different value. You can also edit the destination. A link name gives the link an identity that does not change.

### Name a link in the editor

1. Select the text of the link in the editor.
2. Click **Add link** in the toolbar.
3. In **Link name**, enter a name, for example `Black Friday`.
4. Click **Insert link**.

Links with the same name in different emails count together. The automation trigger uses the name too.

### Name a link in HTML

Add a `data-bm-link` attribute to the `<a>` tag:

```html
<a href="https://example.com/sale" data-bm-link="black-friday">Shop the sale</a>
```

Use this attribute in content that you send through the API or the MCP server.

### Rules for a link name

- BYOMailer changes a name to lowercase letters, digits and dashes. "Black Friday" becomes `black-friday`.
- A name has a maximum of 100 characters.
- A name must contain a letter or a digit.
- Only emails that you send after you name a link carry the name. The clicks on older emails group by URL.

At send time, BYOMailer changes the `data-bm-link` attribute to an SES link tag (`ses:tags`). SES returns the tag in each click event. The stored content keeps the `data-bm-link` attribute.

## The link report

The **Links** panel shows one row for each link:

| Column | Meaning |
|---|---|
| Link | The link name, or the URL for a link without a name. A named link also shows the URL with the most clicks. |
| Unique contacts | The number of contacts who clicked the link. |
| Total clicks | All clicks on the link, also repeated clicks. |
| Click rate | The unique contacts divided by the delivered emails, times 100. |

A link without a name groups by its URL without the `utm_*` parameters and without the `#fragment`.

### See who clicked a link

- On a newsletter page, click a row in the **Links** panel. The **Recipients** table then shows only the contacts who clicked that link, with their number of clicks.
- On the contacts page of a sequence step, click a row in the **Links** panel. The table then shows only the contacts who clicked that link, with their last click.

To remove the filter, click the **x** on the **Clicked** chip.

The CSV export of the recipients does not use the link filter.

### Bot clicks

Some mail servers open each link of an email to scan it, for example Microsoft Safe Links and Mimecast. SES counts these visits as clicks. BYOMailer does not filter them yet. It stores the user agent and the IP address of each click for a future filter.

## Start an automation on a click

The trigger **Link clicked** (`link_clicked`) starts an automation when a contact clicks a named link. See [Automations](automations.md).

1. Open **Automations** and click **New automation**.
2. In **Condition**, select **Link clicked**.
3. Enter the link name. The field suggests the link names of your content.
4. Select the action and save the automation.

In a visual automation, select **Link clicked** in the trigger node and enter the link name.

- The trigger matches the normalized name. "Black Friday" matches the link `black-friday`.
- A click on a link without a name does not start an automation.
- A visual automation enrolls a contact one time. A second click does not start the workflow again.

## API and MCP

- The REST API reads the report. See [Link clicks API](../api/link-clicks.md).
- The MCP tool `link-clicks-tool` reads the report, and the automation tools accept the `link_clicked` condition. See [MCP tools reference](../mcp/tools-reference.md).
