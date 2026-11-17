---
title: Connect an MCP client
description: Create an API token and connect Claude Code, Cursor or another MCP client to the MCP server of your instance.
order: 2
---

# Connect an MCP client

An MCP client connects to `https://byomailer.example/mcp` over streamable HTTP. It sends an API token in the `Authorization` header of each request. For the rules of the server, read the [MCP server overview](overview.md).

The instance also shows a guide at `/documentation/guides/mcp-server`. That guide fills in the URL of your instance.

## What you need

| Item | Value |
|---|---|
| Server URL | `https://byomailer.example/mcp`. Use the host of `APP_URL`. |
| Transport | Streamable HTTP (`http` in most clients) |
| Header | `Authorization: Bearer <your-token>` |

The server does not offer OAuth. A client must let you set a custom header.

## Create an API token

1. Log in to BYOMailer.
2. Open **Settings, API Tokens** (`/settings/api-tokens`).
3. In **Token name**, type a name for the client, for example `Claude Code`.
4. Click **Create Token**.
5. Copy the token. BYOMailer shows it only one time.

The token acts as your user in your account. Each team member creates a separate token. A token does not expire. To stop a token, delete it on the same page.

WARNING: Do not put the token in a file that you commit or share. A person with the token can read and change all data of the account.

For more about tokens, read [API authentication](../api/authentication.md).

## Claude Code

1. Run this command. Replace `<your-token>` with your token.

   ```bash
   claude mcp add byomailer \
     --transport http https://byomailer.example/mcp \
     --header "Authorization: Bearer <your-token>"
   ```

2. Run `claude mcp list`.
3. Make sure that `byomailer` is in the list and that it is connected.

## Cursor

1. Open the MCP configuration file of Cursor. Read the documentation of Cursor for the location of this file.
2. Add the `byomailer` entry to the `mcpServers` block:

   ```json
   {
     "mcpServers": {
       "byomailer": {
         "type": "http",
         "url": "https://byomailer.example/mcp",
         "headers": {
           "Authorization": "Bearer <your-token>"
         }
       }
     }
   }
   ```

3. Replace `<your-token>` with your token.
4. Restart Cursor, or reload its MCP servers.

## Claude Desktop

The in-app guide names Claude Desktop as a client for the same `mcpServers` block as Cursor.

TODO(owner): The in-app guide gives one `mcpServers` block with `"type": "http"` and `headers` for Claude Desktop and Cursor. Does Claude Desktop accept this entry in its configuration file, or must a user add the server in another way?

## Claude.ai

TODO(owner): The server accepts only a bearer token in the `Authorization` header, and the app has no OAuth routes for `/mcp`. Can a user connect Claude.ai to the server? If yes, give the steps.

## Other clients

A client can connect if it supports streamable HTTP and a custom `Authorization` header. Give it the server URL and the header from [What you need](#what-you-need).

## Test the connection with curl

1. Send a `tools/list` request. Replace `<your-token>` with your token.

   ```bash
   curl -X POST https://byomailer.example/mcp \
     -H "Authorization: Bearer <your-token>" \
     -H "Content-Type: application/json" \
     -H "Accept: application/json" \
     -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
   ```

2. Make sure that the response has a `tools` array.

A client calls a tool with a `tools/call` request. The `name` is a tool name from `tools/list`. The `arguments` match the input schema of the tool:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "newsletter-stats-tool",
    "arguments": { "newsletter_id": 42 }
  }
}
```

## Troubleshooting

| Symptom | Cause | What to do |
|---|---|---|
| HTTP `401` | The token is missing, wrong or deleted. Or the user is deactivated, archived, or has an open invitation. | Make sure that the header is `Authorization: Bearer <your-token>`. If necessary, create a new token. |
| HTTP `404` | The client uses a host that is not the host of `APP_URL`, for example a custom link domain. | Use the host of `APP_URL`. |
| HTTP `429` | The user sent more than 60 requests in one minute. | Wait one minute. Then send the request again. |
| `Tool [<name>] not found.` | The tool name is wrong. | Use a name from `tools/list`. Some names end with `-tool`. |

For more about the instance URL and the host, read [Configuration](../getting-started/configuration.md) and [Reverse proxy and TLS](../self-hosting/reverse-proxy-and-tls.md).
