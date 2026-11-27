---
title: Accounts and registration
description: Create the owner, choose who can sign up, and deactivate users of the instance.
order: 8
---

# Accounts and registration

This page is about the users of the instance: the owner, the sign-up rules and the deactivation of a user. To invite a team member to one account, see [Teams](../using-byomailer/teams.md).

## The owner

The owner runs the instance. An owner can do these things:

- Open the admin area at `/admin`, with **Admin > Users** and **Admin > Settings**.
- Open Horizon at `/horizon`.
- Deactivate and reactivate users.

For every other user, the admin area answers 404, so it does not show that it exists.

The owner is not the same as the `admin` role of a team. A team admin manages one account. The owner manages all the users of the instance. An instance can have more than one owner.

## Create the first owner with `/setup`

While the instance has no user, BYOMailer sends `GET /`, `GET /login` and each request to `/register` to `/setup`.

1. Get the setup URL. The container prints it in its log when it starts:

   ```bash
   docker logs byomailer
   ```

   In the Compose stack, run `docker compose logs web`.

2. Open the URL. It has the form `https://byomailer.example/setup?token=<token>`.
3. Enter the name, the email, the password and the timezone of the owner.
4. Submit the form. BYOMailer creates the owner and signs you in.

The token comes from `APP_KEY`, so BYOMailer stores nothing for it. If `APP_KEY` changes, the token changes too. To show the URL again, run `php artisan byomailer:setup-url`. See [Recover access](recover-access.md).

After the first user exists, `/setup` answers 404. If two people submit the form at the same time, BYOMailer creates only one owner.

The owner gets a new account, the team `admin` role and a verified email. The password must obey the password rules. In production, these rules are: 12 characters or more, upper and lower case letters, numbers and symbols, and a password that is not in a known data leak.

## Create the first owner with `byomailer:install`

You can also create the owner from the command line:

```bash
docker exec byomailer php artisan byomailer:install
```

In the Compose stack, replace `docker exec byomailer` with `docker compose exec web`.

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

- With `--prepare`, the command stops. The container runs `byomailer:install --prepare` each time that it starts.
- With `--promote`, the command sets the user as an owner. If no user has that email, it stops with `No user has the email ...`.
- Without these options, the command creates the first owner. If the instance already has users, it stops with `This install already has users.`

After it creates the owner, the command reminds you to back up `APP_KEY`. See [Backups](backups.md).

To make an existing user an owner:

```bash
docker exec byomailer php artisan byomailer:install --promote=person@example.com
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

## `ADMIN_EMAILS`

`ADMIN_EMAILS` is a comma-separated list of emails. It has two uses:

- The users in the list can open Horizon at `/horizon`, in addition to the owners. See [Queues and Horizon](queues-and-horizon.md).
- The migration that added owners made each user in the list an owner. This matters only when you update an install from before owners existed.

A user in `ADMIN_EMAILS` cannot open the admin area unless that user is also an owner.

## Deactivate a user

The owner can deactivate a user in **Admin > Users**. The data of the user stays in place. Only the access changes.

BYOMailer refuses a deactivated user everywhere:

- The login form refuses the user and shows `This account is deactivated. Ask the owner of this BYOMailer instance to reactivate it.`
- An open web session and a "Remember me" login end at the next request.
- The API tokens of the user stop working on the API (`/api/v1`) and on the MCP server (`/mcp`).
- The invitation link of an invited user stops working.
- BYOMailer does not send email for the user. A newsletter of the user does not start. The queued parts of a newsletter that is sending stop.
- A sequence email of the user fails with the reason `user_deactivated`.

To restore access, click **Reactivate** in **Admin > Users**. The API tokens of the user work again. BYOMailer does not send again the sequence emails that failed.

The owner cannot deactivate an owner. The request answers 403 with `You cannot deactivate an owner.`

Deactivation is not the same as the archive action of a team admin. A team admin archives a member of one account. The owner deactivates a user of the whole instance.
