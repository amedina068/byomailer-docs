---
title: Connect AWS SES
description: Connect the AWS account of an account to BYOMailer, add a sender identity, and leave the SES sandbox.
order: 5
---

# Connect AWS SES

BYOMailer sends email through Amazon SES in your own AWS account. Before you can send, you connect AWS one time. Then you add a sender identity for your domain.

The app has the same procedure as a guide with screenshots, at `/documentation/guides/getting-started`.

## Before you start

You need these items:

- An AWS account. The in-app guide at `/documentation/guides/create-aws-account` shows how to create one.
- A domain that you own, and access to its DNS records.
- The SQS queue of the instance. The owner of the instance sets it up one time (`SES_EVENTS_SQS_QUEUE_ARN`). Read [SES events](../self-hosting/ses-events.md).

The access policy of the SQS queue must allow the SNS topics of your AWS account. Give your AWS account ID to the owner of the instance before you start. The owner adds it to the queue policy.

BYOMailer stores the AWS credentials for each user. The user who connects AWS sends with these credentials.

TODO(owner): The code stores the AWS credentials by user (`User::sesCredential`), and the newsletter schedule accepts only sender identities of the current user. Must each team member of an account connect AWS and add a sender identity, or can team members share the credentials of the account?

## Open the AWS onboarding

The AWS onboarding is at `/onboarding/aws`. You can also open it in these places:

- The **Getting Started** checklist in the dashboard: **Add AWS credentials**.
- **Settings > Email Credentials**, when no credentials exist.

The onboarding has four steps: **IAM User**, **Permissions**, **Credentials**, and **Complete**.

## Step 1: Create an IAM user

1. Sign in to the AWS Console.
2. Open **IAM** (Identity and Access Management).
3. Click **Users**, then **Create user**.
4. Enter a user name, for example `byomailer-ses`.
5. Click **Next** to go to the permissions.

## Step 2: Attach the IAM policy

The onboarding screen shows the IAM policy that BYOMailer needs. Copy it from the screen, or from this page.

1. On the permissions page, click **Attach policies directly**.
2. Click **Create policy**.
3. Select the **JSON** tab.
4. Paste the policy.
5. Give the policy a name, for example `BYOMailerSESPolicy`.
6. Attach the policy to the new user.
7. Complete the user creation.

This is the policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ses:GetAccount",
                "ses:SendEmail",
                "ses:SendRawEmail",
                "ses:SendBulkEmail",
                "ses:SendBulkTemplatedEmail",
                "ses:CreateEmailIdentity",
                "ses:GetEmailIdentity",
                "ses:PutEmailIdentityMailFromAttributes",
                "ses:PutEmailIdentityConfigurationSetAttributes",
                "ses:CreateTemplate",
                "ses:DeleteTemplate",
                "ses:ListTemplates",
                "ses:ListConfigurationSets",
                "ses:GetConfigurationSet",
                "ses:GetConfigurationSetEventDestinations",
                "ses:CreateConfigurationSet",
                "ses:CreateConfigurationSetEventDestination",
                "ses:UpdateConfigurationSetEventDestination",
                "ses:PutConfigurationSetTrackingOptions",
                "ses:DeleteConfigurationSet",
                "ses:CreateTenant",
                "ses:CreateTenantResourceAssociation",
                "ses:GetTenant",
                "ses:UpdateReputationEntityPolicy",
                "ses:DeleteTenantResourceAssociation",
                "sns:CreateTopic",
                "sns:DeleteTopic",
                "sns:Subscribe",
                "sns:Unsubscribe"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "sts:GetCallerIdentity",
                "iam:SimulatePrincipalPolicy"
            ],
            "Resource": "*"
        }
    ]
}
```

The permissions have these uses:

| Group | Permissions | Use |
|---|---|---|
| Email sending | `ses:SendEmail`, `ses:SendRawEmail`, `ses:SendBulkEmail`, `ses:SendBulkTemplatedEmail` | Send the emails. |
| Account and identity | `ses:GetAccount`, `ses:CreateEmailIdentity`, `ses:GetEmailIdentity`, `ses:PutEmailIdentityMailFromAttributes`, `ses:PutEmailIdentityConfigurationSetAttributes` | Read the sending quota. Register and verify domains. Set the MAIL FROM domain and the configuration set of an identity. |
| Templates | `ses:CreateTemplate`, `ses:DeleteTemplate`, `ses:ListTemplates` | Manage the SES templates for bulk sends. |
| Configuration sets | `ses:ListConfigurationSets`, `ses:GetConfigurationSet`, `ses:GetConfigurationSetEventDestinations`, `ses:CreateConfigurationSet`, `ses:CreateConfigurationSetEventDestination`, `ses:UpdateConfigurationSetEventDestination`, `ses:PutConfigurationSetTrackingOptions`, `ses:DeleteConfigurationSet` | Send the SES events to SNS, and turn open and click tracking on or off. |
| Tenant | `ses:CreateTenant`, `ses:CreateTenantResourceAssociation`, `ses:GetTenant`, `ses:UpdateReputationEntityPolicy`, `ses:DeleteTenantResourceAssociation` | Keep the sends of BYOMailer in a separate SES tenant. |
| SNS | `sns:CreateTopic`, `sns:DeleteTopic`, `sns:Subscribe`, `sns:Unsubscribe` | Create the SNS topic for the SES events and subscribe it to the SQS queue. |
| Verification | `sts:GetCallerIdentity`, `iam:SimulatePrincipalPolicy` | Make sure that the keys work, and read which permissions the user has. |

The in-app guide at `/documentation/guides/create-policies` explains each permission.

## Step 3: Create an access key

1. In IAM, open the user that you created.
2. Click the **Security credentials** tab.
3. In **Access keys**, click **Create access key**.
4. Select **Third-party service** as the use case.
5. Accept the confirmation, then click **Next**.
6. Optional: add a description tag, for example `BYOMailer SES access`.
7. Click **Create access key**.
8. Copy the **Access key ID** and the **Secret access key**.

CAUTION: Copy the secret access key before you close the page. AWS shows it only one time. If you lose it, create a new access key.

WARNING: Keep the access key secret. Do not put it in source control, in a public place, or in browser code.

## Step 4: Enter the credentials

1. In the onboarding, go to the **Credentials** step.
2. Enter the **Access Key ID**.
3. Enter the **Secret Access Key**.
4. Enter the **AWS Region** where you want to send, for example `us-east-1` or `eu-west-1`.
5. Click **Verify & Save**.

The form accepts these values:

| Field | Rule |
|---|---|
| Access Key ID | 16 to 32 characters. Only uppercase letters and digits. |
| Secret Access Key | 40 to 128 characters. |
| AWS Region | A region code, for example `us-east-1`. The default is `us-east-1`. |

When you click **Verify & Save**, BYOMailer does these steps:

1. It calls `sts:GetCallerIdentity` to make sure that the keys work, and reads the AWS account ID.
2. It calls SES to make sure that the user can read the configuration sets and the templates.
3. It creates an SNS topic in your AWS account. The name starts with `mailautomation-`.
4. It subscribes the topic to the SQS queue of the instance.
5. It creates an SES tenant with the name `byomailer`.
6. It saves the credentials, encrypted with `APP_KEY`, and reads the sending quota.

If step 4 or step 5 fails, BYOMailer removes the new SNS topic again. When all steps pass, the screen shows **Credentials Verified!**. Click **Set up Email Identity** to continue.

If a step fails, the screen shows **Verification Failed** and one of these errors:

| Error | Cause |
|---|---|
| A message from AWS, for example "The security token included in the request is invalid." | The access key or the secret key is not correct. |
| "SES access denied: The IAM credentials must have SES, SNS, and IAM permissions. ..." | The IAM user cannot call SES. Attach the policy of step 2. |
| "SES template access denied: The IAM credentials must have permissions to manage email templates. ..." | The policy has no template permissions. |
| "Failed to create SNS topic: ..." | The IAM user cannot create SNS topics. |
| "SQS queue ARN is not configured. Set SES_EVENTS_SQS_QUEUE_ARN in your environment." | The owner of the instance did not set the SQS queue. |
| "Failed to subscribe SNS topic: ..." | AWS refused the subscription to the SQS queue. |
| "Failed to provision SES tenant: ..." | The IAM user cannot create the SES tenant. |

TODO(owner): Step 3 of the onboarding screen tells the user to set the SNS_WEBHOOK_ENDPOINT variable, but no code reads it. SES events come through SQS. Can that text go?

## Look at the connection

Open **Settings > Email Credentials**. The page shows:

- The region, the date of the last change, and a hint of the access key.
- The SES sending quota: **Sandbox** or **Production**, the sending status, the emails sent in the last 24 hours, the 24-hour limit, and the **Max Send Rate**. Click **Refresh** to read the quota again.
- **API Permissions**: the SES permissions that BYOMailer found for the IAM user. Click **Recheck** to read them again.

To use new keys, run the AWS onboarding again at `/onboarding/aws`. It replaces the saved keys and creates a new SNS topic.

TODO(owner): The **Update Credentials** form in **Settings > Email Credentials** saves only the keys and the region. It does not create the SNS topic, the SQS subscription, or the SES tenant, so new sender identities get no event destination. Is that intended, or must the form run the same steps as the onboarding?

## Step 5: Add a sender identity

A sender identity is a domain that SES verified, and the sender address on that domain. The app calls it an identity.

1. Open **Settings > Identities**.
2. Click **Add Identity**.
3. In **Select domain**, enter a new domain, for example `example.com`. BYOMailer registers it in SES for you. If the domain already exists in your AWS account, select it in the list.
4. Click **Next**.
5. In **Tracking**, select **Track opens**, **Track clicks**, or both.
6. Click **Next**.
7. In **Sender**, enter the **Local part** of the sender address, for example `hello`.
8. Optional: enter a **Display name**.
9. Optional: enter a **MAIL FROM domain**, for example `mail.example.com`. If the domain already has a MAIL FROM domain in AWS, BYOMailer keeps it.
10. Click **Save identity**.
11. In **DNS records**, copy each record to the DNS of your domain.

BYOMailer also creates an SES configuration set for the identity. The configuration set sends the events of the identity to your SNS topic.

The **DNS records** step shows these records:

| Purpose | Type | Name | Value |
|---|---|---|---|
| DKIM (one record for each DKIM token from AWS) | `CNAME` | `<token>._domainkey.example.com` | `<token>.<dkim-domain>` |
| MAIL FROM (only with a MAIL FROM domain) | `MX` | `mail.example.com` | `feedback-smtp.<region>.amazonses.com`, priority 10 |
| MAIL FROM (only with a MAIL FROM domain) | `TXT` | `mail.example.com` | `v=spf1 include:amazonses.com ~all` |
| DMARC | `TXT` | `_dmarc.example.com` | `v=DMARC1; p=none;` |

The DKIM domain depends on the region. In most regions, it is `dkim.amazonses.com`. In some regions, AWS uses `dkim.<region>.amazonses.com`.

AWS finds the records some minutes after the DNS change is live. The scheduler reads the status of each identity from AWS every 15 minutes. To read it now, open the identity and click **Recheck status**.

[Sender identities](../using-byomailer/sender-identities.md) explains the identity settings. [Custom domains](../using-byomailer/custom-domains.md) explains custom tracking and link domains.

## Step 6: Leave the SES sandbox

A new SES account starts in the sandbox. In the sandbox, SES sends only to verified addresses and domains. The in-app guide gives the sandbox limits: 200 emails in 24 hours, and 1 email each second.

**Settings > Email Credentials** shows **Sandbox** or **Production**.

1. Open the SES console in the region that you entered in BYOMailer.
2. Click **Request production access** in the sandbox banner, or on the **Account dashboard**.
3. Select the mail type, for example **Marketing**.
4. Enter the URL of your website.
5. Describe your use: the contacts opt in, BYOMailer processes the bounces and the complaints, and each email has an unsubscribe link.
6. Submit the request.

The in-app guide says that AWS Support gives a first answer within 96 hours. AWS sends an email when the account moves to production.

You can use BYOMailer in the sandbox while you wait. Send only to verified addresses until AWS approves the request.

## Next step

[Send your first newsletter](first-newsletter.md).
