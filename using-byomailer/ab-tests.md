---
title: A/B tests
description: Send two variants of a newsletter to the audience and compare their open and click rates.
order: 7
---

# A/B tests

An A/B test sends two variants of one newsletter. Each variant has its own subject, preview text and body. BYOMailer splits the audience into two halves and sends one variant to each half. Then you compare the results and pick a winner.

An A/B test is a part of a newsletter. For the newsletter wizard, see [Newsletters](newsletters.md).

## What a variant contains

| Field | Variant A | Variant B |
|---|---|---|
| Subject | Required | Required |
| Preview text | Optional | Optional |
| Body | Required | Required |
| Template | The template of the newsletter | The same template as variant A |
| Sender | The sender of the newsletter | The same sender as variant A |
| Audience | Half of the audience | The other half |

You can test the subject, the body, or both. To test only the subject, give the two variants the same body. To test only the body, give the two variants the same subject.

The two variants share one template. Each variant has its own content in the content slot of the template.

## Set up an A/B test

1. Open the newsletter wizard at the **Content** step.
2. Turn on **Enable A/B testing**.
3. Fill in **Variant A — Subject**, **Variant A — Preview text** and **Variant A — Content**.
4. Fill in **Variant B — Subject**, **Variant B — Preview text** and **Variant B — Content**.
5. Complete the other steps of the wizard.

The **Variables** step lists the variables of the two variants. The **Preview** step can show each variant.

The test email from the **Schedule** step always uses variant A.

If you turn off **Enable A/B testing** and save, BYOMailer deletes variant B.

## Checks before the send

BYOMailer checks the two variants before it schedules or sends the newsletter:

| Check | Error |
|---|---|
| The subject of variant B is not blank. | `Add a subject to variant B before you send.` |
| The body of variant B is not blank. | `Add content to variant B before you send.` |

BYOMailer also shows a warning when variant B has no unsubscribe link. The warning does not stop the send. For the checks of variant A, see [Newsletters](newsletters.md).

## How the split works

The A/B test has no separate test group. The two variants go to the full audience of the newsletter.

1. BYOMailer reads the audience in chunks.
2. For each chunk, it puts the contacts in a random order.
3. It sends variant A to the first half of the chunk and variant B to the second half.
4. If the chunk has an odd number of contacts, variant A gets one more contact.

Thus each variant goes to about 50% of the audience. The chunk size depends on the max send rate of your SES account.

## Pick the winner

When all the emails are sent, the newsletter status becomes `ab_testing`. The label is **A/B testing**.

BYOMailer does not pick the winner. You pick it:

1. Open the newsletter.
2. Read the **A/B test results** section. It shows these numbers for each variant:
   - The number of emails sent with the variant.
   - The number of opened emails.
   - The open rate.
   - The click rate.
3. Click **Pick winner** on the variant that you want.

The open rate and the click rate of a variant are the opened emails and the clicked emails, divided by all emails of that variant.

When you pick the winner, BYOMailer does these steps:

- It saves the winner (`a` or `b`) on the newsletter.
- It sets the status to `sent`.
- It shows the label **Winner** on that variant.

Picking the winner sends no more email. All contacts already got one of the two variants.

You can pick the winner only one time, and only while the status is `ab_testing`. The API has the same action. See [Newsletters API](../api/newsletters.md).

## Webhooks

BYOMailer sends the `newsletter.sent` webhook event when a newsletter finishes sending. For a newsletter with an A/B test, BYOMailer does not send this event. See [Webhooks](webhooks.md).

TODO(owner): The code does not send `newsletter.sent` for an A/B test, also not when you pick the winner. Is that the intended behavior?
