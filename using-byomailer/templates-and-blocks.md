---
title: Templates and blocks
description: Reuse the same email layout and the same pieces of content, and personalize them with variables.
order: 10
---

# Templates and blocks

BYOMailer has three tools to reuse content in newsletters and sequence steps:

| Tool | What it is | How you use it |
|---|---|---|
| Email template | A layout with one content slot. | Apply it to a newsletter or a step. |
| Block | A named piece of HTML. | Insert `{{ block.<name> }}` in the content. |
| Variable | A placeholder for a value of the contact or the account. | Write `{{ <name> }}` in the subject or the content. |

## Email templates

An email template is the layout of an email: for example the header, the footer and the colors. It has one content slot. A newsletter or a step puts its own content into the slot.

Templates belong to the account. All team members of the account can use them.

### Create a template

1. Open **Email Templates** and click **New template**.
2. Pick a starter, or start from a blank template. BYOMailer makes a copy for your account and opens it in the editor.
3. Edit the layout.
4. Make sure that the template has the `{{ content }}` placeholder one time.
5. Add a link to `{{ unsubscribe_url }}`, for example in the footer.
6. Save.

You cannot use a starter directly. BYOMailer always makes a copy for your account.

A new account starts with one template, a copy of the system default template.

### Rules for a template

| Rule | Error |
|---|---|
| The template has a name of 255 characters or fewer. | The standard validation error. |
| The template has a `{{ content }}` placeholder. | `The template must include a {{ content }} placeholder where the newsletter or step content will go.` |
| The template has only one `{{ content }}` placeholder. | `The template can only include one {{ content }} placeholder.` |
| The template has a link with `href="{{ unsubscribe_url }}"`, or you confirm that you want to save without one. | `Template is missing an unsubscribe link. Confirm you want to save without one or add a link using the {{ unsubscribe_url }} variable.` |

BYOMailer does not accept HTML that can run code. It refuses these tags: `script`, `iframe`, `object`, `embed`, `form`, `input`, `textarea`, `select`, `button`, `applet`, `meta`, `link`, `base`, `svg` and `math`. It also refuses event attributes such as `onclick`, `javascript:` URLs and CSS `expression(`.

### The default template

Each account has one default template. New newsletters and new sequence steps start with the default template.

- The first template of an account becomes the default.
- To change the default, click the star of a template in the list.
- You cannot archive the default template. BYOMailer shows: `You cannot archive the default template. Set another template as default first.`

### Archive and duplicate

- Archive a template to hide it from the list. You can restore it later.
- Duplicate a template to make a copy. The copy has the name of the template with ` (copy)` at the end.

BYOMailer has no action to delete a template.

### The content slot

When you apply a template to a newsletter or a step, the editor shows the full template. You can edit only the content slot. The rest of the template is locked.

BYOMailer stores the content of the slot in the `<div data-slot="content">` element. Do not remove this element. If it is missing, BYOMailer does not save the content and shows this error: `Message must keep the template content slot. Re-apply the template or edit inside the slot.`

To use a different template, open the template picker in the editor and pick another template. BYOMailer moves the content of the slot into the new template. To remove the template, click **Remove template**. The content stays in a plain editor.

The two variants of an A/B test use the same template. See [A/B tests](ab-tests.md).

### Changes to a template

BYOMailer stores the content of the slot apart from the template. At send time, it puts the slot content into the current version of the template. Thus a change to a template applies to all emails that BYOMailer did not send yet.

The command `messages:resync-templates` writes the current template into the stored HTML and text of the newsletters and steps that did not send yet. The option `--template=<id>` limits the command to the messages of one template:

```bash
php artisan messages:resync-templates --template=12
```

At send time, BYOMailer removes the `<div data-slot="content">` element and keeps its content.

## Blocks

A block is a named piece of HTML, for example a signature, a banner or a list of social links. You write it one time and insert it in many emails.

Blocks belong to the account.

### Create a block

1. Open **Blocks** and create a block.
2. Enter a name. Use only lowercase letters, numbers and underscores. For example: `footer_social`.
3. Enter the HTML of the block.
4. Save.

The name must be unique in the account. The HTML has the same safety rules as a template.

### Use a block

In the content editor, click **Insert block** and pick the block. The editor inserts this placeholder:

```text
{{ block.footer_social }}
```

BYOMailer replaces the placeholder at send time with the current HTML of the block. Thus a change to a block applies to all emails that BYOMailer did not send yet.

- In the HTML body, BYOMailer inserts the HTML of the block.
- In the plain-text body, the subject and the preview text, BYOMailer inserts the block as plain text.
- If no block has that name, BYOMailer inserts an empty string.

If you delete a block, the emails that use it get an empty string in its place.

TODO(owner): BYOMailer replaces the blocks before the variables, but it reads the variable names from the message, not from the block. Can a block contain `{{ variable }}` placeholders?

## Variables

A variable is a placeholder that BYOMailer replaces for each contact. Write the name of the variable between double braces:

```html
<p>Hello {{ name }},</p>
```

The spaces inside the braces are optional. `{{name}}` and `{{ name }}` are the same. Use letters, numbers and underscores in the name.

You can use variables in the subject, the preview text and the content of a newsletter or a step. You can also use them in a template.

### Built-in variables

| Variable | Value |
|---|---|
| `{{ unsubscribe_url }}` | The unsubscribe link of this email. See [Unsubscribe and preferences](unsubscribe-and-preferences.md). |
| `{{ preferences_url }}` | The link to the preference center of the contact. |
| `{{ postal_address }}` | The postal address of the account, from **Settings**, **Profile**. |
| `{{ opt_in_url }}` | The opt-in link. Only the opt-in email of a list has a value for it. See [Lists and topics](lists-and-topics.md). |
| `{{ content }}` | The content slot. Use it only in a template. |
| `{{ block.<name> }}` | The block with this name. |

If the identity of the sender has a verified custom link domain, the links of `{{ unsubscribe_url }}` and `{{ preferences_url }}` use that domain. See [Custom domains](custom-domains.md).

### Contact variables

Any other name is a contact variable. BYOMailer looks for the value in this order:

1. A column of the contact with this name: `name`, `email`, `country` or `timezone`.
2. A custom attribute of the contact with this name. See [Tags and attributes](tags-and-attributes.md).
3. The default value of the newsletter or the sequence.
4. The global default value of the attribute, from the **Attributes** page.
5. An empty string.

BYOMailer uses the first value that is not empty. If no value exists, the variable becomes an empty string. Set a default value to avoid an empty place in the email. For example, the subject is:

```text
Hello {{ first_name }},
```

With the default value `there`, a contact without `first_name` gets "Hello there,".

For the default values of a newsletter, see [Newsletters](newsletters.md). For the default values of a sequence, see [Sequences](sequences.md).

### Variables in links

You can put a query string after a variable in a link:

```html
<a href="{{ checkout_url }}?coupon=SPRING">Buy now</a>
```

If the value of `checkout_url` already has a `?`, BYOMailer joins the query string with `&`. If the value has no `?`, BYOMailer keeps the `?`. Thus the link always has a correct query string.
