---
title: Imports and exports
description: Import contacts from a CSV or Excel file into a list, and export contacts and sequence step emails as CSV.
order: 4
---

# Imports and exports

You can import contacts from a file into one list. You can export contacts and the emails of a sequence step as CSV files.

## Import contacts

### Prepare the file

BYOMailer accepts files with the extensions `csv`, `txt`, `xlsx` and `xls`. The first row must hold the column names.

BYOMailer reads the columns by their names. There is no mapping step. BYOMailer makes each column name lowercase and changes each group of other characters to `_`. Then it compares the result with these names:

| Column | Required | What BYOMailer does with it |
| --- | --- | --- |
| `email` | Yes | The email address of the contact. |
| `name` | No | The name of the contact. |
| `tags` | No | Tag names, separated with commas. BYOMailer creates a tag that does not exist. |
| Any other column | No | An attribute. The attribute name is the column name as written in the file, without spaces at the start and the end. |

For example, `Email`, `EMAIL` and ` email ` all become `email`. `E-mail` becomes `e_mail`, so BYOMailer reads it as an attribute and not as the email column.

Example file:

```csv
email,name,tags,company,plan
ana@example.com,Ana Diaz,"customer,beta",Example Inc,pro
li@example.com,,newsletter,,free
```

### Run the import

Before you start, make sure that the list exists. You can create it from the import page.

1. Open **Contacts** in the sidebar.
2. Click **Import contacts**.
3. In **Add to list**, select the list.
4. In **Contacts file**, select the file.
5. Click **Import contacts**.

BYOMailer reads the file, then puts the rows on the queue in batches of 50 rows. The queue worker must run. See [Queues and Horizon](../self-hosting/queues-and-horizon.md).

After the upload, BYOMailer opens the **Lists** page. To follow the progress, open the list. The **Imports** table shows the status, the progress and the number of processed rows.

| Import status | Meaning |
| --- | --- |
| `pending` | BYOMailer created the import. |
| `processing` | The queue processes the batches. |
| `completed` | All batches are done. |
| `failed` | A batch failed. The import shows the error message. |

BYOMailer tries each batch 3 times, with 5 seconds between the tries.

### What the import does with each row

- If the email is empty or not valid, BYOMailer skips the row. Skipped rows are not part of the total of the import.
- If no contact has the email, BYOMailer creates the contact.
- If a contact has the email, BYOMailer updates that contact. A row with the same email two times updates the same contact.

When BYOMailer updates a contact:

- An empty `name` cell keeps the current name.
- An empty attribute cell keeps the current value. A cell with a value replaces the current value.
- The tags in the `tags` cell are added. BYOMailer does not remove tags.
- BYOMailer adds the contact to the list and sets the opt-in state to confirmed. It does not send the opt-in email.

The import does not change the subscription state. An unsubscribed contact stays unsubscribed and gets no email. An address on the suppression list also gets no email.

If the first row has no `email` column, BYOMailer imports nothing.

### Limits

| Limit | Value |
| --- | --- |
| File types | `csv`, `txt`, `xlsx`, `xls` |
| Lists for each import | 1, required |
| Rows for each queued batch | 50 |
| File size | No rule in the validation |

TODO(owner): The import request has no file size rule, and the repository sets no `upload_max_filesize`, `post_max_size` or proxy body size. What is the largest file that an instance accepts?

TODO(owner): The import finds an existing contact by `user_id` and `email`, but the database key is `client_id` and `email`. What happens when a team member imports an email that another team member added?

## Export contacts

1. Open **Contacts** in the sidebar.
2. Set the search and the filters that you want. The export uses the same search, list, tag and status filters as the page.
3. Click **Export**.

BYOMailer downloads the file `contacts.csv`. It has these columns:

| Column | Content |
| --- | --- |
| `email` | The email address. |
| `name` | The name. |
| `lists` | The list names, separated with commas. |
| `tags` | The tag names, separated with commas. |
| `subscribed_at` | The date and time when the contact was added. |
| `unsubscribed_at` | The date and time of the unsubscribe, or empty. |
| `unsubscribed_by_contact` | `true` or `false`. |
| `complained_at` | The date and time of the last complaint, or empty. |
| `bounced_at` | The date and time of the last bounce, or empty. |
| One column for each attribute | The value of the attribute, or empty. |

The dates have the format `Y-m-d H:i:s`.

By default the export does not include unsubscribed contacts. To include them, select **Status** > **Include unsubscribed** before you export.

TODO(owner): The export and the contacts page read `$user->contacts()`, and the attribute columns read only the attributes with the `user_id` of the team member. Must a team member see the contacts and attributes that other team members added?

## Export the emails of a sequence step

1. Open the sequence, then open the contacts of a step.
2. Select a filter if you want one, for example `clicked`.
3. Click **Export history CSV**.

BYOMailer downloads the file `sequence-<sequence id>-step-<step id>-contact-mails.csv`. The page shows only the contacts that are at the step now. The CSV has all emails of the step that match the filter, also for contacts that went to a later step or finished the sequence.

The filter values are `all`, `pending`, `sent`, `delivered`, `opened`, `clicked`, `bounced`, `rejected`, `complained`, `unsubscribed`, `failed` and `skipped`.

The CSV has these columns: `email`, `name`, `status`, `variant`, `subject`, `from_email`, `from_name`, `scheduled_at`, `sent_at`, `delivered_at`, `opened_at`, `clicked_at`, `bounced_at`, `complained_at`, `rejected_at`, `unsubscribed_at`, `failure_reason`, `body`.

The `subject` and `body` columns hold the text with the values of the contact. If a cell starts with `=`, `+`, `-`, `@`, a tab or a carriage return, BYOMailer adds `'` before it. Spreadsheet applications then do not run the cell as a formula.

The API and the MCP server can also export this CSV. See [MCP tools reference](../mcp/tools-reference.md).

## Export the recipients of a newsletter

The newsletter page has an **Export CSV** button for the recipients. See [Newsletters](newsletters.md).

## Related pages

- [Contacts](contacts.md)
- [Lists and topics](lists-and-topics.md)
- [Tags and attributes](tags-and-attributes.md)
- [Sequences](sequences.md)
