---
title: Authentication
description: Make an API token in the dashboard and send it in the Authorization header of each request.
order: 2
---

# Authentication

The API uses personal API tokens from Laravel Sanctum. Each token belongs to one user. A request with the token acts for that user and sees the data of the account of that user.

## Make an API token

1. Log in to the dashboard.
2. Open **Settings**, then **API Tokens** (`/settings/api-tokens`).
3. In **Token name**, type a name for the token. The name is text of 255 characters or fewer.
4. In **Access**, select **Read only** or **Read and write**.
5. In **Expiration**, select **Never**, or a number of days: 30, 90 or 365.
6. Click **Create Token**.
7. Copy the token from the **Token created successfully** box.
8. Keep the token in a secret store.

WARNING: Copy the token before you leave the page. BYOMailer shows the full token only one time.

The **Existing Tokens** list shows the name, the access and the expiration date of each token, when you made it, and when it was last used.

A team member with the Viewer role cannot make API tokens.

WARNING: Never put an API token in browser code or in a public repository. The token gives full access to the data of your account.

## Send the token

Send the token in the `Authorization` header of each request:

```
Authorization: Bearer <your-token>
```

Example:

```bash
curl https://byomailer.example/api/v1/contacts \
  -H "Authorization: Bearer <your-token>" \
  -H "Accept: application/json"
```

The same token also works for the MCP server. See [Connect clients](../mcp/connect-clients.md).

## Token abilities and expiry

Each token has Sanctum abilities. The **Access** choice sets them:

| Access | Abilities | What the token can do |
|---|---|---|
| Read only | `read` | Read data. Each request that changes data or sends mail gets `403`. |
| Read and write | `read`, `write` | Read and change data, and send mail. |

A token that BYOMailer made before access levels existed has all abilities (`*`). It has read and write access.

The `EnforceAccessLevel` middleware checks each API request:

- A request with a token that has no `read` ability gets `403` with the message `This API token has no read access.`
- A `POST`, `PUT`, `PATCH` or `DELETE` request with no `write` ability gets `403` with the message `You have read-only access.`
- `POST /api/v1/newsletters/contacts/preview` only reads data, so a read-only token can use it.

A token with an expiration date stops working after that date. The next request gets `401`. A token with **Never** does not expire, because `expiration` in `config/sanctum.php` is `null`.

If you set the `SANCTUM_TOKEN_PREFIX` environment variable, Sanctum adds that prefix to new tokens. Secret scanners can then find a leaked token.

## Roles

The role of the token user also limits the API:

- A user with the Viewer role has read-only access. Each request of a Viewer that changes data gets `403`, also with a read and write token.
- Only a user with the `admin` role can use the [webhook](webhooks.md) endpoints. A token of another user gets `403` on those endpoints, with the message `Only an admin of the account can manage webhook endpoints.`

## Revoke a token

1. Open **Settings**, then **API Tokens**.
2. In **Existing Tokens**, find the token.
3. Click **Delete** on the row of the token.

BYOMailer deletes the token. The next request with that token gets `401`.

## Tokens that BYOMailer refuses

BYOMailer checks the user of the token on each request. It refuses the token, with `401`, in these conditions:

| Condition of the user | How it happens | What happens to the tokens |
|---|---|---|
| Deactivated | The owner deactivates the user in **Admin**, **Users**. | BYOMailer keeps the tokens. If the owner reactivates the user, the tokens work again. |
| Archived | An admin archives the team member in **Settings**, **Team**. | BYOMailer deletes all the tokens of the member. |
| Invited | The member has an open invitation (`invite_expires_at` is set). | The member cannot use a token before the member accepts the invitation. |

The same rule applies to the MCP server, because it also uses Sanctum tokens. See [Teams](../using-byomailer/teams.md) and [Accounts and registration](../self-hosting/accounts-and-registration.md).

## The 401 response

A request with no token, a wrong token, a revoked token or a refused token gets this response:

```json
{
  "message": "Unauthenticated."
}
```

The response is `401` with JSON, also when the request has no `Accept: application/json` header.
