# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.6.8] - 2026-03-25

### Added

- **Fisher-Yates Shuffle**: Implemented a more efficient and truly random shuffling algorithm for player elimination in the `perang_sarung` game.

### Changed

- **Bot Admin Detection**: Significantly improved the reliability of admin status detection in the `listgroup` command using JID normalization (`decodeJid`).
- **Group Info Optimization**: Refactored group metadata processing to use a single-pass lookup, improving performance for bots joined in many groups.
- **Message Forwarding Standard**: Standardized the `togc` (Target Group) command to use the core `.forward()` method, ensuring better compatibility with Baileys message structures.

### Fixed

- **Syntax Error in Game**: Resolved an "Unexpected token ':'" error in `perang_sarung.js` caused by a misplaced spread operator that prevented the game from loading.
- **Togc Null Pointer Exception**: Fixed a critical `TypeError` where `m.quoted` could become `null` during asynchronous broadcasting operations by capturing state in local variables.
- **Forwarding Method Error**: Fixed `TypeError: conn.copyNForward is not a function` by migrating to the supported `.forward()` and `sendMessage({ forward: ... })` APIs.
- **Fallback Logic**: Improved error handling in group broadcasts to successfully fallback to plain text if media forwarding fails.

### Security

- **Null Safety**: Added robust validation for message content objects to prevent system crashes during high-volume group messaging.

## [2.6.7] - 2026-03-15

### Added

- Initial release of the FRIEREN-MD script.
- Interactive AI features and game plugins.
- Multi-file authentication state support.

---

_Note: Version 2.6.8 contains critical stability fixes for owner tools and game systems._
