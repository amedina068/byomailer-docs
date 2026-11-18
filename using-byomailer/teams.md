---
title: Teams
description: Invite team members to an account, give them roles, archive them, and protect each login with two-factor authentication and API tokens.
order: 15
---

# Teams

An account can have more than one team member. Each team member has a login and a role. All team members of an account work in the same account.

The owner of the instance is a different thing. The owner can open the admin area of the instance and can deactivate any user. See [Accounts and registration](../self-hosting/accounts-and-registration.md).

## Roles

| Role | Value | Who has it |
| --- | --- | --- |
| Admin | `admin` | The person that registered the account, and each team member that an admin makes an admin. |
| Editor | `editor` | A team member that an admin invited with this role. |
| Viewer | `viewer` | A team member that an admin invited with this role. |

The code also has the value `invited`. The **Team** page does not offer it.

### What each role can do

| Action | Admin | Editor | Viewer |
| --- | --- | --- | --- |
| Invite team members | Yes | No | No |
| Change the role of a team member | Yes | No | No |
| Archive and restore team members | Yes | No | No |
| Manage webhooks (dashboard and API) | Yes | No | No |
| Read all pages and API endpoints | Yes | Yes | Yes |
| Change data, send mail and make API tokens | Yes | Yes | No |

A viewer has read-only access in the dashboard, the API and the MCP server. The `EnforceAccessLevel` middleware refuses each request of a viewer that changes data, with `403`. A viewer can still change the own profile and password, and delete the own account and the own API tokens.

### What team members share

Many records belong to the account, for example segments, attributes and webhooks. Some pages show only the records that the signed-in team member created:

- The **Contacts** page and the contact export.
- The **Lists** page, the list pages and the list picker of the import.
- The **Tags** page.

A team member can still open the page of a contact that another team member created.

TODO(owner): `ContactController::index`, `MailListController` and `TagController::index` filter on `user_id`, but most other pages filter on `client_id`. Must team members see all contacts, lists and tags of the account?

## Invite a team member

You must be an admin.

1. Open **Settings** > **Team**.
2. In **Invite teammates**, enter the **Full name** and the **Email address**.
3. In **Role after joining**, select the role.
4. Click **Send invitation**.

BYOMailer sends the invitation email with the system mailer of the instance, not with the SES account of the account. The system mail must work. See [System mail](../self-hosting/system-mail.md).

The invitation link expires after 24 hours. The **Team** page shows the pending invitation with its expiry time.

BYOMailer refuses the invitation with one of these errors:

| Error | Cause |
| --- | --- |
| `This email address is already in use.` | The email belongs to a user of another account. |
| `This user is already part of your team.` | The email belongs to a team member that accepted an invitation. |
| `This user is archived. Restore them instead of inviting again.` | The email belongs to an archived team member. |

To send a new link to a pending team member, invite the same email again. BYOMailer replaces the old link and sets a new expiry time.

### Accept an invitation

1. Open the link in the invitation email.
2. Enter your email address. It must be the address of the invitation.
3. Enter a password.
4. Submit the form.

BYOMailer marks the email as verified, signs you in, and opens the dashboard.

If the link expired, the page shows `This invitation has expired, please contact your admin to get a new one.` Ask an admin to invite you again.

## Change a role

You must be an admin.

1. Open **Settings** > **Team**.
2. In the row of the team member, select the new role.
3. Click **Update**.

You cannot change the role of a pending invitation. BYOMailer shows `Pending invitations cannot be reassigned.`

The page does not show the role menu in your own row.

Each account must keep one or more admins. If you change the role of the last admin, BYOMailer shows `Each client must have at least one admin.`

## Archive a team member

Archive a team member when the person leaves the team. BYOMailer keeps all records of the team member.

1. Open **Settings** > **Team**.
2. In the row of the team member, click **Archive member**.

When you archive a team member, BYOMailer does these steps:

1. It sets the archive date on the team member.
2. It deletes all API tokens of the team member.

After this, each dashboard page refuses the team member with the message `Your account has been archived.`

You cannot archive yourself. You cannot archive the last admin.

To give access again, click **Restore member** in the row. The API tokens do not come back. The team member must create new tokens.

## Two-factor authentication

Each team member can turn on two-factor authentication (2FA) for their own login. BYOMailer uses time-based one-time passwords (TOTP).

### Turn on 2FA

Before you start, install an authenticator app on your phone.

1. Open **Settings** > **Two-Factor Auth**.
2. If BYOMailer asks for your password, enter it.
3. Click **Enable 2FA**.
4. Scan the QR code with your authenticator app. If you cannot scan it, enter the setup key in the app.
5. Click **Continue**.
6. Enter the 6-digit code from the app.
7. Click **Confirm**.

### Recovery codes

Recovery codes let you sign in if you lose your phone. Each code works one time.

1. Click **View Recovery Codes**.
2. Store the codes in a password manager.

To make a new set of codes, click **Regenerate Codes**. The old codes then stop working.

### Sign in with 2FA

After your password, BYOMailer asks for the code from your app. If you do not have your phone, use a recovery code.

If you lose your phone and your recovery codes, an operator of the instance can help. See [Recover access](../self-hosting/recover-access.md).

### Turn off 2FA

1. Open **Settings** > **Two-Factor Auth**.
2. Click **Disable 2FA**.

## API tokens

Each team member has their own API tokens. A token acts as the team member that created it. The API and the MCP server accept the tokens.

### Create a token

1. Open **Settings** > **API Tokens**.
2. Enter a **Token name**, for example `CRM sync`. The maximum is 255 characters.
3. In **Access**, select **Read only** or **Read and write**.
4. In **Expiration**, select **Never**, or a number of days: 30, 90 or 365.
5. Click **Create Token**.
6. Copy the token at once.

WARNING: Copy the token and keep it secret. BYOMailer shows it only one time, and a person with the token can read your data and send email.

A read-only token can read data through the API and the MCP server. It cannot change data or send mail. A token with an expiration date stops working after that date. A token with **Never** does not expire. A viewer cannot make tokens.

The **Existing Tokens** list shows the name, the access, the expiration date, the creation time and the last use of each token. A token that BYOMailer made before access levels existed shows as **Read and write**.

### Delete a token

Click **Delete** in the row of the token. Clients that use the token then get an authentication error.

The **API Tokens** page also has a **Download Postman Collection** button.

See [API authentication](../api/authentication.md) and [Connect MCP clients](../mcp/connect-clients.md).

## Related pages

- [Accounts and registration](../self-hosting/accounts-and-registration.md)
- [Recover access](../self-hosting/recover-access.md)
- [Webhooks](webhooks.md)
