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
| 2026-08-06 | Cleanly split base64 string after base64, separator to prevent PDF file corruption | ✅ Implemented | 2026-09-05 |
| 2026-08-17 | Dynamic secondary contact fields (Secondary Phone / Secondary Email / Guardian Contacts) with Plus icon | ✅ Implemented | 2026-09-16 |
| 2026-08-17 | Fix triplicate PDF challan 2-page print overflow & add Settings PNG signature upload option | ✅ Implemented | 2026-09-16 |
| 2026-08-17 | Fix ReferenceError instituteContact in FeeChallan.jsx destructuring | ✅ Implemented | 2026-09-16 |
| 2026-08-17 | Switch settings Multer middleware to upload.any() to fix 500 Unexpected field error | ✅ Implemented | 2026-09-16 |
| 2026-08-17 | Sync Setting DB schema & restart server process & fix Axios FormData boundary header | ✅ Implemented | 2026-09-16 |
| 2026-08-17 | Pass full backend URLs for logoUrl and signatureUrl to FeeChallan & generateReceipt | ✅ Implemented | 2026-09-16 |
| 2026-08-17 | Seed default signature SVG in server uploads & simplify img src in FeeChallan.jsx | ✅ Implemented | 2026-09-16 |
| 2026-08-17 | Add cache-busting timestamp & instant state sync for Settings PNG uploads | ✅ Implemented | 2026-09-16 |
| 2026-08-17 | Bind label htmlFor to input id for PNG signature upload dropzone in Settings.jsx | ✅ Implemented | 2026-09-16 |
| 2026-08-17 | Expand Multer fileFilter allowed image mimetypes & restart backend daemon PID 12553 | ✅ Implemented | 2026-09-16 |
| 2026-08-18 | Add dynamic branding inputs (Official Email & Website) and Authorized Signature Uploader API & bind to Fee Challans | ✅ Implemented | 2026-09-17 |
| 2026-08-20 | Triplicate fee challan PDF generator and template integration for email payments | ✅ Implemented | 2026-09-19 |
| 2026-08-20 | Ensure uploads subdirectories (branding, invoices, students, temp, etc.) and static express routing on server boot | ✅ Implemented | 2026-09-19 |
| 2026-08-20 | Configure Socket.IO with window.location.origin and reverse proxy SSL support | ✅ Implemented | 2026-09-19 |
| 2026-09-23 | Store logo/signature as base64 LONGTEXT in DB instead of file system (uploads/ is gitignored and wiped on deploy) | ✅ Implemented | 2026-10-23 |
| 2026-09-23 | Set socket.io transports to polling-first on production to eliminate wss:// WebSocket spam on cPanel shared hosting | ✅ Implemented | 2026-10-23 |
| 2026-09-23 | Notification Templates Manager + SendReminderModal — full Email/WhatsApp reminder system with Sequelize model, CRUD API, Settings tab, and Student Ledger modal | ✅ Implemented | 2026-10-23 |
| 2026-09-23 | Production cleanup — deleted 32 AI session .md files, 25+ server debug scripts, sensitive admin-credentials-backup.json; added React lazy/Suspense code splitting, Vite manualChunks vendor splitting, console.log purge, hardened .gitignore | ✅ Implemented | 2026-10-23 |

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
