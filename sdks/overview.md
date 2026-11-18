---
title: SDKs
description: The status of the BYOMailer SDKs for JavaScript, PHP, Python and Ruby.
order: 1
---

# SDKs

SDKs for JavaScript, PHP, Python and Ruby are in progress. They are not ready to use yet.

Each SDK will be a client for one BYOMailer instance. It will take the URL of your instance and an API token. It will cover each endpoint of the [REST API](../api/overview.md), cursor pagination, typed errors, retries, and a helper that verifies the signature of a [webhook](../api/webhooks.md) delivery.

Until the SDKs are ready, use the REST API directly. To load the API into a tool, use the files on [OpenAPI and Postman](../api/openapi.md).

TODO(owner): Add the install command, a quick start, the configuration, pagination, webhook verification, errors and retries for each language when the SDKs are ready. Say where each package is published, or how to install it from its git repository.
