---
title: Release notes
description: The changes to BYOMailer that users can see, newest first.
order: 8
---

# Release notes

This page lists the changes to BYOMailer that users can see. The newest date is first.

The release notes have no version numbers. For developers, `CHANGELOG.md` in the [app repository](https://github.com/amedina068/byomailer/blob/main/CHANGELOG.md) lists the changes to the code for each version.

## November 19, 2026

- An opt-in email that does not send now shows the failed status and the reason. Before, it showed sent.
- A newsletter to a large list now sends to every contact. Before, an SES account that sends 14 emails each second left the contacts after about the first 100,000 unsent and failed.
- A repeated Amazon SES event no longer counts a click two times or sends the sequence_step.sent webhook two times. An event that fails no longer stops the other events of the same message.
- A newsletter with some failed emails now ends as sent, with its sent date and the newsletter.sent webhook. The failed emails keep the status failed. Before, one failed group of emails marked the whole newsletter as failed.
- The dashboard no longer changes or sends again a newsletter that is sending or sent. It now answers 404. The editor of a scheduled newsletter now opens the variables step.

## November 18, 2026

- The API reference now names the path parameter of the tag update and delete endpoints tag, not tagId. The URLs, the status codes and the responses do not change.
- Team members now see the sender identities, the import progress and the sent emails of the account. A sender email that a team member added is now a validation error, not a server error.
- BYOMailer loads no analytics script on its pages. The app sends no page views to an outside service.
- The API reference at /docs/api now has a summary, a description and the error responses for each endpoint. The repository has the OpenAPI document in docs/api/openapi.yaml, with a Postman collection and a Postman environment.
- Team members now share the contacts, lists, tags, topics and contact attributes of the account. Before, each member saw only the records that the member added.
- A contact can unsubscribe from an email that a team member sent, and from an opt-in email. Before, these unsubscribe links answered 404.
- A new sender identity uses the Track opens and Track clicks choice of the wizard in SES. Before, the hourly sync turned both on again.
- A {{ variable }} inside a block now gets its value when BYOMailer sends the email. An attribute with a list value shows its JSON text and no longer stops the send.
- The API saves the sender identity of a draft newsletter, so you can send a test email of the draft. The API sequence list and record now count the completed contacts.
- The Docker health check passes when APP_URL has a public domain.
- The SES events worker confirms the SNS subscription of an AWS account that is not the account of the SQS queue. Before, the events of such an account did not arrive.
- An API or MCP update of a contact no longer subscribes the contact again. To subscribe a contact again that an admin unsubscribed, add the contact to a list or use the new subscribe endpoint of the API.
- An A/B test newsletter now sends the newsletter.sent webhook event one time, when you pick the winner. Before, an A/B test sent no newsletter.sent event.
- Team members now share the AWS credentials, the sequences and the automations of the account. Before, each member saw only the sequences and automations that the member made, and a member without AWS keys could not send.
- Double opt-in lists now wait for the confirmation. A contact that joins an opt-in list from the dashboard, an automation, the API or an import gets the opt-in email, and newsletters and sequences reach the contact only after it confirms.
- Pausing a sequence or a step no longer deletes the emails that come due. They wait, and they go out when you activate the sequence or the step again.
- On a contact page, Subscribe for an address that bounced now asks for a confirmation and removes the address from the suppression list. For an address that complained, the Subscribe button is hidden. Before, the contact looked subscribed but got no email.
- An image that you upload in the email editor now goes to your own storage from Settings, Storage, the same as the image gallery.
- The weekly summary email is back. Each team member gets it on Friday at 17:00 in the time zone of the account, with the new subscribers, the unsubscribes, the active subscribers and the mails sent of the week.
- Visual automations now start for your contacts. When a contact joins or leaves a list, gets or loses a tag, joins a sequence or finishes a sequence, each live visual automation with that trigger enrolls the contact.
- A test email that fails now shows the real error. Before, the page showed "Test email sent" after a failure. A test email or a save of one form no longer erases unsaved edits in the newsletter, sequence and step editors. A template that you choose for a list opt-in email now goes into the email body correctly. You can open contacts and email logs with the keyboard.
- The link in a double opt-in email now opens a page with a confirm button. Mail scanners open each link in an email, so the subscription is confirmed only when the contact clicks the button.
- The link in a double opt-in email now uses the custom link domain of the sending identity, the same as the unsubscribe link.
- A newsletter now checks each contact again immediately before it sends. A contact who unsubscribed, was sunset or was blacklisted after you scheduled the newsletter gets no email.
- A contact who unsubscribed through an email link stays unsubscribed. The dashboard and the API cannot subscribe that contact again. Only the contact can subscribe again.
- The HTML check now blocks more data URLs, for example data:application and data:image/svg+xml. Data URLs with a raster image type (PNG, JPEG, GIF, WebP, AVIF, BMP) still pass.
- New AWS keys saved in Settings now keep the bounce and complaint tracking. Settings refuses keys that AWS does not accept, and keys of a different AWS account. A teammate can now save new AWS keys for the team. The queue workers use the new keys at the next job, with no restart.
- When a team member deletes the own account, the team keeps the contacts, lists, newsletters and sequences that the member created. The data moves to the oldest active admin. The only admin of a team and the instance owner cannot delete the account.

## November 17, 2026

- New setup page for a new install. While the install has no account, BYOMailer opens /setup. The page asks for a setup token and creates the owner account. The Docker web container prints the setup URL in its log. To show the URL again, run php artisan byomailer:setup-url.
- New admin area for the owner of the instance, at /admin. Admin, Users lists every user, with a search. The owner can deactivate a user and reactivate the user later. A deactivated user keeps all data, but cannot log in, use an API token or the MCP server, or send email.
- The owner can open or close the sign-up page in Admin, Settings, without a change to REGISTRATION_ENABLED. The variable now gives only the default mode.
- New commands to recover an account without email: php artisan byomailer:user:list finds a user, and php artisan byomailer:user:password sets a new password. Add --generate for a random password, or --reset-two-factor for a user who lost the two-factor device.
- Contact data in the HTML of an email is now shown as text. Before, a contact name or attribute with HTML tags added those tags to the email. The subject and the plain text part show the value as before.
- A contact import file can now be 20 MB at most. A larger file shows an error. Split a larger list into more than one file.
- The Viewer role now has read-only access. A Viewer can see all data, but cannot change data, send mail or create API tokens. This applies to the dashboard, the API and the MCP server. A Viewer can still change the own profile and password and delete the own tokens.
- API tokens now have an access level. Choose Read only or Read and write when you create a token, and optionally an expiration after 30, 90 or 365 days. A read-only token sees only the MCP tools that read data. Tokens that you made before this change keep read and write access.

## November 16, 2026

- BYOMailer is now ready to self-host. Every account has full access. Billing, plans, and send limits are gone.
- New install command: php artisan byomailer:install creates the first admin user. Registration is off by default. Set REGISTRATION_ENABLED=true to open it.
- BYOMailer now shows a warning when a newsletter or a sequence step has no unsubscribe link ({{ unsubscribe_url }}). The warning does not block the send. The unsubscribe link is the responsibility of the sender. BYOMailer still adds the one-click List-Unsubscribe header to each campaign email.
- Add the postal address of your company in Settings, Profile. The {{ postal_address }} variable puts it in the email footer. The field is optional. While it is empty, BYOMailer shows a warning before you send, but it does not block the send.
- The MCP tools schedule-newsletter, set-sequence-status and set-sequence-step-status return these warnings in a warnings list. They do not refuse the change.
- API examples, the MCP guide, and the OpenAPI document now use the URL of your install.
- New Docker image and Docker Compose stack for self-hosting.

## November 6, 2026

- The DKIM records for a new sending domain now use the DKIM domain of your AWS region. Before, BYOMailer always showed {token}.dkim.amazonses.com. In some regions, for example eu-south-1 (Milan) and af-south-1 (Cape Town), AWS uses {token}.dkim.\<region>.amazonses.com, so the domain did not verify. BYOMailer now uses the value that AWS returns. A domain that you added before this change keeps its old records. If such a domain does not verify, remove it in Settings, then add it again with the option for an identity that already exists in AWS.
- A contact who stops matching the filters of a sequence now finishes the sequence. Before, the contact stayed in the sequence with no end, so the automations that run when a sequence finishes did not run. For example, a tag that an automation adds when a contact joins a sequence now gets removed again. The email that was waiting for this contact now shows as skipped on the step, and is not sent.
- The API can now remove tags from a contact. Send remove_tags, an array of tag names, to PATCH /api/v1/contacts/{contactId} or POST /api/v1/lists/{listId}/contacts. Automations with a "tag removed" condition and the tag filters of sequences react the same as for a change in the dashboard. A name that is in tags and in remove_tags returns 422. A tag that the contact does not have is ignored.

## October 22, 2026

- Scheduled newsletters are sent again at their scheduled time. Before, a newsletter with a future send time stayed in the scheduled status and was never sent. A newsletter that is already due is sent within one minute of this release.
- The BYOMailer MCP server can now list contacts with the list-contacts tool. Filter them with the same filters as newsletters (tags, lists, topics, attributes, dates, engagement and location) and search on the name or email. Each contact shows its tags, lists and custom attributes.
- The new bulk-update-contacts MCP tool changes up to 100 contacts in one call. For each contact, it can change the name, add and remove tags, set and remove custom attributes, and add the contact to lists or remove it from lists. Each contact is updated on its own, so one failure does not stop the others. Tag removal is now available through the MCP server.

## October 17, 2026

- Prices in an email that uses a template are now kept. Before, a dollar sign followed by digits (for example $70) was removed from the html of a sequence step or newsletter when a template wrapped the content.
- The API can now set the content variable defaults of a newsletter with PATCH /api/v1/newsletters/{newsletterId}/variables, the same as for sequences. A newsletter that is sending or sent cannot be changed. An empty default is now stored as an empty string, like the dashboard does.
- The BYOMailer MCP server can now schedule a newsletter and turn sequences, sequence steps and automations on or off. Use the new tools schedule-newsletter, set-sequence-status, set-sequence-step-status and set-automation-status. They run the same checks as the dashboard. The first call saves nothing and shows a preview of the change and the number of contacts it affects. The change is saved only when the tool is called again with confirm_live set to true, after the user agrees.
- Sequences now accept content variable defaults through the MCP server and the API. Set content_variables on create-sequence and update-sequence, or with PATCH /api/v1/sequences/{sequenceId}/variables, and read them with GET /api/v1/sequences/{sequenceId}/variables. The newsletter and sequence content tools also list the variables that the content uses.
- A paused automation can now add contacts to a draft sequence. The automation can go live only after that sequence is live.

## October 16, 2026

- The BYOMailer MCP server can now edit live records. The update tools work on a scheduled newsletter, a live sequence, a live sequence step and a live automation. A live record affects real contacts, so the tool asks for confirmation first: it saves the change only when the request includes confirm_live set to true, after the user agrees. A newsletter that is sending or already sent stays locked.

## October 7, 2026

- The BYOMailer MCP server can now set the filters of a sequence. The create-sequence tool accepts a filters array, so only matching contacts receive the sequence. The new update-sequence tool renames a draft sequence or replaces its filters. An empty filters array clears them. Live sequences cannot be edited through the MCP server.

## September 28, 2026

- You can now export the emails of a newsletter as a CSV file. Open a sent newsletter and click Export CSV in the Recipients section. The file has one row for each recipient, with the email, the name, the delivery status and times, the subject, and the plain-text body that the contact got. The export uses the status filter that you selected.
- Editing an email template now flows through to your not-yet-sent newsletters and sequence steps: the template is composed fresh at send time, so drafts, scheduled newsletters, and live sequence steps always go out with the latest template. Already-sent newsletters keep their original look as a historical record.

## September 25, 2026

- Links that add a query string after a variable now work for every contact. For example, {{ checkout_url }}?coupon=SAVE10 now joins the coupon with & when the contact's checkout_url already has a ?, so the coupon is not lost. Links in the plain-text version of an email no longer show escaped characters like \&#x3D;.

## September 24, 2026

- The BYOMailer MCP server can now send a test copy of a sequence step. The new tool send-sequence-step-test-mail delivers one step to your own inbox so you can read it before the sequence goes live. It does not send to the sequence audience and does not start or advance the sequence for anyone.

## September 23, 2026

- Sequence steps can now have their own filters. A contact who does not match the filters of a step skips only that email and continues to the next step. The sequence filters still remove a contact from the whole sequence. The step metrics show how many emails were skipped.
- You can now set the filters of a sequence step through the API and the MCP server. The API has a new endpoint, PATCH /api/v1/sequences/{sequenceId}/steps/{sequenceStepId}/filters. The MCP tools create-sequence-step and update-sequence-step accept a filters array.
- Automations can now start when a contact attribute changes, for example when plan changes to pro.
- The BYOMailer MCP server can now manage automations. An AI assistant connected to your account can list automations, read one with the names of its lists, tags and sequences, create a new automation, and edit a paused one. New automations are always paused. Only the dashboard can turn an automation on or delete it.
- The contacts API now returns the sequences of each contact. Before, the sequences field was always empty. The MCP contact tools, for example find-contact, now also return the sequences of the contact.

## September 22, 2026

- The BYOMailer MCP server can now add contacts. An AI assistant connected to your account can look up a contact by email, create or reuse one, put them on a list, label them with tags, and remove them from a list. Adding someone to a list that requires opt-in still sends the opt-in email. Tag removal is not available through the MCP server.
- Sender identities now have an optional Reply-To address and name. Set them on the identity page, and replies to your newsletters, sequences and opt-in emails go to that inbox instead of the From address. Leave the email empty to remove the Reply-To.
- A newsletter or sequence step cannot go out with an empty subject or an empty body. Mailbox providers treat such mail as spam. Scheduling or sending now shows what to fix, and test emails still send.
- BYOMailer now stops sending when Amazon SES pauses your account, and reads your SES account status every hour.
- A new Reputation page shows your SES account status and your bounce and complaint rates for the last 24 hours, 7 days and 30 days. A banner appears on every page when SES reviews or pauses your account.
- Sequence emails now respect the sending rate of your Amazon SES account. Each run queues up to 200 due emails and sends them at your SES rate, so a large sequence no longer fails emails with throttling errors.
- Sequence emails are no longer sent twice. A step is now marked sent as soon as your mail provider accepts it, so a slow delivery report no longer lets the next run send the same email again.
- You can now sunset inactive contacts in Settings > Profile. Pick a period, and a daily run stops mailing contacts who have not clicked in that period. The page shows how many contacts the next run will stop mailing. A sunset contact shows a Sunset badge and a Reactivate button.
- Bounce handling is more accurate. An SES reject no longer unsubscribes the contact, because SES refused the message for its content and the address is not at fault. Only a permanent bounce suppresses a contact at once. Temporary and undetermined bounces now count up, and three in a row suppress the contact. A successful delivery resets the count.

## September 19, 2026

- One-click unsubscribe now works the way Gmail, Yahoo and Apple Mail expect. The List-Unsubscribe header points at a dedicated endpoint that accepts their POST, so unsubscribe requests from the inbox toolbar succeed instead of failing silently and counting against your sender reputation.
- The unsubscribe link in an email now opens a confirmation page instead of unsubscribing straight away. Corporate link scanners follow every URL in a message, and they were unsubscribing contacts who had never clicked.
- Blocks are now expanded in bulk newsletters. A {{ block.footer }} placeholder used to render as nothing in newsletters sent through the SES bulk API, which silently dropped footers, postal addresses and unsubscribe links.
- Suppressed addresses are excluded at send time. A contact whose address hard bounced or complained is now skipped by newsletters and sequences, not just blocked at contact creation.
- DMARC is now verified in DNS. The identity page marks the _dmarc record verified once you publish it, and the check re-runs daily so a removed policy is noticed.
- Plain-text versions of emails now keep link URLs and paragraph breaks everywhere. Sequence steps used to strip them out, leaving a bare wall of text for clients that show the plain part.
- A contact who already unsubscribed and opens an unsubscribe link again now gets a Subscribe again button instead of a dead end. Resubscribing also asks for confirmation first, so a link scanner can no longer put someone back on the list.
- The BYOMailer MCP server can now manage sender identities. An AI assistant connected to your account can list your sending domains, read the DNS records a domain needs, create a new identity in your own AWS SES, re-check verification with AWS after DNS changes, and toggle open and click tracking. Identities cannot be deleted through the MCP server.

## July 23, 2026

- New Attributes page under Audience: every contact attribute now supports a global default value. When an email uses a variable, BYOMailer resolves the contact's own value first, then the newsletter or sequence default, then the global default.
- Newsletter and sequence variable steps now prefill empty defaults with the matching global attribute default, with a hint showing where the value came from.
- Introducing Projects: create named projects and group your newsletters, sequences, automations, and visual automations under shared initiatives. Manage projects from the new Projects page in the sidebar, complete with per-resource counts that link straight to each filtered list.
- Every index now filters by project: newsletters, sequences, automations, and visual automations all gained a project dropdown, project chips on each row, and a quick-assign menu so you can tag resources without leaving the page. Sequence and automation filters operate within the rows you can already see.
- The Projects API is live: full CRUD at /api/v1/projects, a project filter on the newsletter and sequence list endpoints, and project_ids on newsletter create/update. The OpenAPI spec, Postman collection, and API reference docs all cover the new endpoints.

## July 15, 2026

- The BYOMailer MCP server can now update an existing draft sequence step, not just create new ones. An AI assistant connected to your account can revise a step's delay, subject, body, sender or template. Only draft steps can be edited — live steps are locked — and edits never change the status, so going live still happens in the dashboard.

## July 2, 2026

- Newsletter click rate is now shown everywhere open rate is: a Click column on the Newsletters list and the dashboard's latest-newsletters table, plus a Click rate card on the newsletter detail page — so you can see click-through at a glance.

## June 29, 2026

- The BYOMailer MCP server can now create sequences and add steps to them. An AI assistant connected to your account can draft a whole drip campaign for you to review. Sequences and steps are always created as drafts — they can never be activated or sent through the MCP API, so going live still happens in the dashboard.
- The MCP server can now create tags. An AI assistant connected to your account can add the tags you use to label contacts and build audiences. Tag names stay unique per account.
- The MCP server can now update an existing draft newsletter, not just create new ones. An AI assistant can revise the title, subject, body, sender, template or audience filters of a draft. Only drafts can be edited — once a newsletter is scheduled or sent it is locked — and edits never change the status, so the newsletter stays a draft you review and send from the dashboard.

## June 26, 2026

- Outbound webhooks: register HTTPS endpoints under Settings → Webhooks and receive signed POST callbacks in real time when contacts subscribe, unsubscribe, or resubscribe, when a newsletter finishes sending, when a sequence step is sent, and when a contact completes a sequence.
- Each delivery is HMAC-signed (X-Byomailer-Signature) so you can verify authenticity, retries with backoff on failure, and every attempt is recorded in a per-endpoint delivery log you can inspect and test from the dashboard or the API.
- While building or editing a segment, you now see a live count of how many contacts currently match — updated as you adjust the filters, just like the newsletter audience preview.
- Segments are now archived instead of deleted. Archiving hides a segment from the picker so it can't be picked for new newsletters or sequences, while anything already referencing it keeps its audience unchanged. Restore an archived segment anytime from the new Archived view.

## June 25, 2026

- Contacts who finish a sequence are now tracked as Completed instead of lingering in the final step. The last step's contact count and list now show only contacts still waiting there, so the numbers match what's actually pending.
- Sequence and per-step views gained a Completed metric, and you can filter a sequence's contacts down to just those who finished. Existing finished contacts were backfilled automatically.
- You can now save reusable Segments — named, dynamic audiences built from the same filters you already use on newsletters and sequences. Build a segment once (for example 'Opened in the last 30 days' or 'US contacts on the Pro plan') and reuse it instead of rebuilding the same filters every time.
- When targeting a newsletter or sequence, pick a saved segment instead of custom filters. Segments are evaluated live: edit a segment and every draft newsletter and live sequence using it updates automatically.
- Each segment shows exactly who matches, with a contact count and a browsable list, and tells you which newsletters and sequences use it.

## June 15, 2026

- The MCP server can now help you compose newsletters, not just read stats. Four new tools let an AI client build a draft for you: view the audience filters available on your account, calculate how many contacts a set of filters would reach, create a draft newsletter, and send yourself a test copy.

## June 9, 2026

- You can now send your first 25,000 emails free, before subscribing. Newsletters and sequences both count toward the allowance, so you can test real deliverability through your own SES before paying.
- You can now add contacts to a sequence directly from the Contacts screen. On a contact's detail page, a new Sequences section lets you enroll that contact; from the Contacts list, select multiple contacts with checkboxes and add them all at once.
- Both entry points open the same modal: pick a live sequence, confirm, and the contacts are enrolled. Sequence filters still apply, so contacts that don't match are skipped, and one failed contact never blocks the rest.
- A summary message tells you how many contacts were added and how many were skipped (already enrolled or filtered out).

## June 4, 2026

- New read-only MCP server at /mcp lets AI clients (Claude Desktop, Claude Code and other Model Context Protocol clients) read your campaign data using your existing API token as a bearer token.
- Eight tools cover discovery and reading: list newsletters and sequences, plus newsletter stats, newsletter content, sequence stats, sequence content, individual sequence step content and per-step stats.
- Every tool is read-only and scoped to your own account — the assistant can analyse your campaigns but cannot send, edit or delete anything. See the new MCP Server guide in the documentation.
- Sequences now have read-only REST API endpoints to match: GET /api/v1/sequences (list), /sequences/{id} (content with steps), /sequences/{id}/stats (sequence totals), /sequences/{id}/steps/{stepId} (step content) and /sequences/{id}/steps/{stepId}/stats (per-step stats). The API and MCP return identical data. Added to the API reference, OpenAPI spec and Postman collection.

## May 28, 2026

- Features now lead with Automations — the part raw SES can't do — instead of basic campaigns.

## May 25, 2026

- Sequence detail page now shows email performance across all steps — sent, delivered, deliverability, opened, open rate, pending, bounced, unsubscribed and complained — matching the newsletter detail layout.
- Each step in the sequence list shows the same per-step metrics inline so you can spot which step is dragging deliverability down.
- Sequence step detail page now has its own email performance card scoped to just that step.

## May 22, 2026

- Newsletter detail page progress bar now advances correctly while batches dispatch — the total recipient count locks in at send time instead of growing alongside the sent count.
- Preview text (inbox preheader) is now available on newsletters and sequence steps — write the short teaser shown next to the subject in Gmail, Apple Mail and other clients. Supports template variables like the subject, with separate values for A/B variants and through the API.

## May 21, 2026

- Custom tracking domains now serve open and click tracking links over HTTPS through a managed proxy that issues a valid TLS certificate for your subdomain automatically.
- Setup is now a single A record pointing your tracking subdomain at the IP shown on the Email Identity settings page — no more CNAME to awstrack.me.
- Automations index redesigned: clearer Live/Paused status, status filter tabs, search, and a When → Then chip flow so you can read each rule at a glance.

## May 16, 2026

- Custom link domains let you serve unsubscribe and preference-center links on your own domain (e.g. mail.yourbrand.com) instead of byomailer.com. Add a CNAME, and Cloudflare issues and renews the TLS certificate automatically.
- Configure a custom link domain per email identity from its settings page, with a one-click status check while the certificate is being issued.
- Custom link domains only ever serve unsubscribe and preference pages — every other route stays locked to the main app.

## May 15, 2026

- Newsletter and sequence filters gain three new categories. Date filters target when a contact signed up — before or after a date, in the last N days, more than N days ago, or between two dates.
- Engagement filters target newsletter activity: opened, clicked, or received (and the negatives — not opened, not clicked, not received). Scope it to any newsletter or a specific one, and to all time or the last N days.
- Location filters target contact country or timezone, matching any of a set or excluding them.
- Contact attribute filters now support operators beyond exact match — contains, does not contain, greater than, less than, is set, and is not set — with each filter only offering the operators that make sense for it.
- Newsletter detail page adds a Deliverability stat — the share of sent emails confirmed delivered by SES — alongside the existing sent, open rate, and bounce metrics.

## May 14, 2026

- Editor toolbar adds font family, font size, text color, and a block-type picker. Family options are limited to email-safe stacks (Arial, Helvetica, Georgia, Times, Verdana, Tahoma, Courier, JetBrains Mono, system) so what you pick is what recipients see.
- Font size uses a named scale (XS, S, M, L, XL, 2XL → 12, 14, 16, 18, 24, 32 px). Color picker accepts any hex (#RRGGBB), remembers your 5 most recent colors per device, and resets cleanly.
- Block type is now a single dropdown with Paragraph, Heading 1, Heading 2, Heading 3 — replacing the three heading buttons. Selecting multiple lines and changing block type now applies to every line, not just the first.
- Headings, paragraphs, lists, and blockquotes ship with sensible defaults baked into the saved HTML, so a plain message lands looking intentional in Gmail and Apple Mail without you styling every block.
- When a template is applied, the editor now shows the template's header and footer above and below the editable area as faded read-only sections, so you see the full email shape while you write — without the schema mangling that used to break custom template HTML.
- Newsletter Preview step and the Newsletter detail page now render the email inside an isolated iframe at full container width and auto-grow to the content height. App theme styles can no longer leak into the preview, and what you see matches what recipients receive.

## May 12, 2026

- Add Identity is now a full-screen wizard at /settings/identities/create instead of an inline form. Pick an existing domain identity from your AWS account (verified or pending) or register a new one.
- Existing AWS domain identities show their AWS verification status. Domains already in BYOmailer are clearly marked as such and disabled in the picker so you never re-add by accident.

## April 27, 2026

- Interactive API reference is live at /docs/api with the OpenAPI 3.x spec at /docs/api.json — try endpoints, browse schemas, and download the spec for your own tooling.
- API is now versioned at /api/v1/. Old /api/... URLs keep working via a permanent redirect (preserving method and body), but please update your integrations to /api/v1/ directly.
- All list endpoints now use cursor pagination — page through results with meta.next_cursor and meta.prev_cursor.
- Test-mail (5/min) and recipient-preview (30/min) endpoints now have per-user rate limits to keep things fair.
- Newsletter html_content is now capped at 500KB. The list endpoint omits html_content / text_content for faster responses — use the show endpoint for the full body. scheduled_at is required when status is 'live' and rejected otherwise. Deleting a newsletter is now restricted to drafts.
- Newsletters API supports the full creation flow over HTTP: POST /api/v1/newsletters/{id}/test-mail to send yourself a preview, POST /api/v1/newsletters/{id}/ab-winner to lock in an A/B winner, POST /api/v1/newsletters/contacts/preview for recipient counts, and GET /api/v1/newsletters/{id}/variables to inspect detected {{ var }} placeholders.
- Newsletter create and update accept ab_test_enabled with subject_b and html_content_b for split tests, content_variables for {{ variable }} defaults, and email_template_id to wrap content inside a saved template.
- Newsletter responses now embed the email_identity object, expose A/B side fields and content_variables, and return 0 (instead of null) for open_rate and unsubscribe_rate when there are no sends yet.
- Newsletter index accepts ?search=\<title or subject> and rejects unknown ?status values.
- Updating or deleting a non-mutable newsletter (queued, ab_testing, sent, failed) now returns 422 with a clear status validation error instead of 404.
- New read-only API endpoints for browsing email templates: GET /api/v1/email-templates, /api/v1/email-templates/default, and /api/v1/email-templates/{id}. Email identities also gained GET /api/v1/email-identities/{id}.

## April 23, 2026

- Email templates now use a {{ content }} placeholder that marks the editable slot inside a reusable template shell.
- Starter picker replaces the legacy create page. Pick a system starter or start blank to create a new template; system templates are no longer used directly.
- Each client gets a default template on registration and can mark any template as default from the templates list. Newsletter and sequence step editors auto-apply the default on empty drafts.
- When a template is applied to a newsletter or sequence step, the shell becomes read-only inline and only the content slot stays editable.
- Templates must contain exactly one {{ content }} placeholder to save. Removing the unsubscribe link triggers a deliverability warning and requires explicit confirmation.
- Removed the automatic unsubscribe footer from outgoing newsletters and sequence emails; the template provides the link.

## April 16, 2026

- Contacts API gained GET /api/contacts (paginated, filterable by list, tag, topic, search, unsubscribed) and GET /api/contacts/{id} with tags, lists, and topics included.
- Contact API endpoints now scope by client instead of the individual user, so teammates on the same client share read and write access.
- Newsletter API gained DELETE /api/newsletters/{id}, a status filter on the index, pagination capped at 100 per page, a filters array cap of 20, and a new 'scheduled' status for future-dated sends.
- Email Identity API exposes identity_status and accepts ?identity_status= to filter. Live newsletter sends now require a verified email identity.
- Newsletter responses include delivery + engagement metrics (total, sent, opened, bounced, unsubscribed, complained, open_rate, unsubscribe_rate) plus total_contacts_reached and ab_test_enabled.
- Newsletter scheduling now distinguishes 'draft' (editable, not sending) from 'scheduled' (editable until the scheduled time) so the scheduler never auto-dispatches a pure draft.

## April 15, 2026

- Topics let subscribers opt out of individual content categories inside a list while staying subscribed to the rest.
- New preference center, linked via the {{ preferences_url }} template variable, lets contacts toggle topic subscriptions without unsubscribing globally.
- Creating a topic on an existing list now auto-subscribes every current list member in the background.
- Topics can be used as a new filter category when building segments for newsletters and sequences.
- New Topics API endpoints under /api/lists/{listId}/topics for full CRUD.

## April 14, 2026

- Saved email templates let you create, duplicate, and reuse content across newsletters, sequences, and opt-in emails.
- A template picker is built into every content editor for quick one-click insertion.

## April 7, 2026

- Email logging tracks every SES API request, response, and SNS delivery event per client.
- Email log detail page shows the full request payload, response payload, and SNS event data.
- Email logs API endpoints let you list and retrieve logs programmatically.

## March 29, 2026

- Newsletter API endpoints allow listing, viewing, creating, and updating newsletters programmatically.

## March 25, 2026

- Custom tracking domains let you replace the default awstrack.me links with your own branded subdomain for better deliverability.
- New documentation guide walks through setting up a custom tracking domain step by step.
- SES API permission checks verify your AWS credentials have the right access before sending newsletters or sequences.
- Email Credentials settings page shows a permission status dashboard with a manual recheck button.
- Hourly sync command automatically keeps SES permissions and tracking settings up to date.
- Release notes now pull entries from a shared JSON file.
- Release notes UI is powered by a reusable timeline component.

## March 24, 2026

- Create contacts inline on the contacts index with attribute editing plus instant list and tag assignment.
- Contact detail screen gained one-click unsubscribe and resubscribe actions with polished attribute management.
- Newsletter builder uses reusable blocks with a TipTap editor and HTML sanitization for safer content.
- Blocks API endpoints now exist with SafeHtml validation for anyone integrating BYOMailer programmatically.
- Documentation, API reference pages, and the Postman collection were refreshed to include the new unsubscribe endpoint.

## March 23, 2026

- Reusable content blocks gained a TipTap builder, request validation, and safer rendering so marketing teams can drop polished sections into newsletters with confidence.

## March 22, 2026

- Documentation moved into dedicated Guides and API reference sections with a matching UI, making it easier for teams to find the exact playbook or endpoint they need.
- Blocks now use the TipTap editor everywhere, so content stays consistent between creation forms and the actual newsletter experience.

## March 21, 2026

- Introduced reusable 'block.\*' template namespaces so product and marketing teams can share modular email sections across newsletters.

## March 20, 2026

- SES webhook ingestion and newsletter processing jobs are now more resilient, preventing dropped delivery signals.
- Horizon monitoring and default environment settings were tuned to keep large-scale sending stable.

## March 19, 2026

- SES webhook handling includes smarter retries and better scoping to keep subscriber status accurate.
- Newsletter batch dispatch hardened with additional fixes to prevent race conditions during large sends.

## March 18, 2026

- Shipped an onboarding checklist widget that floats throughout the app, guiding new workspaces through critical BYOMailer setup tasks.

## March 17, 2026

- The contact detail screen now lets you add or remove lists, tags, and custom attributes inline, eliminating context switches when updating someone's profile.

## March 16, 2026

- Sequence scheduling and background job coordination were tightened so steps fire exactly when expected.
- Unsubscribe pages now include a resubscribe button so contacts can opt back in with a single click.

## March 15, 2026

- Email tracking now supports configurable open and click tracking right inside BYOMailer.
- Custom tracking domains follow your SES identity DNS records, simplifying setup for every sender.

## March 13, 2026

- Expanded automated test coverage for registration, dashboards, and visual automations to keep new releases stable.

## March 11, 2026

- Launched the visual automations builder with a drag-and-drop workflow canvas, enrollment engine, and step-by-step contact progression.
- Visual automations integrate with sequences so contacts automatically advance when a sequence finishes.
- Processing commands and jobs handle enrollment and step execution in the background for hands-off automation.

## March 10, 2026

- Newsletter sending refactored with a dedicated transport layer, improving reliability and testability of the mail pipeline.

## March 7, 2026

- Newsletter batch dispatch refactored for atomicity, moving batch creation into a dedicated orchestrator job that adds chunk jobs incrementally.

## March 5, 2026

- Team management launched with invite-based onboarding, role assignments, and the ability to archive inactive members.
- Weekly summary email digest keeps workspace owners informed about sending activity on a recurring schedule.

## March 4, 2026

- SES quota summary card added to the dashboard so senders can monitor their sending limits at a glance.
- Newsletter recipients table now includes a status filter for easier delivery tracking.
- Contacts remain attached to sequences after completion instead of being detached.

## March 3, 2026

- Lists now support double opt-in, sending a confirmation email before fully subscribing a contact.
- Contacts can be exported from the contacts index for use in external tools or reporting.
