---
title: Newsletters
description: Write a newsletter, choose its audience, and send it now or at a scheduled time.
order: 6
---

# Newsletters

A newsletter is one email that BYOMailer sends one time to a group of contacts. BYOMailer sends it through the Amazon SES account of your account.

## Before you start

Make sure that these items are ready:

- Your account has AWS credentials. See [Connect AWS SES](../getting-started/connect-aws-ses.md).
- Your account has a verified sender identity. See [Sender identities](sender-identities.md).
- The scheduler and the queue workers run. See [Scheduler](../self-hosting/scheduler.md) and [Queues and Horizon](../self-hosting/queues-and-horizon.md).
- SES sends its events to BYOMailer. Without the events, the stats stay at zero. See [SES events](../self-hosting/ses-events.md).

## The newsletter wizard

Open **Newsletters** and click **New newsletter**. BYOMailer makes a draft and opens the wizard. The wizard has five steps:

| Step | Title in the wizard | What you do |
|---|---|---|
| 1 | Content | Write the title, the subject, the preview text and the body. |
| 2 | Variables | Set a default value for each `{{ variable }}` in the content. |
| 3 | Audience | Choose the contacts that get the newsletter. |
| 4 | Preview | Read the subject and the body. |
| 5 | Schedule | Choose the sender, send a test, and send now or later. |

The wizard shows the **Variables** step only when the subject or the body has a `{{ variable }}`.

Each step saves the draft. You can close the wizard and come back later.

### Step 1: Content

1. Enter the **Title**. Only you see the title. It is not the subject.
2. Enter the **Subject**.
3. Optional: enter the **Preview text**. Inbox clients show it next to the subject.
4. Write the body in the **Content** editor.
5. Optional: click **Use template** to put the body into an email template.
6. Optional: turn on **Enable A/B testing**. See [A/B tests](ab-tests.md).
7. Save the step to go to the next step.

The title, the subject and the content are required. The title, the subject and the preview text have a limit of 255 characters.

The content editor is a rich-text editor. It has headings (levels 1 to 3), bold, italic, underline, lists, links, text alignment, colors, fonts and font sizes. It can also do these actions:

- Upload an image (JPEG, PNG, GIF or WebP, 5 MB or less), or choose an image from your gallery.
- Insert a block. See [Templates and blocks](templates-and-blocks.md).

When a template is applied, the editor shows the full template. You can edit only the content slot. If the slot is missing, BYOMailer does not save and shows this error: `Message must keep the template content slot. Re-apply the template or edit inside the slot.`

BYOMailer makes the plain-text part of the email from the HTML body. You do not write the plain-text part.

### Step 2: Variables

This step lists each `{{ variable }}` that the subject or the body uses. Enter a default value for each variable. The default value has a limit of 255 characters.

A default value fills the variable when the contact has no value for it. If the value is the same as the global default on the **Attributes** page, the field shows `This matches your global default.`

For the order in which BYOMailer looks for a value, see [Values of the variables](#values-of-the-variables).

### Step 3: Audience

Choose the contacts that get the newsletter. You can use one of these two methods:

- A saved segment.
- Filters that you set for this newsletter only.

You cannot use the two methods together. If you choose a segment, BYOMailer clears the filters of the newsletter.

The filters use these categories: attributes, tags, lists, topics, date, engagement and location. Each filter after the first one has a connector, `and` or `or`. For the details of each filter, see [Segments and filters](segments-and-filters.md).

The step shows the number of contacts that will get the newsletter. If you set no filter, the newsletter goes to all active contacts.

BYOMailer always removes these contacts from the audience:

- Contacts that unsubscribed.
- Contacts that BYOMailer marked as sunset. See [Contacts](contacts.md).
- Contacts whose email address is on the suppression list. See [Deliverability](deliverability.md).
- Contacts that already got this newsletter.

### Step 4: Preview

This step shows the subject and the body. If the A/B test is on, you can switch between variant A and variant B.

### Step 5: Schedule

This step shows the compliance warnings, the audience and the number of contacts. Then do these steps:

1. Select the sender in **Send from**. The list shows the sender identities of your account.
2. Optional: if your account has projects, select one or more projects.
3. Optional: click **Send test email**. See [Send a test email](#send-a-test-email).
4. Do one of these actions:
   - To send later, enter a date and a time in **Schedule for later**. Then click **Schedule send**.
   - To send now, click **Send now**. Then click **Send now** again in the dialog.
   - To keep the newsletter as a draft, click **Save draft**.

The time in **Schedule for later** is in the time zone of your account. You set this time zone in **Settings**, **Profile**. The time must be in the future, or BYOMailer shows `The scheduled time must be in the future.`

If you click **Save draft** on a scheduled newsletter, BYOMailer removes the schedule. The status goes back to `draft`.

## Edit, unschedule or delete a newsletter

The page of a newsletter with the status `draft` or `scheduled` shows **Edit** and **Delete**. A scheduled newsletter also shows **Unschedule**.

- To change the newsletter, click **Edit**. The wizard opens.
- To stop a scheduled send, click **Unschedule**. The status goes back to `draft`, and the newsletter does not send.
- To delete the newsletter, click **Delete**. Then click **Delete newsletter** in the dialog. You cannot undo the delete.

After the send starts, the page does not show these buttons.

## Send a test email

Click **Send test email** in the **Schedule** step. BYOMailer sends one copy to your own email address.

- The subject starts with `[Test] `.
- BYOMailer uses the sender that you selected in **Send from**. If you selected no sender, it uses the sender that the draft has.
- BYOMailer fills the variables from the contact that has your email address. If that contact does not exist, BYOMailer makes it with your name.
- The test email always uses variant A.
- BYOMailer sends the test email through your own SES account.
- Each user can send 5 test emails each minute. The test emails of newsletters and sequence steps count together, from the dashboard and from the API.

## Checks before a send

When you click **Schedule send** or **Send now**, BYOMailer does these checks in this order. If a check fails, BYOMailer does not schedule or send the newsletter. It shows the error.

| Check | Error |
|---|---|
| The subject is not blank. | `Add a subject before you send.` |
| The body is not blank. | `Add content before you send.` |
| If the A/B test is on, the subject of variant B is not blank. | `Add a subject to variant B before you send.` |
| If the A/B test is on, the body of variant B is not blank. | `Add content to variant B before you send.` |
| The owner of the instance did not deactivate you. | `The owner of this BYOMailer instance deactivated this account. BYOMailer does not send email for it.` |
| SES did not pause sending on your AWS account. | `Amazon SES has paused sending on your AWS account. Open the SES console to see why. Sending starts again after SES turns it back on.` |
| Your AWS credentials have the permissions for bulk sends. | `Your AWS credentials are missing required SES permissions: ...` |

A subject or a body that has only spaces counts as blank. The permission check looks for `ses:CreateEmailTemplate`, `ses:DeleteEmailTemplate` and `ses:SendBulkEmail`.

BYOMailer reads the SES pause state from the last quota check. The scheduler runs this check every hour. See [Deliverability](deliverability.md).

### Compliance warnings

BYOMailer also shows two warnings. A warning never stops the send. You are responsible for these items:

| Warning | When BYOMailer shows it |
|---|---|
| The content has no unsubscribe link (`{{ unsubscribe_url }}`). | The body does not contain `{{ unsubscribe_url }}`. |
| Your account has no postal address. | The account has no postal address in **Settings**, **Profile**. |

BYOMailer adds the one-click `List-Unsubscribe` header to each newsletter email. It adds the header also when the body has no unsubscribe link.

## What happens after the send starts

1. BYOMailer sets the status to `queued`.
2. A queued job checks your status, the SES pause state and the SES permissions again.
3. The job finds the contacts that match the audience.
4. The job sends the email in chunks on the `newsletter` queue. It does not send more email each second than the max send rate of your SES account.
5. When all chunks are done, BYOMailer sets the status to `sent`. If the A/B test is on, the status is `ab_testing`.

A scheduled newsletter starts in the first scheduler run after its time. The command `contact-mails:send-due-newsletters` runs every minute.

A newsletter starts one send only. If you send, schedule or unschedule a newsletter at the same moment that the scheduler starts it, only the first change applies.

If a check fails in the job, the status becomes `failed`. If the cause is a missing SES permission, BYOMailer also sends an email to the author of the newsletter.

BYOMailer adds UTM parameters to the links of the body: `utm_medium=mail`, `utm_source=<subject as a slug>` and `utm_campaign=newsletter`.

## Statuses

| Status | Label | Meaning |
|---|---|---|
| `draft` | Draft | You can edit the newsletter. It does not send. |
| `scheduled` | Scheduled | The newsletter sends at the scheduled time. You can still edit it. |
| `queued` | Queued | The send started. |
| `ab_testing` | A/B testing | The A/B test sent both variants. BYOMailer waits for you to pick a winner. |
| `sent` | Sent | The send is complete. |
| `failed` | Failed | The send stopped because of an error. |

You can delete a newsletter only when its status is `draft` or `scheduled`.

## Stats

Open a sent newsletter to see its stats. BYOMailer counts the stats from the SES events of each email.

| Stat | Meaning |
|---|---|
| Sent | Emails that SES sent or delivered. |
| Deliverability | Delivered emails divided by sent emails. |
| Open rate | Opened emails divided by sent emails. |
| Click rate | Emails with one or more clicks divided by sent emails. |
| Unsub rate | Emails whose contact unsubscribed, divided by sent emails. |
| Pending | Emails that BYOMailer did not send yet. |
| Bounced | Emails that bounced. |
| Complained | Emails that the contact marked as spam. |

The page also lists the recipients with the status of each email. You can filter the list by status. Click **Export CSV** to download the list.

If the A/B test is on, the page also shows the results of each variant. See [A/B tests](ab-tests.md).

## Variables and their default values

You can use `{{ variable }}` placeholders in the subject, the preview text and the body. For the full syntax and the built-in variables, see [Templates and blocks](templates-and-blocks.md).

### Values of the variables

For each variable and each contact, BYOMailer uses the first value that is not empty:

1. The value of the contact: a column of the contact (for example `name` or `email`), then a custom attribute.
2. The default value of the newsletter, from the **Variables** step.
3. The global default value of the attribute, from the **Attributes** page.
4. An empty string.

BYOMailer saves the values for each contact when it sends the email. A later change to the contact does not change an email that BYOMailer already sent.

The **Variables** step does not show `{{ postal_address }}`. BYOMailer fills it with the postal address of the account when it sends the email. Set the address in **Settings > Profile**.
