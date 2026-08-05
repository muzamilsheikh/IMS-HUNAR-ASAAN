# 📋 Key Decisions Log

This file tracks high-level architectural and product decisions made during the project.
Detailed decision records (with reasoning and review dates) are in `decisions.csv`.

## Decision Index

| Date | Decision | Status | Review Due |
|------|----------|--------|------------|
| 2026-08-06 | Set up persistent memory system with /memory directory | ✅ Implemented | 2026-09-05 |
| 2026-08-06 | Destructure hasPermission in Students.jsx for accounts_manager | ✅ Implemented | 2026-09-05 |
| 2026-08-06 | Strict production DB protection policy on git deployment | ✅ Implemented | 2026-09-05 |

## Patterns Established
- Memory files live in `/memory/` at the project root
- Decisions are dual-logged: summary here, full record in `decisions.csv`
- 30-day review cadence for all significant decisions
- `review.sh` script surfaces decisions that are due for review
- All page components using permission checks MUST destructure `hasPermission` from `useApp()`

## Lessons Learned
- **Production DB Safety**: Code updates pulled to live hosting (`ims.hunarasaan.com`) must NEVER overwrite live MySQL records with local demo/seed data. Only schema modifications are allowed.
- **Component Perm Destructuring**: When adding permission checks in JSX components (e.g. `hasPermission('addStudent')`), always verify `hasPermission` is destructured from `useApp()`.

---
*Last updated: 2026-08-06*
