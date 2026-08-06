# ⚙️ Preferences & Conventions

## Code Style
- **Language**: JavaScript (ES modules in frontend, CommonJS in backend server)
- **Formatter**: Prettier-compatible style; 2-space indentation
- **Naming**: camelCase for variables/functions, PascalCase for components/models
- **Comments**: Minimal — code should be self-documenting; comments for complex logic only

## Architecture Patterns
- REST API (not GraphQL)
- Sequelize models with associations (belongsTo, hasMany, belongsToMany)
- Controllers handle business logic; routes are thin
- Frontend: React functional components with hooks

## Workflow Preferences
- Prefers working, runnable code over pseudocode
- No placeholders — implement real logic
- Always check for existing patterns in the codebase before introducing new ones
- Document breaking changes explicitly

## Tool Preferences
- MySQL (not PostgreSQL, not MongoDB)
- Sequelize ORM (not raw SQL unless necessary)
- Vite (not CRA / webpack)
- No TypeScript (plain JavaScript)

## Deployment & Database Safety Rules
- **Live Database Protection**: On production/hosting (`ims.hunarasaan.com`), NEVER overwrite or pull demo/seed data into the live MySQL database.
- **Schema Updates Only**: When code updates are pulled on production, only create missing tables/columns (`sequelize.sync({ alter: true })` or migration scripts). Existing live data (students, payments, users) must remain untouched.
- **Code Impact Awareness**: Always review existing permissions, role checks, and component dependencies before modifying code to prevent regression bugs across roles (`admin`, `accounts_manager`, `manager`, `staff`).

## Certificate System & Document Export Patterns
- **Certificate Model & Auto-Sync**: The `Certificate` model is registered in `server/models/index.js` and imported in `server/index.js` to ensure `sequelize.sync({ alter: true })` auto-creates/migrates the `Certificates` table in MySQL.
- **PDF & Image Generation Engine**: Use `html-to-image` (`toPng`) + `jsPDF` for client-side PDF export. Do NOT use legacy `html2canvas` because its custom JS CSS parser crashes on Tailwind v4 `oklch()` colors and CSS variables. `html-to-image` uses native browser SVG `<foreignObject>` rendering.
- **Express Payload Limits**: High-resolution base64 data URIs (e.g. certificate PDFs/PNGs) require `express.json({ limit: '50mb' })` and `express.urlencoded({ limit: '50mb', extended: true })` in `server/index.js` to prevent 413/500 PayloadTooLarge errors.
- **Base64 File Saving**: When parsing base64 file payloads in controllers (e.g., `certificateController.js`), always split on `base64,` (`pdfBase64.split('base64,')[1]`) to safely extract raw binary data without getting corrupted by jsPDF data URI parameters (e.g., `;filename=...`).
- **WhatsApp Direct Chat Links**: Always format local Pakistani phone numbers (`03XXXXXXXXX`) to international format (`923XXXXXXXXX`) before embedding in `https://wa.me/` URLs.
- **API Client Response Unwrapping**: `src/utils/api.js` automatically unwraps `response.data` in its response interceptor. Component code should safely access response objects without assuming extra `.data` wrapping.

## AI Assistant Behavior
- Read memory files at the start of every session
- Update memory files when new decisions, preferences, or people are introduced
- Log significant decisions to `decisions.csv`
- Be concise; avoid over-explaining known context

---
*Last updated: 2026-08-06*
