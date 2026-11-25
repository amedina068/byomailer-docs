---
title: Send your first newsletter
description: Send a first newsletter from a new account. Add a sender identity and a postal address, make a list, add contacts, write, test and send.
order: 6
---

# Send your first newsletter

This procedure takes a new account to its first sent newsletter. The dashboard shows the same items in the **Getting Started** checklist:

| Checklist item | Page |
|---|---|
| Add AWS credentials | `/onboarding/aws` |
| Create email identity | `/settings/identities` |
| Set up domain tracking | `/settings/identities` |
| Add storage | `/settings/storage` |
| Import contacts | `/contacts/import` |
| Send a newsletter | `/newsletters/create` |

This page covers the items that are necessary for a first send. Domain tracking and storage are optional for a first send.

## Before you start

- The instance runs the `horizon`, `scheduler`, and `ses-events` processes. Horizon sends the newsletter batches. The scheduler starts the scheduled newsletters each minute.
- Your user connected AWS. Read [Connect AWS SES](connect-aws-ses.md).
- If your SES account is in the sandbox, SES sends only to verified addresses. Use only your own verified addresses until AWS gives production access.

## 1. Add a sender identity

1. Open **Settings > Identities**.
2. Click **Add Identity**, then complete the wizard. [Connect AWS SES](connect-aws-ses.md) gives each step.
3. Publish the DNS records that the wizard shows.
4. Wait until the identity is verified. SES does not send from a domain that it did not verify.

## 2. Enter your postal address

1. Open **Settings > Profile**.
2. Enter the **Postal address** of your company.
3. Save the profile.

The `{{ postal_address }}` variable puts this address in the email. The field is optional. While it is empty, BYOMailer shows a warning before you send, but it does not block the send.

## 3. Make a list

A contact import adds the contacts to one list, so make the list first.

1. Open **Lists** in the sidebar.
2. Click **Create list**.
3. Enter a name, for example `Newsletter`.
4. Save the list.

[Lists and topics](../using-byomailer/lists-and-topics.md) explains the list settings, for example the opt-in email.

## 4. Add contacts

Do one of these procedures.

To import a file:

1. Open **Contacts** in the sidebar.
2. Click **Import contacts**.
3. In **Add to list**, select your list.
4. In **Contacts file**, select a CSV, XLSX, or XLS file.
5. Click **Import contacts**.

The file must have an `email` column. BYOMailer also reads the `name` and `tags` columns. It saves the other columns as custom attributes. It skips each row without an email address. [Imports and exports](../using-byomailer/imports-and-exports.md) explains the file format.

To add one contact:

1. Open **Contacts** in the sidebar.
2. Click **Create contact**.
3. Enter the email address. Optional: enter the name.
4. Save the contact.

If the email address already exists, the form shows "A contact with this email already exists."

## 5. Write the newsletter

1. Open **Newsletters** in the sidebar.
2. Click **New newsletter**.

The newsletter editor has five steps: **Content**, **Variables**, **Audience**, **Preview**, and **Schedule**.

### Content

1. Enter a **Title**. The title is for internal use. Contacts do not see it.
2. Enter the **Subject**.
3. Optional: enter the **Preview text**. Inbox apps show it next to the subject.
4. Optional: click **Use template** to start from an email template.
5. Write the content in the editor.
6. Add a link to `{{ unsubscribe_url }}` in the content.
7. Click **Save & continue**.

If the content has no `{{ unsubscribe_url }}` link, BYOMailer shows a warning. The warning does not block the send. BYOMailer always adds the one-click `List-Unsubscribe` header.

### Variables

BYOMailer lists the `{{ variable }}` placeholders that it found in the content.

1. For each variable, enter a default value. BYOMailer uses it when a contact has no value.
2. Click **Save & continue**.

If the content has no variables, continue to the next step.

### Audience

1. Click **Add filter**.
2. Select **Lists**, then select your list.
3. Click **Save**.

BYOMailer shows the number of contacts that will receive the newsletter. If you save with no filter, BYOMailer asks "Send to all contacts?". Click **Add filters** to go back, or **Continue without filters** to send to all active contacts. [Segments and filters](../using-byomailer/segments-and-filters.md) explains the filters.

### Preview

1. Read the subject and the rendered email.
2. Click **Continue to schedule**.

## 6. Send a test email

1. In the **Schedule** step, select the sender identity in **Send from**.
2. In **Send yourself a test**, click **Send test email**.
3. Open your inbox and read the email.

BYOMailer sends the test email to the email address of your user. The page shows "Test email sent to" and your address.

## 7. Schedule or send

In the **Schedule** step, do one of these procedures.

To send later:

1. In **Schedule for later**, select a date and a time. The page shows the times in the timezone of your account.
2. Click **Schedule send**.

The time must be in the future. If not, the page shows "The scheduled time must be in the future." The scheduler starts the newsletter within one minute after the scheduled time.

To send now:

1. Click **Send now**.
2. In the **Send newsletter now?** dialog, read the warnings.
3. Click **Send now**.

BYOMailer starts to send at once to all contacts that match the audience. To keep the newsletter as a draft, click **Save draft**.

## After the send

Open the newsletter in **Newsletters** to see the deliveries, opens, clicks, bounces, and complaints. These numbers come from the SES events, so the `ses-events` worker must run. [Newsletters](../using-byomailer/newsletters.md) explains the statistics and the other newsletter options.
