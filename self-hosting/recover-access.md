---
title: Recover access
description: Find a user, set a new password, turn off two-factor authentication and show the setup URL from the command line.
order: 9
---

# Recover access

The "forgot password" form sends an email through the system mailer (`MAIL_MAILER`). If the instance has no working mailer, use the commands on this page. They need shell access to the server. See [System mail](system-mail.md).

In the Docker stack, run each command in the `web` service with `docker compose exec web`.

## Find a user: `byomailer:user:list`

The command shows a table of the users of the instance, with the columns `ID`, `Name`, `Email`, `Account`, `Owner`, `Status` and `Created`. The status is `active` or `deactivated`.

```bash
docker compose exec web php artisan byomailer:user:list --search=person
```

| Option | Effect |
|---|---|
| `--search=` | Show only the users whose name or email contains this text. |

If no user matches, the command shows `No user matches.`

## Set a new password: `byomailer:user:password`

The command sets a new password for the user with the email that you give. It does not send an email.

```bash
docker compose exec web php artisan byomailer:user:password person@example.com
```

With no option, the command asks for the new password two times.

| Argument or option | Effect |
|---|---|
| `email` | Required. The email of the user. |
| `--password=` | Set this password. The command does not ask. |
| `--generate` | Make a random password and show it one time. |
| `--reset-two-factor` | Turn off two-factor authentication for a user who lost the device. |

- Use `--password` or `--generate`, not the two together.
- If the command cannot ask (for example, in a script or with `--no-interaction`), give `--password` or `--generate`.
- The generated password has two parts of 16 letters and numbers, joined by a hyphen. Keep it at once. The command does not show it again.

The new password must obey the same rules as the web form. In production, these rules are: 12 characters or more, upper and lower case letters, numbers and symbols, and a password that is not in a known data leak. If the password does not obey the rules, the command shows the error and changes nothing.

### What the command also does

- It changes the "Remember me" token of the user. All "Remember me" logins end.
- With the `database` session driver, it removes the web sessions of the user and shows the number.
- With another session driver, for example `redis` in the Docker stack, it cannot find the sessions of one user. Each open web session ends at its next request, because the password changed.
- With `--reset-two-factor`, it removes the two-factor secret, the recovery codes and the confirmation date. The user can turn on two-factor authentication again in the account settings.

The command does not reactivate a deactivated user. It shows a reminder when the user is deactivated. The owner must reactivate the user in **Admin > Users**. See [Accounts and registration](accounts-and-registration.md).

The command does not change the API tokens of the user.

## Show the setup URL: `byomailer:setup-url`

While the instance has no user, the command prints the URL of the setup page. Open it to create the owner.

```bash
docker compose exec web php artisan byomailer:setup-url
```

If a user already exists, the command shows `An account already exists. The setup page is closed.`

The URL uses the host of `APP_URL`. The token in the URL comes from `APP_KEY`. If you change `APP_KEY`, run the command again to get the new URL.

## Give owner access to another user

If no owner can sign in, make another user an owner:

```bash
docker compose exec web php artisan byomailer:install --promote=person@example.com
```
