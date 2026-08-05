# Agent Instructions — Hunar Asaan CRM

## 🧠 Memory System: Read at Session Start

At the **start of every session**, read the following files to restore context:

```
memory/user.md        — who Muzamil is, tech stack, communication style
memory/people.md      — team members, contacts, stakeholders
memory/preferences.md — code style, architecture patterns, tool choices
memory/decisions.md   — key architectural and product decisions
```

Do **not** ask the user to re-explain context that is already in these files.

---

## 📝 Memory System: Update at Session End

At the **end of every session** (or whenever new information is revealed), update the relevant files:

- **New person introduced** → update `memory/people.md`
- **New tool/pattern/preference expressed** → update `memory/preferences.md`
- **Significant decision made** → log to `memory/decisions.csv` AND update `memory/decisions.md`
- **User profile changes** → update `memory/user.md`

---

## 📋 Decision Logging Protocol

When the user describes a decision they are making, immediately log it to `memory/decisions.csv` with these fields:

| Field | Format | Notes |
|-------|--------|-------|
| `date` | YYYY-MM-DD | Today's date |
| `decision` | Short description | What was decided |
| `reasoning` | Full sentence | Why this was chosen |
| `expected_outcome` | Full sentence | What success looks like |
| `review_date` | YYYY-MM-DD | Today + 30 days |
| `status` | `active` / `REVIEW DUE` / `reviewed` | Current state |

Also add a summary row to `memory/decisions.md`.

---

## 🔁 Review System

- A cron job runs daily at 08:00 PKT to flag decisions whose `review_date` has passed
- Flagged decisions get `status` changed to `REVIEW DUE`
- Run `./scripts/review.sh` to see all decisions due for review
- After reviewing a decision, update its `status` to `reviewed` and add notes

---

## 🏗️ Project Context

**Project**: Hunar Asaan CRM — Education Management System  
**Stack**: React + Vite + Tailwind (frontend), Node.js + Express + Sequelize (backend), MySQL  
**Owner**: Muzamil Irfan  
**Workspace root**: `Hunar Asaan CRM LOCAL FINAL/`

---

*This file is read by AI assistants to maintain persistent context across sessions.*
