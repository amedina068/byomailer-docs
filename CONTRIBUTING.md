# Contributing to the BYOMailer docs

Thank you for your help. This file gives the rules for a page and for a pull request. Read [README.md](README.md) for the folder structure, the front matter and the checks.

## Facts come from the code

- Each fact on a page must come from the code of the app. Read the code before you write about it.
- Copy the names of commands, environment variables, routes, fields and error codes from the code. Do not type them from memory.
- If the code does not answer a question, do not guess. Write a `TODO(owner):` line (see below).
- If the docs and the code do not agree, the code is correct. Correct the page, and open an issue in the app repository if the code looks wrong.
- Do not copy private planning files or agent files of the app into a page.

## The `TODO(owner):` convention

A `TODO(owner):` line is a question for the maintainer. Write it on its own line, in the place where the answer will go:

```markdown
TODO(owner): Does the scheduler need `onOneServer()` for instances with more than one app server?
```

- Write one question for each line.
- Say what the code shows, then ask the question.
- When the maintainer answers, replace the line with the answer.

## Simple English

Write every page in Simple English, in the style of ASD-STE100 (pragmatic mode). Many readers use translation tools or read English as a second language.

### Procedures (instructions)

- Use the imperative: "Run the migrations."
- Write one instruction in each sentence.
- Write 20 words or fewer in each sentence.
- Put a condition before the command: "If the build fails, read the log."
- Use a numbered list for steps that have an order.

### Descriptions (explanations)

- Use the simple present or the simple past.
- Write 25 words or fewer in each sentence.
- Write one topic in each paragraph, with six sentences or fewer.

### Words

- Use the active voice: "BYOMailer stores the key", not "The key is stored".
- Use `can`, `must` and `will`. Do not use `should`, `may`, `might`, `could` or `would`.
- Do not use contractions (`don't`, `it's`) or semicolons.
- Do not use filler words: `simply`, `just`, `easily`, `seamlessly`, `robust`, `leverage`, `utilize`.
- Write "for example" and "that is". Do not write "e.g.", "i.e." or "etc.".
- Use one term for one thing. These docs use: instance, owner, account, team member, contact, list, topic, tag, attribute, segment, newsletter, sequence, step, automation, template, block, sender identity, API token, environment variable.
- Write "make sure that" for a check.
- Keep code, commands, file paths and quoted errors exactly as they are. They count as one word.

### Warnings

Start a warning with `WARNING:` (a risk to data or security) or `CAUTION:` (a risk to the instance). Put the instruction first and the risk second.

## Voice

- Write for a person who runs or uses an instance. Use a neutral open-source voice.
- Do not write sales copy, prices or "sign up" text.
- Use the example host `https://byomailer.example` and the token placeholder `<your-token>`.
- Use `example.com` addresses for contacts and senders.
- Never put a real token, key, password or email address on a page.

## Code examples

- Give each API page an example in curl. A PHP example with the Laravel HTTP client is optional.
- Never put an API token in browser code. The token is secret.

## Pull requests

1. Make one change in each pull request.
2. Run `node scripts/check-docs.mjs`. If you have an app checkout, also set `BYOMAILER_APP_PATH`.
3. Fill in the pull request template.

The CI must pass before a merge.

## Pull request titles

The title of each pull request must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). The `PR title` check fails when the title does not follow the format. Examples:

- `docs(api): add the subscribe endpoint`
- `fix: correct the link to the backups page`
- `chore: check the anchors in the check script`

Use one of these types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore` or `revert`. The scope in parentheses is optional.

GitHub makes the release notes from the titles of the merged pull requests. Write each title for a person who reads the release notes.

## Triage

Each issue form adds a type label and the `needs-triage` label to a new issue. The maintainer reads each new issue, removes `needs-triage` and sets the correct type label: `bug`, `enhancement`, `documentation` or `question`.
