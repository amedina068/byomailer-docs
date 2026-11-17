---
title: Storage
description: Where BYOMailer keeps uploaded images and other files, the MEDIA_DISK setting, and the storage settings of each user.
order: 6
---

# Storage

BYOMailer keeps the images that users upload for their emails. It also keeps the MaxMind database and some private files. This page tells where these files go and how to move the images to S3 or Cloudflare R2.

## The `storage` volume

`docker-compose.yml` mounts the volume `storage` at `/var/www/html/storage/app` in each app service. These folders are in the volume:

| Folder | Content |
|---|---|
| `storage/app/public` | The `public` disk: the uploaded images. BYOMailer serves them at `APP_URL/storage/...`. |
| `storage/app/private` | The `local` disk (`FILESYSTEM_DISK=local`). |
| `storage/app/geoip` | The MaxMind GeoLite2-City database, if you use MaxMind. |

The `web` service makes the link from `public/storage` to `storage/app/public` when it starts. It runs `php artisan byomailer:install --prepare` for this. The command creates the link only when it is missing.

The logs (`storage/logs`) are not in the volume. Back up the volume. See [Backups](backups.md).

## Where uploaded images go

The email editor has two upload paths:

| Upload | Route | Disk |
|---|---|---|
| An image that a user adds in the text editor | `POST /editor/images` | Always the `public` disk, folder `editor-images`. |
| An image that a user adds to the image gallery | `POST /gallery/images` | The storage of the user, if it is set and verified. If not, the disk of `MEDIA_DISK`. |

Both paths accept JPEG, PNG, GIF and WebP files of 5 MB or less.

TODO(owner): The text editor upload (`EditorImageController`) always uses the `public` disk. It ignores `MEDIA_DISK` and the storage settings of the user. Is this intentional?

## `MEDIA_DISK`

`MEDIA_DISK` selects the disk of the image gallery for users who did not set their own storage. `config/media-library.php` reads it.

| Value | Effect |
|---|---|
| `public` (default) | BYOMailer keeps the images in the `storage` volume and serves them from `APP_URL/storage`. |
| `s3` | BYOMailer keeps the images in an S3 bucket. The `s3` disk uses the variables below. |

The `s3` disk uses these environment variables:

| Variable | Purpose |
|---|---|
| `AWS_ACCESS_KEY_ID` | The access key of the instance. |
| `AWS_SECRET_ACCESS_KEY` | The secret key of the instance. |
| `AWS_DEFAULT_REGION` | The region of the bucket. |
| `AWS_BUCKET` | The bucket name. |
| `AWS_URL` | The public base URL of the files. |
| `AWS_ENDPOINT` | A custom endpoint for an S3-compatible service. |
| `AWS_USE_PATH_STYLE_ENDPOINT` | `true` for path-style URLs. The default is `false`. |

Recipients load the images from their mail client. Make sure that the URL of each image is public and uses HTTPS.

## Storage settings of each user

Each user can store the gallery images in an own bucket. The page is **Settings > Storage** (`/settings/storage`). The data is in the `user_storage_settings` table, one row for each user.

| Field | Rule |
|---|---|
| Provider | `s3` (Amazon S3) or `r2` (Cloudflare R2). |
| Bucket | Required. 255 characters or fewer. |
| Region | Required. 100 characters or fewer. |
| Access key ID | Required. BYOMailer encrypts it with `APP_KEY`. |
| Secret access key | Required. BYOMailer encrypts it with `APP_KEY`. |
| Public base URL | Required. It must start with `https://`. BYOMailer builds the image URLs from it. |
| Endpoint | Required for R2. Optional for S3. It must be a public https URL. |
| Path prefix | Optional. The default is `byomailer/<user id>`. The text `{user_id}` becomes the ID of the user. |

When the user saves the form, BYOMailer tests the bucket. It writes the file `.byomailer-connection-test` under the path prefix, reads it, and removes it. The bucket keys need `s3:PutObject`, `s3:GetObject` and `s3:DeleteObject`. If the test passes, BYOMailer marks the settings as verified and uses them for new gallery uploads.

## The endpoint must be a public https URL

The endpoint is a URL that the server of the instance connects to. To protect the internal network, BYOMailer checks the endpoint with `SsrfGuard`:

- The scheme must be `https`.
- The host must resolve to an IP address.
- The IP address must not be private, reserved, loopback, link-local or carrier-grade NAT (`100.64.0.0/10`).
- The host must not be an IPv6 literal.

BYOMailer does the check when the user saves the form and again at each connection. The S3 client then connects only to the IP address that passed the check. If the check fails, the form shows `The endpoint must be a public https URL.`

As a result, a storage service on the same private network as the instance, for example a local MinIO server, does not pass the check.
