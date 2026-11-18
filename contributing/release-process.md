---
title: Release process
description: Add release notes and changelog lines for a change that users can see, and how versions, tags and images work.
order: 4
---

# Release process

This page explains the release notes, the changelog, the version, the tag and the Docker image of a release.

## Release notes

`resources/release-notes.json` holds the release notes. The instance shows them at `/documentation/release-notes`.

After a change that users can see, add a line to this file. Add it under the date of the change, in the same pull request.

### Format

The file is one JSON object:

- Each key is a date in the form `YYYY-MM-DD`.
- Each value is an array of strings. Each string is one release note.

```json
{
    "2026-01-15": [
        "New example feature. Open Settings, Example to use it.",
        "The example page now shows the date of the last change."
    ],
    "2026-01-14": [
        "The example list now loads faster."
    ]
}
```

`App\Support\ReleaseNotes` reads the file. It sorts the dates from new to old, and it shows each date as, for example, `January 15, 2026`.

### Rules

- Write plain text. The page shows each string as it is, so Markdown or HTML shows as raw text.
- Write one change in each string. Keep it short, and tell the user what to do.
- If a date already has a key, add the line to its array. Do not add a second key with the same date.
- Make sure that the file is valid JSON. If the JSON is not valid, the loader throws an exception, and the release notes page breaks.

`tests/Feature/DocumentationTest.php` renders the release notes page from the file. Run it after you change the file:

```bash
php artisan test --compact --filter=test_release_notes_page_renders_data_from_release_notes_file
```

### Example

1. Open `resources/release-notes.json`.
2. Find the key of today. If it does not exist, add it at the top of the object.
3. Add one string for the change.
4. Run the test above.

## Version scheme

BYOMailer uses semantic versioning. The first version is 0.1.0. The version number lives in `CHANGELOG.md` and in the Git tag of the release. `composer.json` and `package.json` have no version field.

## Changelog

`CHANGELOG.md` holds the changelog in the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. A pull request that changes the behavior for users adds one line under `[Unreleased]`. Use one of these sections: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

`CHANGELOG.md` lists the changes of each version of the code. `resources/release-notes.json` holds the dated notes that the dashboard shows. A change for users goes in both files.

## Tags

The tag name is `v` and the version, for example `v0.1.0`. The Docker workflow builds an image only for a tag with this format.

TODO(owner): Who creates the release tag, from which branch, and how does the `[Unreleased]` section of `CHANGELOG.md` become a version?

## Docker image

A push of a Git tag `v*` builds the image for `linux/amd64` and `linux/arm64`, and publishes it to `ghcr.io/<owner>/byomailer`. `<owner>` is the GitHub owner of the repository, in lowercase. A maintainer can also start the workflow manually.

| Git tag | Image tags |
|---|---|
| `v1.2.3` | `1.2.3`, `1.2`, `1` and `latest` |
| `v0.4.1` | `0.4.1`, `0.4` and `latest`. A `v0` tag gets no major tag. |
| `v1.3.0-rc.1` | `1.3.0-rc.1` only. `latest` stays on the last stable release. |
| A manual run on a branch | The branch name and `sha-<commit>` |

For the upgrade steps of an instance, read [Upgrading](../getting-started/upgrading.md).
