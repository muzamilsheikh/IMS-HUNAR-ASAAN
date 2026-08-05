# 📋 Key Decisions Log

This file tracks high-level architectural and product decisions made during the project.
Detailed decision records (with reasoning and review dates) are in `decisions.csv`.

## Decision Index

| Date | Decision | Status | Review Due |
|------|----------|--------|------------|
| 2026-08-06 | Set up persistent memory system with /memory directory | ✅ Implemented | 2026-09-05 |
| 2026-08-06 | Destructure hasPermission in Students.jsx for accounts_manager | ✅ Implemented | 2026-09-05 |
| 2026-08-06 | Strict production DB protection policy on git deployment | ✅ Implemented | 2026-09-05 |
| 2026-08-06 | Certificate Generation & Management System (Live Canvas + Email PDF) | ✅ Implemented | 2026-09-05 |
| 2026-08-06 | Fix 500 error on Direct Admission creation in studentController.js | ✅ Implemented | 2026-09-05 |
| 2026-08-06 | Enhance checkStudentExists for User model & customId with live form warning | ✅ Implemented | 2026-09-05 |
| 2026-08-06 | Increase fetch timeout to 30s & add Socket.io HTTP polling fallback | ✅ Implemented | 2026-09-05 |
| 2026-08-06 | Auto-link existing User account when creating Student profile | ✅ Implemented | 2026-09-05 |
| 2026-08-06 | Fix Certificate API 500 error & html2canvas oklch color parsing for PDF | ✅ Implemented | 2026-09-05 |
| 2026-08-06 | Fix Certificate preview clipping, WhatsApp phone formatting & PDF onclone | ✅ Implemented | 2026-09-05 |
| 2026-08-06 | Eliminate oklch html2canvas crash via style backup/restore & mobile scaling | ✅ Implemented | 2026-09-05 |
| 2026-08-06 | Import Certificate model in server/index.js for MySQL table auto-sync | ✅ Implemented | 2026-09-05 |
| 2026-08-06 | Upgrade PDF Generator from html2canvas to native html-to-image | ✅ Implemented | 2026-09-05 |
| 2026-08-06 | Increase Express body-parser payload limit to 50mb for base64 PDFs | ✅ Implemented | 2026-09-05 |
| 2026-08-06 | Safely unwrap response object from apiClient.post in CertificateModal | ✅ Implemented | 2026-09-05 |

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
