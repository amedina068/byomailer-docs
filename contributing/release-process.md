---
title: Release process
description: Add release notes for a change that users can see, and the open questions about versions, tags and images.
order: 4
---

# Release process

This page explains the release notes of the app. The other parts of a release (the version, the changelog, the tag and the Docker image) are not in the code yet.

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

`composer.json` and `package.json` have no version field. The app repository has no Git tags.

TODO(owner): Which version scheme does BYOMailer use (for example, semantic versioning that starts at 1.0.0), and where does the version number live?

## Changelog

TODO(owner): The app has no changelog file on `oss/prep`. Which file holds the changelog, which format does it use, and how does it relate to `resources/release-notes.json`?

## Tags

TODO(owner): Which steps make a release tag (the tag name format, who creates it, and from which branch)?

## Docker image

The CI on `oss/prep` does not build or publish a Docker image. The `Dockerfile` builds the image locally.

TODO(owner): Where does the project publish the Docker image, which tags does it get, and which event starts the publish?

For the upgrade steps of an instance, read [Upgrading](../getting-started/upgrading.md).
