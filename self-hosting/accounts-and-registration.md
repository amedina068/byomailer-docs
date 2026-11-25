---
title: Accounts and registration
description: Create the owner, choose who can sign up, turn on Google sign-in, and deactivate users of the instance.
order: 8
---

# Accounts and registration

This page is about the users of the instance: the owner, the sign-up rules, Google sign-in and the deactivation of a user. To invite a team member to one account, see [Teams](../using-byomailer/teams.md).

## The owner

The owner runs the instance. An owner can do these things:

- Open the admin area at `/admin`, with **Admin > Users** and **Admin > Settings**.
- Open Horizon at `/horizon`.
- Deactivate and reactivate users.

For every other user, the admin area answers 404, so it does not show that it exists.

The owner is not the same as the `admin` role of a team. A team admin manages one account. The owner manages all the users of the instance. An instance can have more than one owner.

## Create the first owner with `/setup`

While the instance has no user, BYOMailer sends `GET /`, `GET /login` and each request to `/register` to `/setup`.

1. Get the setup URL. In the Docker stack, the `web` container prints it in its log when it starts:

   ```bash
   docker compose logs web
   ```

2. Open the URL. It has the form `https://byomailer.example/setup?token=<token>`.
3. Enter the name, the email, the password and the timezone of the owner.
4. Submit the form. BYOMailer creates the owner and signs you in.

The token comes from `APP_KEY`, so BYOMailer stores nothing for it. If `APP_KEY` changes, the token changes too. To show the URL again, run `php artisan byomailer:setup-url`. See [Recover access](recover-access.md).

After the first user exists, `/setup` answers 404. If two people submit the form at the same time, BYOMailer creates only one owner.

The owner gets a new account, the team `admin` role and a verified email. The password must obey the password rules. In production, these rules are: 12 characters or more, upper and lower case letters, numbers and symbols, and a password that is not in a known data leak.

## Create the first owner with `byomailer:install`

You can also create the owner from the command line:

```bash
docker compose exec web php artisan byomailer:install
```

The command asks for the name, the email and the password. To give them as options, use the table below.

| Option | Effect |
|---|---|
| `--name=` | The name of the owner. |
| `--email=` | The email of the owner. |
| `--password=` | The password of the owner. |
| `--timezone=` | The timezone of the account. The default is `UTC`. |
| `--promote=` | Make the existing user with this email an owner. The command creates no account. |
| `--prepare` | Prepare the instance only. The command creates no account. |

Each run first creates the `public/storage` link if it is missing. Then:

- With `--prepare`, the command stops. The `web` container runs `byomailer:install --prepare` each time that it starts.
- With `--promote`, the command sets the user as an owner. If no user has that email, it stops with `No user has the email ...`.
- Without these options, the command creates the first owner. If the instance already has users, it stops with `This install already has users.`

After it creates the owner, the command reminds you to back up `APP_KEY`. See [Backups](backups.md).

To make an existing user an owner:

```bash
docker compose exec web php artisan byomailer:install --promote=person@example.com
```

## Registration modes

The instance has two registration modes:

| Mode | Value | Effect |
|---|---|---|
| Invite only | `invite_only` | `/register` answers 404. The login page shows no sign-up link. A team admin invites each new user to an account. |
| Open | `open` | Anyone can sign up at `/register`. The login page shows a **Sign up** link. Each new user gets a new account. |

In both modes, team invitations work.

## `REGISTRATION_ENABLED` and Admin > Settings

The owner sets the mode in **Admin > Settings**. BYOMailer stores the mode in the `instance_settings` table, with the key `registration_mode`.

While the database has no mode, `REGISTRATION_ENABLED` gives the mode:

| `REGISTRATION_ENABLED` | Mode |
|---|---|
| `false` (default) | Invite only |
| `true` | Open |

After the owner saves a mode in **Admin > Settings**, `REGISTRATION_ENABLED` has no effect. The settings page shows the default mode from `REGISTRATION_ENABLED` and tells if a stored mode overrides it.

If `BYOMAILER_API_*` is set, BYOMailer adds each user that signs up at `/register` to a list on another BYOMailer server. See [Optional integrations](optional-integrations.md#byomailer-api-sign-up-list).

## Google sign-in

Users can log in with their Google account in place of their password. Google sign-in is off by default. It turns on only when you set the two variables below in `.env`.

| Variable | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` | The client ID of your OAuth client in Google Cloud. |
| `GOOGLE_CLIENT_SECRET` | The client secret of the same OAuth client. |

While one of the two values is empty, the login page shows no Google link. `/auth/google/redirect` and `/auth/google/callback` answer 404.

### Turn on Google sign-in

1. Open the [Google Cloud console](https://console.cloud.google.com/).
2. Select a project, or create a project for your BYOMailer instance.
3. Open **APIs & Services > OAuth consent screen**. In the newer console, this page is **Google Auth Platform**.
4. Configure the consent screen. Give the app name, a support email and the domain of `APP_URL`.
5. Select the user type. If all your users are in one Google Workspace organization, select **Internal**. If not, select **External**.
6. Open **APIs & Services > Credentials**.
7. Click **Create credentials > OAuth client ID**.
8. Select the application type **Web application**.
9. Under **Authorized redirect URIs**, add `https://byomailer.example/auth/google/callback`. Use the host of your `APP_URL`.
10. Click **Create**. Copy the client ID and the client secret.
11. Set the two values in `.env`:

    ```bash
    GOOGLE_CLIENT_ID=1234567890-example.apps.googleusercontent.com
    GOOGLE_CLIENT_SECRET=your-client-secret
    ```

12. Recreate the containers with `docker compose up -d`.
13. Open the login page. Make sure that it shows **Log in with Google**.

BYOMailer asks Google for the `openid`, `email` and `profile` scopes only. Google Cloud does not classify these scopes as sensitive.

With the user type **External**, an app in the testing status accepts only the test users that you add in Google Cloud. To let all your users sign in, publish the app.

If Google shows `redirect_uri_mismatch`, the redirect URI in Google Cloud is not the same as `APP_URL` followed by `/auth/google/callback`. Correct the URI in Google Cloud. The scheme, the host and the path must be the same.

### Who can use Google sign-in

Google sign-in never creates an account. A new user still comes only from the setup, an invitation, or `/register` when registration is open.

The first Google sign-in of a user links the Google account to the BYOMailer user with the same email address. BYOMailer stores the Google account ID in the `google_id` column of the `users` table. After the link, the user logs in with the same Google account, also after a change of the email address.

BYOMailer links the accounts only when all of these rules pass:

- Google says that the email address is verified.
- The BYOMailer user has a confirmed email address. The owner and each user who accepted an invitation have one. A user who signed up at `/register` does not have one.
- The user is not deactivated or archived.
- The user has no open invitation.
- The BYOMailer user is not linked to a different Google account.

The email match ignores upper and lower case. BYOMailer compares the addresses in ASCII only, so an address with a lookalike character does not match.

If a rule fails, BYOMailer does not sign in the user. The login page shows the reason:

| Message | Cause |
|---|---|
| `No account uses this email address. Ask a team admin for an invitation.` | No BYOMailer user has the email address of the Google account. |
| `Google did not verify this email address. Log in with your password.` | Google did not verify the email address of the Google account. |
| `This account has no confirmed email address. Log in with your password.` | The BYOMailer user has no confirmed email address. |
| `Accept your invitation first. Open the link in the invitation email.` | The user has an open invitation. |
| `This account is linked to a different Google account.` | The BYOMailer user is linked to another Google account. |
| `This account is archived.` | A team admin archived the user. |
| `This account is deactivated. Ask the owner of this BYOMailer instance to reactivate it.` | The owner deactivated the user. |
| `The Google sign-in did not complete. Try again.` | The user canceled the consent, the sign-in took too long, or the `state` value was not correct. |

### Security of Google sign-in

- BYOMailer sends a random `state` value to Google and keeps it in the session. The callback refuses a request with a different value.
- BYOMailer uses PKCE for the exchange of the code.
- A user with two-factor authentication must enter the code after Google, the same as after a password.
- Google sign-in does not set the "Remember me" cookie.
- The redirect and the callback accept 10 requests in one minute from one IP address.

## `ADMIN_EMAILS`

`ADMIN_EMAILS` is a comma-separated list of emails. It has two uses:

- The users in the list can open Horizon at `/horizon`, in addition to the owners. See [Queues and Horizon](queues-and-horizon.md).
- The migration that added owners made each user in the list an owner. This matters only when you update an install from before owners existed.

A user in `ADMIN_EMAILS` cannot open the admin area unless that user is also an owner.

## Deactivate a user

The owner can deactivate a user in **Admin > Users**. The data of the user stays in place. Only the access changes.

BYOMailer refuses a deactivated user everywhere:

- The login form and the Google sign-in refuse the user and show `This account is deactivated. Ask the owner of this BYOMailer instance to reactivate it.`
- An open web session and a "Remember me" login end at the next request.
- The API tokens of the user stop working on the API (`/api/v1`) and on the MCP server (`/mcp`).
- The invitation link of an invited user stops working.
- BYOMailer does not send email for the user. A newsletter of the user does not start. The queued parts of a newsletter that is sending stop.
- A sequence email of the user fails with the reason `user_deactivated`.

To restore access, click **Reactivate** in **Admin > Users**. The API tokens of the user work again. BYOMailer does not send again the sequence emails that failed.

The owner cannot deactivate an owner. The request answers 403 with `You cannot deactivate an owner.`

Deactivation is not the same as the archive action of a team admin. A team admin archives a member of one account. The owner deactivates a user of the whole instance.
