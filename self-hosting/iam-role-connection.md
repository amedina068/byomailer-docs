---
title: IAM role connection
description: Let each account connect its AWS account through an IAM role that BYOMailer assumes, in place of access keys.
order: 12
---

# IAM role connection

An account can connect its AWS account in two ways:

- With the access keys of an IAM user. This is the default.
- With an IAM role that BYOMailer assumes. The account gives BYOMailer no keys.

The role connection is off by default. This page tells the owner of the instance how to turn it on. [Connect AWS SES](../getting-started/connect-aws-ses.md#connect-with-an-iam-role) tells an account how to connect.

## How the role connection works

Each account makes a CloudFormation stack in its own AWS account. The template of the stack is `public/aws/byomailer-ses-role.json` in the app repository. The app also serves it at `/aws/byomailer-ses-role.json`.

The stack makes one IAM role with these rules:

- The role trusts one principal only: the IAM user or the IAM role of your server.
- The principal can assume the role only with the external ID of the account. BYOMailer makes each external ID from 32 random bytes. The account cannot choose it or change it.
- The role can use only the SES and SNS actions that BYOMailer calls. The SNS actions work only on topics with names that start with `mailautomation-`.
- A session of the role lasts 1 hour or less.

When an account connects, BYOMailer builds the role ARN from the AWS account ID of the account and the role name. Then it assumes the role and checks the SES access. Then it creates the SNS topic and the SES tenant, as for access keys.

For each AWS call, BYOMailer uses temporary credentials from STS. It keeps them encrypted in the cache and gets new credentials 5 minutes before they expire. It never writes the temporary credentials to the database or to the log.

## Turn on the role connection

1. In the AWS account that runs BYOMailer, create an IAM user or an IAM role for the server.
2. Give that principal this policy:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": "sts:AssumeRole",
         "Resource": "arn:aws:iam::*:role/byomailer-ses"
       }
     ]
   }
   ```

   If you change `SES_ROLE_NAME`, use that name in the `Resource`.

3. In `.env`, set the ARN of the principal:

   ```dotenv
   SES_ROLE_PRINCIPAL_ARN=arn:aws:iam::111111111111:user/byomailer
   ```

4. If the principal is an IAM user, create an access key for it. Set the key in `.env`:

   ```dotenv
   SES_ROLE_ACCESS_KEY_ID=...
   SES_ROLE_SECRET_ACCESS_KEY=...
   ```

   If the server runs with an instance role, set that role as `SES_ROLE_PRINCIPAL_ARN` and keep the two key variables empty. The AWS SDK then finds the credentials of the instance role itself.

5. Optional: upload `public/aws/byomailer-ses-role.json` to an S3 bucket that AWS can read. Set `SES_ROLE_TEMPLATE_URL` to the S3 URL of the file.
6. Recreate the containers with `docker compose up -d`.

CAUTION: Keep `SES_ROLE_PRINCIPAL_ARN` the same after accounts connect. The stack of each account trusts this ARN. If you change it, each account must update its stack.

## The quick-create link

With `SES_ROLE_TEMPLATE_URL`, the onboarding page shows **Open AWS CloudFormation**. The link opens the stack in the CloudFormation console, with the principal ARN, the external ID and the role name filled in.

A quick-create link accepts only a template in Amazon S3. Without `SES_ROLE_TEMPLATE_URL`, the onboarding page shows **Download the template**. The account then uploads the file in the console and copies the three values from the page.

## Environment variables

| Variable | `.env.example` | Code default | Purpose |
|---|---|---|---|
| `SES_ROLE_PRINCIPAL_ARN` | empty | - | The IAM user or IAM role of the server. When it is empty, the role connection is off, and `POST /onboarding/aws/role` answers 404. |
| `SES_ROLE_ACCESS_KEY_ID` | empty | - | The access key of the principal. Keep it empty with an instance role. |
| `SES_ROLE_SECRET_ACCESS_KEY` | empty | - | The secret key of that access key. |
| `SES_ROLE_STS_REGION` | `us-east-1` | `us-east-1` | The region of the STS calls and of the console link. |
| `SES_ROLE_NAME` | `byomailer-ses` | `byomailer-ses` | The name of the role in each AWS account. |
| `SES_ROLE_TEMPLATE_URL` | empty | - | The S3 URL of the template. It turns on the quick-create link. |

## If a role stops working

If AWS refuses the role, a request shows this error:

> AWS refused to let BYOMailer use the IAM role. Make sure that the stack is complete and that it uses the external ID of this account. A new role can need 1 minute before it works.

The scheduled commands write the same error in their output and continue with the next account. Make sure that the stack of the account still exists and that `SES_ROLE_PRINCIPAL_ARN` did not change.
