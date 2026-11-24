---
title: Segments and filters
description: Select contacts with filters, and save a filter set as a segment that newsletters and sequences can use.
order: 5
---

# Segments and filters

A filter selects contacts by their attributes, tags, lists, topics, creation date, engagement or location. Newsletters, sequences, sequence steps and segments use the same filter builder.

A segment is a saved set of filters with a name. A newsletter or a sequence that uses a segment always reads the current filters of the segment.

## How filters work

Each filter is one row in the filter builder. A row has these parts:

| Part | What it does |
| --- | --- |
| **Connector** | `AND` or `OR`. It joins the row to the rows above it. The connector of the first row has no effect. |
| **Category** | The type of data that the row checks. See [Filter types](#filter-types). |
| **Match mode** or **Condition** | How the row compares the values. It depends on the category. |
| Values | The tags, lists, attributes, dates or other values to compare. |

BYOMailer joins the rows from top to bottom. `AND` has a higher priority than `OR`, as in SQL. For example, the rows `A`, `AND B`, `OR C` select the contacts that match `A` and `B`, plus the contacts that match `C`.

### Match modes

The categories **Attributes**, **Tags**, **Lists** and **Topics** use a match mode:

| Mode | Label | The contact matches when |
| --- | --- | --- |
| `all` | **Matches all** | It matches each value of the row. |
| `any` | **Matches any** | It matches one or more values of the row. |
| `none` | **Doesn't match any** | It matches no value of the row. |

A new attribute row starts with `all`. A new tag, list or topic row starts with `any`.

## Filter types

| Category | Label | Mode or condition | Values |
| --- | --- | --- | --- |
| `attributes` | **Attributes** | `all`, `any`, `none` | One or more conditions. Each has an attribute name, an operator and a value. |
| `tags` | **Tags** | `all`, `any`, `none` | Tag names |
| `lists` | **Lists** | `all`, `any`, `none` | List IDs |
| `topics` | **Topics** | `all`, `any`, `none` | Topic IDs. Only a subscribed topic matches. |
| `date` | **Contact created date** | `before`, `after`, `in_last`, `more_than`, `between` | A date, two dates, or a number of days |
| `engagement` | **Engagement** | `opened`, `clicked`, `received`, `not_opened`, `not_clicked`, `not_received` | A time window, and one newsletter if you want |
| `location` | **Location** | `any` (**Is any of**), `none` (**Is none of**) | Country codes or time zones |

### Attribute operators

| Operator | Label | The condition is true when |
| --- | --- | --- |
| `equals` | **Equals** | The value of the attribute is the same text as the value. |
| `not_equals` | **Does not equal** | The value is different, or the contact does not have the attribute. |
| `contains` | **Contains** | The value of the attribute contains the text. |
| `not_contains` | **Does not contain** | The value does not contain the text, or the contact does not have the attribute. |
| `gt` | **Greater than** | The value of the attribute, read as a number, is more than the value. |
| `lt` | **Less than** | The value of the attribute, read as a number, is less than the value. |
| `is_set` | **Is set** | The contact has the attribute. |
| `is_not_set` | **Is not set** | The contact does not have the attribute. |

Rules for attribute conditions:

- `gt` and `lt` need a number as the value.
- `is_set` and `is_not_set` do not use a value. All other operators need a value.
- The value is text.
- The attribute name can have letters, digits, spaces, `.`, `_` and `-`.
- The attribute name must exist in the account. See [Tags and attributes](tags-and-attributes.md).
- In the `none` mode, BYOMailer reverses each condition of the row.

### Date conditions

The **Contact created date** category compares the date when you added the contact.

| Operator | Label | Values |
| --- | --- | --- |
| `before` | **Before a date** | One date |
| `after` | **After a date** | One date |
| `in_last` | **In the last N days** | A number of days |
| `more_than` | **More than N days ago** | A number of days |
| `between` | **Between two dates** | A start date and an end date. Both days are included. |

Dates use the format `YYYY-MM-DD`. A number of days is from 1 to 3650.

### Engagement conditions

The **Engagement** category checks the newsletter emails of the contact.

| Operator | Label | The contact matches when |
| --- | --- | --- |
| `opened` | **Opened** | It opened a newsletter. |
| `clicked` | **Clicked** | It clicked a link in a newsletter. |
| `received` | **Received** | A newsletter was delivered to it. A bounced email does not count. |
| `not_opened` | **Did not open** | It has no opened newsletter. |
| `not_clicked` | **Did not click** | It has no clicked newsletter. |
| `not_received` | **Did not receive** | It has no delivered newsletter. |

You can limit the condition in two ways:

- Select one newsletter. Then BYOMailer checks only that newsletter.
- Set the window to the last N days, from 1 to 3650. The default window is `ever`.

The engagement filter checks newsletters only. It does not check sequence emails.

The `not_` operators also match contacts that never got a newsletter. To make the group smaller, select one newsletter.

### Location conditions

The **Location** category compares the `country` or the `timezone` field of the contact. BYOMailer fills these fields from the IP address of an email open. See [Contacts](contacts.md).

The menu shows the countries and the time zones of your contacts. The `none` mode also matches contacts that have no location.

## Segments

### Create a segment

1. Open **Segments** in the sidebar.
2. Create a new segment.
3. Enter the name. The name has a maximum of 255 characters and must be unique in the account.
4. Enter a description if you want one. It has a maximum of 1000 characters.
5. Add one or more filters. The maximum is 20 filters.
6. Save the segment.

If the name exists, BYOMailer shows `You already have a segment with this name.` If there is no filter, BYOMailer shows `A segment needs at least one filter.`

### The segment page

The **Segments** page shows the active segments, with the number of contacts and the last update. Click **Archived** to show the archived segments.

The page of one segment shows these items:

| Item | What it shows |
| --- | --- |
| **contacts match (incl. unsubscribed)** | All contacts that match the filters. |
| **eligible recipients (subscribed)** | The contacts that match and can get email now. |
| **Filters** | The filters of the segment. |
| Newsletters and sequences | The newsletters and the sequences that use the segment. |
| **Matching contacts** | The matching contacts, 20 on each page. |

An eligible contact is not unsubscribed, not sunset, and not on the suppression list.

### Use a segment

Select the segment in the audience step of a newsletter or in the filters of a sequence. See [Newsletters](newsletters.md) and [Sequences](sequences.md).

When a newsletter or a sequence uses a segment, BYOMailer uses the filters of the segment. It does not use the filters that you set on the newsletter or the sequence.

### Edit a segment

When you edit the filters of a segment, the change applies at once to each newsletter draft and each sequence that uses the segment. The edit page lists them.

### Archive a segment

Click **Archive** on the segment page. BYOMailer hides the segment from the pickers and from the default list. Newsletters and sequences that use the segment continue to use its filters.

To use the segment again, click **Restore**.

The dashboard cannot delete a segment.

## Who gets the email

A filter or a segment selects contacts. At send time, a newsletter also skips these contacts:

- Unsubscribed contacts.
- Sunset contacts.
- Contacts on the suppression list.
- Contacts that already got this newsletter.

## Filter errors

The validation shows these errors:

| Error | Cause |
| --- | --- |
| `A match mode is required for this filter.` | An attributes, tags, lists or topics row has no mode. |
| `Location filters support "any" or "none" only.` | A location row has another mode. |
| `Choose a valid location field.` | A location row has a field that is not `country` or `timezone`. |
| `The selected operator is not valid for a date filter.` | A date row has an operator that is not in the table. The engagement category has the same error with `engagement`. |
| `Choose an attribute for this filter.` | An attribute condition has no attribute name. |
| `Choose at least one tag.` | A value in a tags row is empty or is not text. |
| `Choose at least one list.` | A value in a lists row is not a positive list ID. |
| `Choose at least one topic.` | A value in a topics row is not a positive topic ID. |
| `The selected operator is not valid for an attribute filter.` | An attribute condition has an unknown operator. |
| `The attribute "<name>" does not exist.` | An attribute condition has an unknown attribute name. |
| `The tag "<name>" does not exist.` | A tags row has an unknown tag name. |
| `The list with ID <id> does not exist.` | A lists row has an unknown list ID. |
| `The topic with ID <id> does not exist.` | A topics row has an unknown topic ID. |
| `The selected newsletter does not exist.` | An engagement row has an unknown newsletter. |

On the segment form, each error shows under its filter. If BYOMailer does not save the filters, the filter editor stays open.

The API uses the same filters, in JSON. See [API: Filters](../api/filters.md).

## Related pages

- [Contacts](contacts.md)
- [Lists and topics](lists-and-topics.md)
- [Tags and attributes](tags-and-attributes.md)
- [Newsletters](newsletters.md)
- [Sequences](sequences.md)
