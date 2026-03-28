# Feature Reduction (50%) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the bot's codebase by 50% by removing non-core categories (RPG, Games, Fun, AI, etc.) to prepare for a public release.

**Architecture:** Surgical removal of command/plugin directories and their associated system libraries, followed by clean-up of imports in the main entry point (`index.js`).

**Tech Stack:** Node.js, Shell (find/rm).

---

### Task 1: Remove Non-Core Command Directories

**Files:**

- Delete: `cmd/command/ai/`, `cmd/command/anime/`, `cmd/command/channel/`, `cmd/command/download/`, `cmd/command/economy/`, `cmd/command/fun/`, `cmd/command/game/`, `cmd/command/islamic/`, `cmd/command/rpg/`

- [ ] **Step 1: Execute removal of command directories**

Run:

```bash
rm -rf cmd/command/ai cmd/command/anime cmd/command/channel cmd/command/download cmd/command/economy cmd/command/fun cmd/command/game cmd/command/islamic cmd/command/rpg
```

- [ ] **Step 2: Verify deletion**

Run: `ls cmd/command`
Expected: Only `group`, `info`, `main`, `owner`, `search`, `tools` remain.

- [ ] **Step 3: Commit**

```bash
git add cmd/command
git commit -m "refactor: remove non-core command categories"
```

---

### Task 2: Remove Non-Core Plugin Directories

**Files:**

- Delete: `cmd/plugins/ai/`, `cmd/plugins/anime/`, `cmd/plugins/download/`, `cmd/plugins/fun/`, `cmd/plugins/game/`, `cmd/plugins/islamic/`, `cmd/plugins/maker/`, `cmd/plugins/rpg/`, `cmd/plugins/sticker/`

- [ ] **Step 1: Execute removal of plugin directories**

Run:

```bash
rm -rf cmd/plugins/ai cmd/plugins/anime cmd/plugins/download cmd/plugins/fun cmd/plugins/game cmd/plugins/islamic cmd/plugins/maker cmd/plugins/rpg cmd/plugins/sticker
```

- [ ] **Step 2: Verify deletion**

Run: `ls cmd/plugins`
Expected: Only `group`, `main`, `owner`, `search`, `tools`, `user` remain.

- [ ] **Step 3: Commit**

```bash
git add cmd/plugins
git commit -m "refactor: remove non-core plugin categories"
```

---

### Task 4: Prune Imports in `index.js`

**Files:**

- Modify: `index.js`

- [ ] **Step 1: Remove imports of deleted files**

```javascript
// Remove these lines
import gameHandler from './system/game.js'
import { checkAdzan, checkRamadhan } from './system/islamic_timer.js'
import { autofarm, timerhistory, cost_robbery } from './system/gamefunc.js'
```

- [ ] **Step 2: Remove function calls of deleted features**

```javascript
// Remove these lines in startBot function
autofarm()
cost_robbery()
timerhistory(xp)
setInterval(() => {
    checkAdzan(xp)
    checkRamadhan(xp)
}, 5000)
```

- [ ] **Step 3: Verify syntax**

Run: `node -c index.js`
Expected: No syntax errors.

- [ ] **Step 4: Commit**

```bash
git add index.js
git commit -m "refactor: prune index.js imports and function calls"
```

---

### Task 5: Final Verification

- [ ] **Step 1: Check total file count**

Run: `find cmd/command -type f | wc -l && find cmd/plugins -type f | wc -l`
Expected: Significantly reduced count (target ~191 combined).

- [ ] **Step 2: Dry run the bot**

Run: `npm start -- --dry-run` (if supported) or just check for startup errors.
