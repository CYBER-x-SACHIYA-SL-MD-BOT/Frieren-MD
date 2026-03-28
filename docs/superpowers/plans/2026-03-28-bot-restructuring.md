# Bot Restructuring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the bot structure, rename files to kebab-case English, modularize the core, and provide a semantic Data API for easier development.

**Architecture:**

- `system/core/bot.js` for initialization.
- `system/db/data.js` enhancement for semantic user/group access.
- Batch renaming of `cmd/command/` and `cmd/plugins/`.

**Tech Stack:** Node.js, JSDoc, LowDB.

---

### Task 1: Semantic Data API Enhancement

**Files:**

- Modify: `system/db/data.js`

- [ ] **Step 1: Implement `User` and `Group` helper classes**

```javascript
/**
 * Helper class for semantic user data interaction
 */
class User {
    constructor(jid, data) {
        this.jid = jid
        this._data = data
    }

    addExp(amount) {
        this._data.exp += amount
        return this
    }

    useLimit(amount = 1) {
        this._data.limit -= amount
        return this
    }

    async save() {
        await saveDbDebounced()
    }
}

// Add these exports
export const user = jid => {
    const data = db().key[jid] || authUserSync(jid)
    return new User(jid, data)
}
```

- [ ] **Step 2: Commit**

```bash
git add system/db/data.js
git commit -m "feat(db): add semantic user and group helpers"
```

---

### Task 2: Modularize Bot Core

**Files:**

- Create: `system/core/bot.js`
- Modify: `index.js`

- [ ] **Step 1: Move initialization logic from `index.js` to `system/core/bot.js`**

Extract `startBot`, `evConnect`, and socket listeners into `system/core/bot.js`.

- [ ] **Step 2: Simplify `index.js`**

```javascript
import './system/global.js'
import { startBot } from './system/core/bot.js'
import { loadAll, watch } from './cmd/handle.js'

;(async () => {
    await startBot()
    await loadAll()
    watch()
})()
```

- [ ] **Step 3: Commit**

```bash
git add system/core/bot.js index.js
git commit -m "refactor: modularize bot core and simplify index.js"
```

---

### Task 3: Semantic File Renaming (Commands & Plugins)

**Files:**

- Rename: All files in `cmd/command/` and `cmd/plugins/` (e.g., `hytamkan.js` -> `black-white-filter.js`)

- [ ] **Step 1: Batch rename Indonesian files to English kebab-case**

Run:

```bash
# Example renames
mv cmd/command/tools/hytamkan.js cmd/command/tools/black-white-filter.js
mv cmd/command/tools/cekid.js cmd/command/tools/check-id.js
mv cmd/command/tools/ssweb.js cmd/command/tools/web-screenshot.js
mv cmd/plugins/tools/hytamkan.js cmd/plugins/tools/black-white-filter.js
# ... continue for all files
```

- [ ] **Step 2: Commit**

```bash
git add cmd/
git commit -m "refactor: rename all command/plugin files to semantic English kebab-case"
```

---

### Task 4: In-Code Documentation (JSDoc)

**Files:**

- Modify: `system/*.js`

- [ ] **Step 1: Add JSDoc to core system functions**

Add headers to `handleCmd`, `smsg`, `getMetadata`, etc.

```javascript
/**
 * Processes incoming messages and executes the matching command
 * @param {object} m - The message object
 * @param {object} xp - WASocket instance
 * @param {object} store - Baileys store
 */
export const handleCmd = async (m, xp, store) => { ... }
```

- [ ] **Step 2: Commit**

```bash
git add system/
git commit -m "docs: add JSDoc to core system functions"
```

---

### Task 5: Final Verification

- [ ] **Step 1: Verify bot starts and loads all renamed commands**

Run: `node index.js`
Expected: "Berhasil memuat total X cmd" with correct counts.
