---
title: Sequences
description: Send a series of emails to each contact, with a delay between the steps.
order: 8
---

# Sequences

A sequence is a series of emails. Each email is a step. When a contact joins a sequence, BYOMailer sends the steps to that contact one after the other, with a delay between them.

A sequence belongs to the team member who made it. Other team members of the account do not see it in their list of sequences.

## Before you start

Make sure that these items are ready:

- Your account has a verified sender identity. See [Sender identities](sender-identities.md).
- The scheduler runs. The command `contact-mails:send-due-sequence-steps` runs every minute. See [Scheduler](../self-hosting/scheduler.md).
- SES sends its events to BYOMailer. BYOMailer schedules the next step only after SES reports the delivery of the previous email. See [SES events](../self-hosting/ses-events.md).

## Create a sequence

1. Open **Sequences** and click **Create sequence**.
2. Enter a name. Optional: select one or more projects.
3. Save. BYOMailer makes the sequence with the status `draft` and opens it.

The sequence page has these parts:

- The name and the status switch.
- The audience of the sequence. See [Sequence filters](#sequence-filters).
- The default values of the variables.
- The stats.
- The list of steps.

## Add a step

1. On the sequence page, click **Add step**.
2. BYOMailer makes a step with a delay of 0 days and the first sender identity. The step page opens.
3. Set the **Delay**. See [The delay between steps](#the-delay-between-steps).
4. Select the sender.
5. Enter the subject and, optional, the preview text.
6. Write the content. The step starts with the default template of the account. See [Templates and blocks](templates-and-blocks.md).
7. Save the step.
8. Optional: set the step filters. See [Step filters](#step-filters).
9. Optional: send a test email to yourself.

A new step has the status `draft`. It sends nothing until you make it live.

The test email goes to your own email address. Its subject starts with `[Test] `. It uses the default values of the variables of the sequence.

## The delay between steps

Each step has a delay and a delay type:

| Delay type | Allowed values |
|---|---|
| `days` | 0 to 365 |
| `hours` | 0 to 8760 |

The delay of the first step counts from the time that the contact joins the sequence. The delay of each other step counts from the time that the previous email of the contact was delivered or skipped. A delay of 0 sends the step at the next scheduler run.

BYOMailer puts the steps in order by their delay, from the shortest to the longest. It converts days to hours to compare them. If two steps have the same delay, the older step comes first. The order in which you add the steps does not matter.

For example, a sequence has three steps with the delays 0 days, 2 days and 5 days. A contact joins on Monday at 10:00:

1. Step 1 (0 days) sends at about 10:00 on Monday.
2. Step 2 (2 days) sends 2 days after step 1 was delivered.
3. Step 3 (5 days) sends 5 days after step 2 was delivered.

Only live steps are in the series. BYOMailer ignores a step with the status `draft` when it finds the next step.

## Statuses

A sequence and each step have their own status:

| Status | Label | Meaning |
|---|---|---|
| `draft` | Draft | A draft sequence accepts no new contacts. A draft step sends nothing. |
| `live` | Live | A live sequence accepts contacts. A live step sends to the contacts of a live sequence. |

Use the switch on the sequence page or on the step page to change the status. BYOMailer asks you to confirm the change.

A sequence sends only through its live steps. To start a sequence, make the sequence live and make its steps live.

### Checks before a sequence or a step goes live

| Item | Check | Error |
|---|---|---|
| Sequence and step | The owner of the instance did not deactivate you. | `The owner of this BYOMailer instance deactivated this account. BYOMailer does not send email for it.` |
| Sequence and step | SES did not pause sending on your AWS account. | `Amazon SES has paused sending on your AWS account. Open the SES console to see why. Sending starts again after SES turns it back on.` |
| Step | The subject is not blank. | `Add a subject before you send.` |
| Step | The body is not blank. | `Add content before you send.` |

BYOMailer also shows two warnings. A warning does not stop the change:

- A live step has no `{{ unsubscribe_url }}` link.
- The account has no postal address.

### Pause a sequence or a step

CAUTION: Pause a sequence or a step only if you want to stop its pending emails for good. When a pending email is due and its sequence or step is not live, BYOMailer deletes the email.

The contact stays in the sequence. BYOMailer schedules the next step only after a delivery or a skip, so this contact gets no more steps of the sequence.

TODO(owner): The code deletes a due email when its sequence or step is not live, and the contact then gets no more steps. Is that the intended behavior of a pause?

## Enrollment

A contact joins a sequence in one of these ways:

- On **Contacts**, select contacts and click **Add to sequence**.
- On the page of a contact, click **Add to sequence**.
- An automation runs the action **Add to sequence**. See [Automations](automations.md).

BYOMailer adds a contact only when all these conditions are true:

- The sequence is live.
- The contact matches the sequence filters.
- The contact is not in the sequence yet.

A contact can join a sequence only one time. A contact that completed the sequence stays in it, so BYOMailer does not add the contact again.

After a bulk add, BYOMailer shows the number of contacts that it added, skipped and failed to add. A skipped contact was already in the sequence or did not match the sequence filters.

When a contact joins, BYOMailer schedules the first live step for that contact. If the sequence has no live step at that time, BYOMailer schedules nothing.

BYOMailer does not schedule email for a contact that unsubscribed or that BYOMailer marked as sunset.

## Sequence filters

The sequence filters set the audience of the sequence. You can use a saved segment or your own filters, but not both. The filters are the same as the filters of a newsletter. See [Segments and filters](segments-and-filters.md).

BYOMailer checks the sequence filters at these times:

- When the contact joins.
- When BYOMailer schedules the next step.
- When BYOMailer sends each email.
- When the tags of the contact change, if the filters use tags.
- When the lists of the contact change, if the filters use lists.

If the contact does not match at one of these times, the contact exits the sequence. See [Exit](#exit).

## Step filters

A step can have its own filters. A contact who does not match the step filters skips only that step.

When BYOMailer skips a step for a contact, it does these steps:

1. It marks the email of the step as `skipped`.
2. It schedules the next live step at once. The delay of the next step counts from this time.

If the skipped step is the last live step, the contact completes the sequence.

## Exit

A contact leaves a sequence in these cases:

| Cause | What BYOMailer does |
|---|---|
| The contact does not match the sequence filters. | It marks the pending emails as `skipped` with the reason `sequence_filter_mismatch`. It marks the contact as completed. |
| The contact unsubscribes. | It deletes the pending emails. It removes the contact from all sequences. |
| A hard bounce, a complaint or 3 soft bounces in a row. | BYOMailer unsubscribes the contact, so the same steps apply. See [Deliverability](deliverability.md). |

An exit because of the sequence filters counts as a completed sequence. Thus it starts the **Sequence finished** automations and the `sequence.completed` webhook event.

## Complete a sequence

A contact completes a sequence in these cases:

- The email of the last live step was delivered, or the contact skipped it.
- The contact exited because of the sequence filters.

When a contact completes a sequence, BYOMailer does these steps:

1. It saves the completion time for the contact.
2. It starts each live automation with the trigger **Sequence finished** for this sequence.
3. It sends the `sequence.completed` webhook event. See [Webhooks](webhooks.md).

BYOMailer does this one time for each contact and sequence.

## Delete a step

When you delete a step, BYOMailer does these steps:

1. It finds the contacts that got the deleted step (delivered or skipped).
2. It schedules the next live step for these contacts, if they did not complete the sequence.
3. It deletes the pending emails of the deleted step.

## Variables

The sequence page lists the `{{ variable }}` placeholders that the subjects and the bodies of the steps use. You can set one default value for each variable. The default values apply to all the steps of the sequence.

For the order in which BYOMailer looks for a value, see [Newsletters](newsletters.md). For the syntax, see [Templates and blocks](templates-and-blocks.md).

## Stats

The sequence page shows these numbers:

| Stat | Meaning |
|---|---|
| Contacts | The contacts in the sequence. |
| Completed | The contacts that completed the sequence. |
| Unsubscribed | The contacts that unsubscribed from an email of the sequence. |
| Clicked | The contacts that clicked a link in an email of the sequence. |

The **Email performance** section counts the emails of all steps: sent, delivered, pending, skipped, opened, bounced, unsubscribed and complained. Each step page shows the same numbers for one step.

The contacts page of a step shows the status of each email. You can export the emails of a step as a CSV file.

BYOMailer adds UTM parameters to the links of each step: `utm_medium=mail`, `utm_source=<subject as a slug>` and `utm_campaign=<sequence name as a slug>`.

## How BYOMailer sends the steps

Every minute, the scheduler runs `contact-mails:send-due-sequence-steps`. The command does these steps:

1. It takes up to 200 due emails, the oldest first.
2. It reserves them, so that a second run does not take them.
3. It puts them in jobs on the `sequences` queue.

The jobs send at most the max send rate of your SES account each second. Before each email, the job checks these items:

| Check | Result if the check fails |
|---|---|
| The owner of the instance did not deactivate you, and SES did not pause your account. | The email fails with the reason of the block. |
| The address is not on the suppression list. | The email fails with the reason `blacklisted`. |
| The contact did not unsubscribe and is not sunset. | The email fails with the reason `unsubscribed` or `sunset`. |
| Your AWS credentials have `ses:SendEmail`. | The email fails with the reason `ses_permission_missing`. |
| The sequence and the step are live, and the contact is in the sequence. | BYOMailer deletes the email. |
| The contact matches the sequence filters. | The contact exits the sequence. |
| The contact matches the step filters. | The contact skips the step. |

If SES returns a throttle error, the email stays pending. A later run sends it.

## The blocked-sequence digest

If your AWS credentials do not have the `ses:SendEmail` permission, sequence emails fail with the reason `ses_permission_missing`.

Every day at 09:00, the command `ses:send-sequence-blocked-digest` sends an email to each team member who has such failed emails. The subject is `Daily digest: sequence emails blocked by missing permissions`. The email gives the number of blocked emails and a link to the email credentials page. BYOMailer sends this email through the system mailer. See [System mail](../self-hosting/system-mail.md).

Every hour, the command `ses:sync-configuration-sets` checks the permissions again. When `ses:SendEmail` is back, it sets the blocked emails back to `pending`. The next scheduler run sends them.

To correct the problem, add `ses:SendEmail` to the IAM policy of the AWS user. See [Connect AWS SES](../getting-started/connect-aws-ses.md).

TODO(owner): The digest counts all failed emails with the reason `ses_permission_missing`, with no date limit, but the email says "today". Must the count include only the emails of the last day?
