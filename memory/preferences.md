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

## AI Assistant Behavior
- Read memory files at the start of every session
- Update memory files when new decisions, preferences, or people are introduced
- Log significant decisions to `decisions.csv`
- Be concise; avoid over-explaining known context

---
*Last updated: 2026-08-06*
