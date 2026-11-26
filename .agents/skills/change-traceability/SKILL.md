---
name: change-traceability
description: Keep repository changes traceable to the skill or workflow that guided them by referencing it in commit messages or PR notes.
---

# Change traceability

Use this skill whenever preparing a commit or pull request for repository changes.

## Required steps

1. Identify the skill that guided the change. If no available skill applies, state that explicitly and name the relevant repository rule or workflow instead; do not invent a skill reference.
2. Include the reference in at least one durable review artifact:
   - **Commit message:** add a footer such as `Skill: change-traceability` and identify the task-specific skill when different.
   - **PR notes:** add a `Skill / workflow` section naming the skill and briefly describing how it informed the change.
3. Keep the reference specific enough for a reviewer to locate it (skill name or path). If multiple skills materially guided the work, list each one.
4. Do not claim a skill was followed unless it was actually reviewed and applied. For work without a matching skill, use a clear fallback such as `Workflow: .agents/rules/tests-are-contract.md`.

## Example

```text
docs: clarify API verification

Skill: change-traceability
Workflow: .agents/rules/tests-are-contract.md
```
