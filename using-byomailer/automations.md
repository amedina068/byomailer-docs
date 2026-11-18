---
title: Automations
description: Change the tags, lists and sequences of a contact when an event happens to that contact.
order: 9
---

# Automations

An automation does actions on a contact when an event happens to that contact. For example: when a contact gets the tag `customer`, add the contact to the sequence "Onboarding".

BYOMailer has two kinds of automations:

| Kind | Menu item | What it is |
|---|---|---|
| Automation | **Automations** | One trigger and its actions, in a form. |
| Visual automation | **Visual Automations** | A workflow on a canvas, with conditions, delays and branches. |

An automation belongs to the team member who made it. The lists, tags and sequences in it must belong to the same team member.

## Automations

### Create an automation

1. Open **Automations** and click **New automation**.
2. Enter a **Name**.
3. In **Condition**, select the trigger and its value. See [Triggers](#triggers).
4. In **Actions**, select the action and its value. See [Actions](#actions).
5. Click **Save automation**.

The dashboard form has one action. The MCP server accepts a list of actions. BYOMailer runs the actions in the order of the list. See [MCP tools reference](../mcp/tools-reference.md).

A new automation is live at once.

### Triggers

| Trigger | Label in the form | When it runs |
|---|---|---|
| `contact_added_to_list` | Contact added to list | The contact joins the selected list. |
| `removed_from_list` | Contact removed from list | The contact leaves the selected list. |
| `tag_added` | Tag added | The contact gets the selected tag. |
| `removed_tag` | Tag removed | The contact loses the selected tag. |
| `added_to_sequence` | Added to sequence | The contact joins the selected sequence. |
| `sequence_finished` | Sequence finished | The contact completes the selected sequence. See [Sequences](sequences.md). |
| `attribute_changed` | Attribute changes | A custom attribute of the contact changes. |

The form shows **Added to sequence** and **Sequence finished** only when you have a sequence. It shows **Attribute changes** only when your account has a custom attribute.

The `attribute_changed` trigger has two operators:

| Operator | Label | When it runs |
|---|---|---|
| `changed_to` | changes to | The attribute gets the value that you enter, and the old value was different. The value has a limit of 255 characters. |
| `changed` | changes | The attribute gets any new value. |

### Actions

| Action | Label in the form | What it does |
|---|---|---|
| `add_tag` | Add tag | Adds the tag to the contact. |
| `remove_tag` | Remove tag | Removes the tag from the contact. |
| `add_list` | Add to list | Adds the contact to the list. |
| `remove_list` | Remove from list | Removes the contact from the list. |
| `add_sequence` | Add to sequence | Adds the contact to the sequence. |

An action can start other automations. For example, the action **Add tag** can start an automation with the trigger **Tag added**.

The action **Add to sequence** obeys the enrollment rules of the sequence. If the contact does not match the sequence filters, or is in the sequence already, BYOMailer does not add the contact. See [Sequences](sequences.md).

### When an automation runs

BYOMailer runs automations on the `automations` queue. Queue workers must run. See [Queues and Horizon](../self-hosting/queues-and-horizon.md).

An automation reacts only to events that happen while it is live. It does not run for contacts that matched the trigger before.

### Statuses

| Status | Label | Meaning |
|---|---|---|
| Live | Live | The automation runs when its trigger happens. |
| Paused | Paused | The automation does not run. |

To pause or start an automation, open it and use the status switch. BYOMailer asks you to confirm the change.

An automation with the action **Add to sequence** can go live only when the sequence is live. If the sequence is not live, BYOMailer shows this error: `The selected sequence must be live before it can be used in an automation.` The dashboard form also checks this rule when you save.

The MCP server can save a paused automation that points to a draft sequence. Make the sequence live before you make the automation live.

Each automation has the type `simple`. The dashboard, the MCP server and the validation accept no other type.

## Visual automations

A visual automation is a workflow on a canvas. The workflow has nodes and the lines between them.

### Node types

| Node | What it does |
|---|---|
| Trigger | Starts the workflow. A workflow must have exactly one trigger. |
| Action | Does one action on the contact. |
| Condition | Checks the contact and continues on the `yes` branch or the `no` branch. |
| Delay | Waits for a time before it continues. |

#### Triggers

| Trigger | Label |
|---|---|
| `contact_added_to_list` | Contact added to list |
| `removed_from_list` | Removed from list |
| `tag_added` | Tag added |
| `removed_tag` | Tag removed |
| `added_to_sequence` | Added to sequence |
| `sequence_finished` | Sequence finished |

#### Actions

| Action | Label | What it does |
|---|---|---|
| `add_tag` | Add tag | Adds the tag to the contact. |
| `remove_tag` | Remove tag | Removes the tag from the contact. |
| `add_list` | Add to list | Adds the contact to the list. |
| `remove_list` | Remove from list | Removes the contact from the list. |
| `add_sequence` | Add to sequence | Adds the contact to the sequence, then waits. See below. |
| `unsubscribe_contact` | Unsubscribe contact | Unsubscribes the contact and ends the workflow for the contact. |

After the action **Add to sequence**, the workflow waits until the contact completes the sequence. The workflow continues at once in these cases:

- The contact is not in the sequence, for example because the sequence filters did not match.
- The sequence has no live step.
- The contact already got the last live step, or skipped it.

#### Conditions

| Condition | Label |
|---|---|
| `has_tag` | Has tag |
| `not_has_tag` | Does not have tag |
| `in_list` | In list |
| `not_in_list` | Not in list |
| `subscribed_to_topic` | Subscribed to topic |
| `not_subscribed_to_topic` | Not subscribed to topic |
| `in_sequence` | In sequence |
| `not_in_sequence` | Not in sequence |

#### Delays

A delay node has a duration of 1 or more, and a unit: `minutes`, `hours` or `days`.

### Build a visual automation

1. Open **Visual Automations** and create a visual automation.
2. Enter a name.
3. Add a trigger node and select its value.
4. Add action, condition and delay nodes. Connect them with lines.
5. Save.

BYOMailer does not save the workflow in these cases:

- The workflow has no trigger: `A workflow must have a trigger node.`
- The workflow has more than one trigger: `A workflow can only have one trigger node.`
- A line points to a node that does not exist.
- A node uses a tag, list, topic or sequence that does not belong to you.
- An **Add to sequence** node uses a sequence that is not live.

### Statuses

A visual automation has the status `draft` or `live`. A new visual automation has the status `draft`. To go live, all the sequences of its **Add to sequence** nodes must be live.

### How a workflow runs

Each contact in a workflow has one enrollment. A contact can be in a workflow only one time.

Every minute, the scheduler runs `visual-automations:process`. The command finds the enrollments of live workflows that have a step ready to run. It puts one job for each enrollment on the queue.

The job moves the contact through the nodes:

1. An action node runs its action. Then the contact goes to the next nodes.
2. A condition node checks the contact. Then the contact goes to the nodes on the `yes` line or on the `no` line.
3. A delay node waits until its time is over.
4. When the contact has no more nodes, the enrollment is complete.

If the contact unsubscribes, BYOMailer ends the enrollment and skips the remaining nodes.

If you pause a workflow, the steps of its contacts wait. They continue when the workflow is live again.

The page of a workflow shows the number of contacts that wait at each node. The **Contacts** page of a workflow lists the enrolled contacts.

TODO(owner): On `oss/prep`, no listener or job calls `VisualAutomationEngine::enroll()`. Thus a trigger event does not put a contact into a visual automation. How does a contact enter a visual automation?
