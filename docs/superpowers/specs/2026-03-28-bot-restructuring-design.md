# Bot Restructuring Design: "Self-Documenting Bot"

**Goal:** Transform the bot into a clean, modular, and professional project that is easy for others to understand and contribute to without needing external documentation.

## 1. Semantic Renaming (Kebab-case)
All command and plugin files will be renamed from Indonesian/Abbreviated names to descriptive English names using kebab-case.
- **cmd/command/tools/hytamkan.js** -> `cmd/command/tools/black-white-filter.js`
- **cmd/command/tools/cekid.js** -> `cmd/command/tools/check-id.js`
- **cmd/command/tools/ssweb.js** -> `cmd/command/tools/web-screenshot.js`
- **cmd/command/tools/toanime.js** -> `cmd/command/tools/to-anime.js`
- *etc. for all files.*

## 2. Clean Data API (Semantic Accessors)
Refactor `system/db/data.js` to provide a higher-level API for user and group data. This removes the need for contributors to understand the underlying `db().key` structure.
- **User Helper:** `const user = db.user(jid); user.addExp(100); await user.save();`
- **Group Helper:** `const gc = db.group(jid); gc.mute();`
- **Validation:** Automatic registration of new users/groups when accessed through these helpers.

## 3. Modular Core
Move the heavy initialization logic out of `index.js` to keep the root of the project clean and focused on high-level orchestration.
- **New File:** `system/core/bot.js` - Handles WASocket initialization, event binding, and pairing logic.
- **Result:** `index.js` becomes a simple entry point that imports and starts the bot core.

## 4. In-Code Documentation (JSDoc)
Instead of a `CONTRIBUTING.md`, all core functions in the `system/` directory will receive standardized JSDoc comments.
- **Format:** `@param`, `@returns`, and `@description` tags for every exported function.
- **Benefit:** Developers get real-time intellisense/autocompletion and documentation directly in their IDE (VS Code, etc.).

## 5. Standardized Boilerplate
Commands will follow a strict, validated structure to ensure consistency.
- **Requirement:** `tags`, `desc`, and `run` must be present and correctly typed.

---
**Architecture:** Modular Core + Semantic Data API.
**Tech Stack:** Node.js, JSDoc, LowDB.
**Constraints:** No external documentation files; code must explain itself.
