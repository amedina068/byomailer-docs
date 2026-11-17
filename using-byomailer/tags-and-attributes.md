---
title: Tags and attributes
description: Label contacts with tags, and store custom data on contacts with attributes and their global defaults.
order: 3
---

# Tags and attributes

Tags and attributes add your own data to a contact.

- A tag is a label without a value, for example `customer` or `webinar-2026`.
- An attribute is a named value, for example `company` = `Example Inc`.

You can use both in segments and filters. You can use attributes as template variables in emails.

## Tags

### Create a tag

1. Open **Tags** in the sidebar.
2. Click **Create tag**.
3. Enter the name. The name has a maximum of 255 characters.
4. Save the tag.

Tag names are unique in the account. The **Tags** page shows each tag with its number of contacts and its creation date.

### Add a tag to a contact

1. Open the contact page.
2. In the **Tags** panel, click the plus button.
3. Select a tag, or create a new tag.

To remove a tag from a contact, click the remove button on the tag in the **Tags** panel.

Other ways to add tags:

- The `tags` column of a CSV import. See [Imports and exports](imports-and-exports.md).
- The API and the MCP server. If a tag name does not exist, they create the tag.
- An automation. See [Automations](automations.md).

The dashboard cannot rename or delete a tag. The API can. See [API: Tags](../api/tags.md).

A change of tags can start an automation and can remove a contact from a sequence with a tag filter.

## Attributes

An attribute stores one value on a contact, under a name. BYOMailer stores all attributes of a contact in the `extra_attributes` JSON column.

### Add an attribute to a contact

1. Open the contact page.
2. In the **Attributes** panel, click the plus button.
3. Select an existing attribute name, or select **Custom...** and enter a new name.
4. Enter the value.
5. Click **Add**.

In the dashboard, the name and the value are text with a maximum of 255 characters each.

To change a value, click the edit button on the attribute. To remove the attribute from the contact, click the remove button.

### Where attribute names come from

When BYOMailer saves a contact, it adds each new attribute name to the attribute names of the account. This happens for the dashboard, the CSV import, the API and the MCP server. The names show on the **Attributes** page and in the filter builder.

The keys in `extra_attributes` are case-sensitive. `Company` and `company` are two different keys. Use one spelling for each attribute.

The dashboard cannot rename or delete an attribute name.

### How values are stored

`extra_attributes` is a JSON object. The type of each value depends on how you set it:

| Source | Value types |
| --- | --- |
| Dashboard | Text |
| CSV import | Text. A date cell from an Excel file becomes text in the format `Y-m-d H:i:s`. A boolean cell becomes `1` or `0`. |
| API and MCP server | Any JSON value: text, number, boolean, array or object |

Example of a stored value:

```json
{
  "company": "Example Inc",
  "seats": 12,
  "interests": ["design", "email"]
}
```

BYOMailer compares values as text when it checks for a change. An array or an object becomes its JSON text. This comparison decides if an `attribute_changed` automation starts.

TODO(owner): What does a `{{ placeholder }}` show when the attribute value is an array or an object? `Contact::getTemplateAttribute()` casts the value to a string.

### Attributes in emails

Put the attribute name in a placeholder, for example `{{ company }}`. When BYOMailer sends the email, it replaces the placeholder with the value of the contact.

To use an attribute in a placeholder, give it a name with letters, digits and underscores only.

BYOMailer uses the first value that it finds in this order:

1. The value of the contact.
2. The default of the variable in the newsletter or the sequence.
3. The global default of the attribute.
4. An empty value.

See [Newsletters](newsletters.md) and [Sequences](sequences.md) for the defaults of a newsletter or a sequence.

## The attributes page

The **Attributes** page lists the attribute names of the account. Each name has a **Global default** field.

### Set a global default

1. Open **Attributes** in the sidebar.
2. Enter a value in the **Global default** field of the attribute. The maximum is 255 characters.
3. Save the value.

To remove a global default, clear the field and save.

BYOMailer reads the global default when it sends each email. A change of a global default does not change the variable defaults that you saved in a newsletter or a sequence.

## Related pages

- [Contacts](contacts.md)
- [Segments and filters](segments-and-filters.md)
- [Templates and blocks](templates-and-blocks.md)
- [API: Contacts](../api/contacts.md)
