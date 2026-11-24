---
title: Release process
description: Write release notes and changelog lines for a change that users can see, and how versions, tags and images work.
order: 4
---

# Release process

This page explains the release notes, the changelog, the version, the tag and the Docker image of a release.

## Release notes

[Release notes](../getting-started/release-notes.md) in this docs repository holds the release notes. The app repository has no release notes file.

### In a pull request of the app

A pull request with a change that users can see has a `## Release note` section in its body. Write one or two short sentences in plain text. Tell the user what changed and what to do.

```markdown
## Release note

The example list now loads faster.
```

A pull request without a change for users has no `## Release note` section.

### When a release goes out

1. Collect the `## Release note` sections of the merged pull requests.
2. Open `getting-started/release-notes.md` in the docs repository.
3. Find the heading of the release date, for example `## November 19, 2026`. If it does not exist, add it above the other dates.
4. Add one bullet for each note. Copy the text of the note as it is.
5. Open a pull request in the docs repository.

### Rules

- Write plain text. Do not use Markdown links or HTML in a note.
- Write one change in each bullet.
- Keep the newest date first. Do not add a second heading for the same date.
- Do not change old notes.

## Version scheme

BYOMailer uses semantic versioning. The first version is 0.1.0. The version number lives in `CHANGELOG.md` and in the Git tag of the release. `composer.json` and `package.json` have no version field.

## Changelog

`CHANGELOG.md` holds the changelog in the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. A pull request that changes the behavior for users does not edit `CHANGELOG.md`. It adds one fragment file to `changelog.d/`. Two new files cannot have a merge conflict.

1. Name the file `<name>.<section>.md`, for example `changelog.d/newsletter-send-claim.fixed.md`.
2. For `<section>`, use one of these values: `added`, `changed`, `deprecated`, `removed`, `fixed`, `security`.
3. Write one entry as a Markdown list item that starts with `- `.

At release time, `scripts/changelog-release.sh` moves each fragment into its section under `[Unreleased]` in `CHANGELOG.md`. Then it removes the fragment files. The script stops on a file name with an unknown section.

`CHANGELOG.md` lists the changes of each version of the code. The release notes page of the docs lists the changes that users can see, by date. A change for users goes in a changelog fragment and in the `## Release note` section of the pull request.

## Tags

The tag name is `v` and the version, for example `v0.1.0`. The Docker workflow builds an image only for a tag with this format.

TODO(owner): Who creates the release tag, from which branch, and how does the `[Unreleased]` section of `CHANGELOG.md` become a version?

## Docker image

A push of a Git tag `v*` builds the image for `linux/amd64` and `linux/arm64`, and publishes it to `ghcr.io/amedina068/byomailer`. The workflow takes the owner from the GitHub owner of the repository, in lowercase. A maintainer can also start the workflow manually.

| Git tag | Image tags |
|---|---|
| `v1.2.3` | `1.2.3`, `1.2`, `1` and `latest` |
| `v0.4.1` | `0.4.1`, `0.4` and `latest`. A `v0` tag gets no major tag. |
| `v1.3.0-rc.1` | `1.3.0-rc.1` only. `latest` stays on the last stable release. |
| A manual run on a branch | The branch name and `sha-<commit>` |

For the upgrade steps of an instance, read [Upgrading](../getting-started/upgrading.md).
