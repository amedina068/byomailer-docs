---
title: Filters
description: The filter format that selects the audience of a newsletter, of a contact count, and of a sequence step.
order: 3
---

# Filters

A filter selects contacts by tag, list, topic, attribute, signup date, engagement or location. A `filters` array holds one or more filters.

## Where you can send filters

| Endpoint | Field | Effect |
|---|---|---|
| `POST /api/v1/newsletters` | `filters` | The audience of the newsletter. |
| `PATCH /api/v1/newsletters/{newsletterId}` | `filters` | Replaces the audience of the newsletter. |
| `POST /api/v1/newsletters/contacts/preview` | `filters` | Counts the contacts that match. Saves nothing. |
| `PATCH /api/v1/sequences/{sequenceId}/steps/{sequenceStepId}/filters` | `filters` | Replaces the filters of one sequence step. |

The REST API has no endpoint that sets the filters of a sequence. Use the dashboard or the MCP server for that.

`GET /api/v1/contacts` does not accept this format. It has its own query parameters (`lists[]`, `tags[]`, `topics[]`). See [Contacts](contacts.md).

The responses of newsletters and sequences have a `filters` array and a read-only `segment_id`. If the record uses a saved segment, `segment_id` is set and `filters` shows the filters of that segment. The API cannot set a segment. Send `filters` instead. See [Segments and filters](../using-byomailer/segments-and-filters.md).

## The filter object

| Field | Type | Required | Rules |
|---|---|---|---|
| `connector` | string | No | `and` or `or`. The default is `and`. BYOMailer ignores it on the first filter. |
| `category` | string | Yes | `attributes`, `tags`, `lists`, `topics`, `date`, `engagement` or `location`. |
| `mode` | string | For `attributes`, `tags`, `lists`, `topics` and `location` | `all`, `any` or `none`. For `location`, only `any` or `none`. |
| `operator` | string | For `date` and `engagement` | See the category. |
| `field` | string | For `location` | `country` or `timezone`. |
| `values` | array or object | Yes | See the category. |

A `filters` array can have 20 filters or fewer.

## How filters combine

BYOMailer reads the filters from first to last. Each filter after the first one joins the previous filters with its `connector`. The database applies `and` before `or`.

For example, the filters `A`, `and B`, `or C` select `(A and B) or C`.

## Mode categories

The `tags`, `lists`, `topics` and `attributes` categories use a `mode`:

| Mode | Selects contacts that match |
|---|---|
| `all` | each of the values |
| `any` | one or more of the values |
| `none` | none of the values |

### tags

`values` is an array of tag names. Each tag must exist in your account.

```json
{ "category": "tags", "mode": "any", "values": ["vip", "customer"] }
```

### lists

`values` is an array of list IDs (positive integers). Each list must exist in your account.

```json
{ "category": "lists", "mode": "all", "values": [1, 5] }
```

### topics

`values` is an array of topic IDs (positive integers). Each topic must exist in your account. A contact matches a topic only while the contact is subscribed to it.

```json
{ "category": "topics", "mode": "none", "values": [12] }
```

### attributes

`values` is an array of objects. Each object compares one contact attribute.

| Key | Type | Required | Rules |
|---|---|---|---|
| `key` | string | Yes | The name of an attribute that exists in your account. Letters, digits, spaces, `.`, `_` and `-` only. |
| `operator` | string | No | `equals`, `not_equals`, `contains`, `not_contains`, `gt`, `lt`, `is_set` or `is_not_set`. The default is `equals`. |
| `value` | string | For all operators except `is_set` and `is_not_set` | A string. For `gt` and `lt`, the string must be a number. |

```json
{
  "category": "attributes",
  "mode": "all",
  "values": [
    { "key": "plan", "operator": "equals", "value": "pro" },
    { "key": "age", "operator": "gt", "value": "21" }
  ]
}
```

### location

`field` is `country` or `timezone`. `mode` is `any` or `none`. `values` is an array of strings. BYOMailer compares them with the `country` or `timezone` value of the contact.

With `none`, BYOMailer also selects the contacts that have no value for the field.

```json
{ "category": "location", "field": "country", "mode": "any", "values": ["US", "GB"] }
```

## Operator categories

### date

The `date` category compares the date when the contact was created in BYOMailer.

| Operator | `values` | Selects contacts created |
|---|---|---|
| `before` | `{"date": "YYYY-MM-DD"}` | before the date |
| `after` | `{"date": "YYYY-MM-DD"}` | after the date |
| `in_last` | `{"days": 30}` | in the last N days |
| `more_than` | `{"days": 30}` | more than N days ago |
| `between` | `{"from": "YYYY-MM-DD", "to": "YYYY-MM-DD"}` | from the start of `from` to the end of `to` |

`days` is an integer from `1` to `3650`. For `between`, `from` must be on or before `to`.

```json
{ "category": "date", "operator": "in_last", "values": { "days": 14 } }
```

### engagement

The `engagement` category reads the newsletter mails of the contact.

| Operator | Selects contacts that |
|---|---|
| `opened` | opened a newsletter |
| `clicked` | clicked a link in a newsletter |
| `received` | received a newsletter (the mail has a delivery time, so a bounce does not count) |
| `not_opened` | did not open a newsletter |
| `not_clicked` | did not click a link in a newsletter |
| `not_received` | did not receive a newsletter |

`values` is an object:

| Key | Type | Rules |
|---|---|---|
| `newsletter_id` | integer or `null` | One newsletter of your account. `null` means any newsletter. |
| `within` | string | `ever` or `last_n_days`. The default is `ever`. |
| `days` | integer | Necessary when `within` is `last_n_days`. From `1` to `3650`. |

The `not_*` operators also select contacts that never received a newsletter. To limit the check to one campaign, set `newsletter_id`.

```json
{
  "category": "engagement",
  "operator": "not_opened",
  "values": { "newsletter_id": null, "within": "last_n_days", "days": 90 }
}
```

## Validation

The API returns `422` when a filter has one of these errors:

- The `category` is not in the list.
- A mode category has no valid `mode`.
- A `location` filter has no valid `field`, or a `mode` that is not `any` or `none`.
- A `date` or `engagement` filter has an operator that is not valid for the category.
- A value in `values` has the wrong form. For example, a tag name is empty, a list ID is not a positive integer, or an attribute condition has no `key`.
- A tag, list, topic, attribute or newsletter in `values` does not exist in your account.

The error key has the index of the filter, for example `filters.2.values`. Example messages: `The tag "vip" does not exist.`, `The list with ID 9 does not exist.` and `Choose an attribute for this filter.`

After validation, BYOMailer cleans each filter before it saves it. It removes a filter that has nothing left to match. For example, it removes a `date` filter with a date that is not in `YYYY-MM-DD` format. It also removes an attribute comparison that has no `value`. The response shows the filters that BYOMailer saved. Read them to make sure that BYOMailer kept all your filters.

## Full example

```json
{
  "filters": [
    { "connector": "and", "category": "tags", "mode": "any", "values": ["vip", "premium"] },
    {
      "connector": "and",
      "category": "attributes",
      "mode": "all",
      "values": [{ "key": "age", "operator": "gt", "value": "21" }]
    },
    { "connector": "and", "category": "date", "operator": "more_than", "values": { "days": 14 } },
    {
      "connector": "and",
      "category": "engagement",
      "operator": "not_opened",
      "values": { "newsletter_id": null, "within": "last_n_days", "days": 90 }
    },
    { "connector": "or", "category": "location", "field": "country", "mode": "any", "values": ["US", "GB"] }
  ]
}
```
