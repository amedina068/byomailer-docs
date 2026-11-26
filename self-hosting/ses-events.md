---
title: SES events
description: Set up the SQS queue and the ses-events:poll worker that bring bounces, complaints, deliveries, opens and clicks back from SES.
order: 2
---

# SES events

SES reports what happens to each email: send, delivery, bounce, complaint, reject, open and click. BYOMailer reads these events from one Amazon SQS queue that you own. Without the events, BYOMailer does not see bounces and complaints.

## How the events reach BYOMailer

1. An account connects its AWS access keys in the AWS onboarding of the dashboard.
2. BYOMailer creates an SNS topic in that AWS account. The topic name is `mailautomation-<user id>-<uuid>-events`.
3. BYOMailer subscribes the SQS queue of `SES_EVENTS_SQS_QUEUE_ARN` to that topic.
4. The SES configuration set of each sender identity publishes its events to the topic.
5. The `ses-events:poll` worker reads the queue. For each message, it queues a `ProcessSesEventJob` on the `ses-events` queue of Horizon, then deletes the SQS message.
6. Horizon runs the job. The job updates the email, the contact and the statistics.

As a result, two processes must run: the `ses-events` worker and Horizon. See [Queues and Horizon](queues-and-horizon.md).

CAUTION: Set `SES_EVENTS_SQS_QUEUE_ARN` before an account connects its AWS keys. If the value is empty, the onboarding stops with the error `SQS queue ARN is not configured. Set SES_EVENTS_SQS_QUEUE_ARN in your environment.`

## Create the queue

1. In the AWS account that runs BYOMailer, create a standard SQS queue, for example `byomailer-ses-events`.
2. Give the queue an access policy that lets the SNS topics of the sending accounts send messages to it.
3. Create an IAM user for the worker, with the permissions below.
4. Create an access key for that IAM user.

The README of the app gives this access policy. `111111111111` is the account of the queue. `222222222222` is an account that sends email. Add one `aws:SourceArn` value for each sending account.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "sns.amazonaws.com" },
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:us-east-1:111111111111:byomailer-ses-events",
      "Condition": {
        "ArnLike": { "aws:SourceArn": "arn:aws:sns:*:222222222222:mailautomation-*" }
      }
    }
  ]
}
```

The pattern `mailautomation-*` matches the topic names that BYOMailer creates.

BYOMailer creates the subscription without raw message delivery. Do not turn on raw message delivery. `ProcessSesEventJob` refuses a payload with no SNS envelope.

The sending account creates the SNS subscription to the queue. When the queue is in a different AWS account, AWS puts a `SubscriptionConfirmation` message in the queue. The `ses-events` worker confirms the subscription:

1. It makes sure that a tenant of the instance owns the topic.
2. It makes sure that AWS signed the message.
3. It opens the `SubscribeURL` of the message.

After that, the SES events of the sending account arrive in the queue. If the worker does not run when AWS sends the message, the message waits in the queue until the worker reads it.

## Dead-letter queue

The worker leaves a message in the queue in two cases. It logs "leaving for DLQ" when the body is not JSON. It logs "failed to dispatch job" when it cannot queue the job, for example when Redis is down. Each receive hides the message for 60 seconds (`--visibility-timeout`). Then the worker reads it again.

Give the queue a dead-letter queue, so that such a message does not come back for ever:

1. Create a standard SQS queue for the dead letters, for example `byomailer-ses-events-dlq`.
2. Set the message retention of the dead-letter queue to 14 days.
3. On the main queue, set the message retention to 14 days. The events then wait in the queue during a long stop of the worker.
4. On the main queue, set a redrive policy with the dead-letter queue and `maxReceiveCount` 5.
5. Create a CloudWatch alarm on `ApproximateNumberOfMessagesVisible` of the dead-letter queue, with a threshold of more than 0.

With `maxReceiveCount` 5, SQS moves a message to the dead-letter queue after about 5 minutes. The worker needs no permission on the dead-letter queue.

A message in the dead-letter queue is not always invalid. If Redis was down, the queue holds valid events. When the alarm starts, read the `ses-events` log:

- If the log shows "failed to dispatch job", correct the fault. Then start a DLQ redrive in the SQS console. SQS moves the messages back to the main queue.
- If the log shows "leaving for DLQ", the body is not JSON. Read the message in the console, then delete it.

## Permissions of the worker

The worker calls these two SQS actions on the queue:

| Action | Use |
|---|---|
| `sqs:ReceiveMessage` | Read up to 10 messages with long polling. |
| `sqs:DeleteMessage` | Remove a message after BYOMailer queued its job. |

The README of the app also lists `sqs:GetQueueAttributes`.

The SNS calls (create the topic, subscribe the queue) use the AWS keys of each account, not the keys of the worker. The IAM policy that the AWS onboarding screen shows covers them. See [Connect AWS SES](../getting-started/connect-aws-ses.md).

## Environment variables

| Variable | Purpose |
|---|---|
| `PLATFORM_AWS_ACCESS_KEY_ID` | The access key of the IAM user of the worker. |
| `PLATFORM_AWS_SECRET_ACCESS_KEY` | The secret key of the IAM user of the worker. |
| `PLATFORM_AWS_REGION` | The region of the queue. The default is `us-east-1`. |
| `SES_EVENTS_SQS_QUEUE_URL` | The URL of the queue. The worker reads from it. |
| `SES_EVENTS_SQS_QUEUE_ARN` | The ARN of the queue. The AWS onboarding subscribes it to each new SNS topic. |

Example:

```dotenv
PLATFORM_AWS_ACCESS_KEY_ID=<your-access-key-id>
PLATFORM_AWS_SECRET_ACCESS_KEY=<your-secret-access-key>
PLATFORM_AWS_REGION=us-east-1
SES_EVENTS_SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/111111111111/byomailer-ses-events
SES_EVENTS_SQS_QUEUE_ARN=arn:aws:sqs:us-east-1:111111111111:byomailer-ses-events
```

If `SES_EVENTS_SQS_QUEUE_URL`, the access key or the secret key is empty, the worker stops with this error:

```text
SQS SES events configuration is incomplete. Check PLATFORM_AWS_* and SES_EVENTS_SQS_QUEUE_URL env vars.
```

## Start the worker

The AWS connection of each account subscribes its SNS topic to the queue. If `SES_EVENTS_SQS_QUEUE_ARN` is empty, the connection stops with an error. For this reason, set the queue before the first account connects AWS. The dashboard of the owner shows this step first.

### In the one-container image

The image starts the worker as a service when the access key, the secret key and `SES_EVENTS_SQS_QUEUE_URL` exist. Without them, the service does not start, and it does not restart in a loop.

1. Put the five variables of the example above in a file, for example `/root/byomailer.env`.
2. Set the file mode to 600: `chmod 600 /root/byomailer.env`.
3. Give the file to the container. With the installer, run it again with `--env-file=/root/byomailer.env`. With `docker run`, add `--env-file /root/byomailer.env`.
4. Run `docker exec byomailer php artisan byomailer:doctor`. The `ses_events` check must be `ok`.

### In Docker Compose

The `ses-events` service is in the `ses` profile of `docker-compose.yml`, because it needs the AWS values. Start it after you set the values:

```bash
docker compose --profile ses up -d
```

The service runs `php artisan ses-events:poll`. Its health check makes sure that the process runs. The `restart: unless-stopped` policy starts the container again after the command exits.

## Options of `ses-events:poll`

| Option | Default | Effect |
|---|---|---|
| `--max-messages` | `10` | The maximum number of messages in each receive call (1 to 10). |
| `--wait-time` | `20` | The long poll wait time in seconds (0 to 20). |
| `--visibility-timeout` | `60` | The time in seconds that SQS hides a received message from other readers. |
| `--sleep` | `1` | The seconds to wait after a poll that got no message. |
| `--memory-limit` | `256` | The memory in MB. When the process uses more, it exits. |
| `--max-polls` | `0` | The number of polls before the process exits. `0` means no limit. |

The worker also exits in these cases:

- It gets `SIGTERM` or `SIGINT`. It finishes the current message first.
- Someone runs `php artisan queue:restart`. The worker reads the same restart signal as the queue workers.

If an SQS call fails, the worker logs the error and waits. The wait starts at 5 seconds and doubles after each failure, up to 60 seconds.

## When the worker does not run

SQS keeps the messages for the retention period of the queue. If the worker starts before that period ends, BYOMailer processes the old events. While the worker is stopped, these things do not happen:

- BYOMailer does not record deliveries, bounces, complaints, rejects, opens and clicks.
- BYOMailer does not suppress addresses. A hard bounce or a complaint adds the address to the suppression list. Three soft bounces in a row also suppress the contact.
- Sequences stop after the current step. A `DELIVERY` event schedules the next step of a sequence for that contact.
- The last engagement date of a contact does not move. The sunset rule uses that date.

WARNING: Keep the worker running while accounts send email. Without it, BYOMailer continues to send to addresses that bounced or complained. AWS can then pause the SES account.

## Logs

The worker writes to the `ses-events` log channel. It is a daily file in `storage/logs` of the container, kept for 14 days:

```bash
docker compose exec ses-events sh -c 'tail -n 50 storage/logs/ses-events-*.log'
```

The worker also prints each poll to its standard output:

```bash
docker compose logs -f ses-events
```

`ProcessSesEventJob` runs in the `horizon` service. Its warnings go to the log of that service, for example `ProcessSesEventJob: refused a notification from a topic that no tenant owns`.

## The HTTP endpoint `/webhooks/ses`

Older installs subscribed an HTTPS endpoint to the SNS topic, not the SQS queue. The route `POST /webhooks/ses` still accepts these messages. It does these checks before it queues a job:

1. The body is an SNS JSON envelope.
2. The `TopicArn` is a topic that the AWS onboarding created for an account.
3. AWS signed the message. The SNS validator accepts only a signing certificate URL on an `sns.*.amazonaws.com` host over HTTPS.
4. The message is less than 24 hours old.
5. BYOMailer did not get the same `MessageId` before.

If a check fails, the endpoint answers 403 and logs `SesWebhookController: rejected SNS message` with the reason.

New accounts do not use this endpoint. To move the old HTTPS subscriptions to the SQS queue, run:

```bash
docker compose exec web php artisan ses-events:migrate-to-sqs --dry-run
docker compose exec web php artisan ses-events:migrate-to-sqs
```

| Option | Effect |
|---|---|
| `--dry-run` | Show the changes and make none. |
| `--user-id=` | Migrate only the credentials of this user ID. |

For each AWS credential with an SNS topic, the command subscribes the SQS queue to the topic. Then it removes the old subscription. The command needs `SES_EVENTS_SQS_QUEUE_ARN`.
