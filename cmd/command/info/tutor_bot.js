/**
 * @module command/main/tutor_bot
 * @description Advanced Framework Documentation & Development Architecture
 */

export default function(ev) {
    ev.on({
        name: 'tutorbuatbot',
        cmd: ['tutorbuatbot', 'tutorialbot', 'tutorbot', 'guidebot', 'docs'],
        tags: 'Main Menu',
        desc: 'Complete technical documentation of the bot architecture',
        run: async (xp, m, { prefix }) => {
            let guide = `*SYSTEM ARCHITECTURE & DEV GUIDE*\n\n`
            
            guide += `Framework ini menggunakan pendekatan *Modular-Plugin* berbasis *ESM (ECMAScript Modules)* untuk efisiensi dan skalabilitas.\n\n`
            
            guide += `*DIRECTORY TREE*\n`
            guide += `📂 root/\n`
            guide += `├── 📄 index.js           # Bootloader & Library Initializer\n`
            guide += `├── 📄 config.js          # Global Environment Variables\n`
            guide += `├── 📁 cmd/               # Logical Layers\n`
            guide += `│   ├── 🧠 handle.js      # Dynamic Plugin Loader &                           Watcher\n`
            guide += `│   └── 📂 plugins/       # Main Feature Repository\n`
            guide += `│       ├── 📂 ai/        # Artificial Intelligence\n`
            guide += `│       ├── 📂 rpg/       # RPG System & Economy\n`
            guide += `│       ├── 📂 download/  # Media Fetchers\n`
            guide += `│       └── 📂 tools/     # Utility Plugins\n`
            guide += `├── 📁 system/            # Engine Core\n`
            guide += `│   ├── 📂 db/            # Data Persistence Layer\n`
            guide += `│   │   ├── 📄 data.js    # Database CRUD Engines\n`
            guide += `│   │   └── 📄 schema.js  # User & Group Object Blueprints\n`
            guide += `│   ├── 📂 lib/           # Proprietary Library Collections\n`
            guide += `│   ├── 🛡️ middleware.js  # Global Access Control (ACL)\n`
            guide += `│   ├── 🛠️ function.js    # Core Utility Functions\n`
            guide += `│   └── 📡 apis.js        # Centralized API Endpoints\n`
            guide += `├── 📁 media/             # Static Assets Repository\n`
            guide += `└── 📁 temp/              # Volatile Cache Directory\n\n`
            
            guide += `*PLUGIN DEVELOPMENT*\n`
            guide += `Standard Template (cmd/plugins/...):\n`
            guide += `\`\`\`javascript\n`
            guide += `let handler = async (m, { conn, text, usedPrefix, command }) => {\n`
            guide += `  // Logic starts here\n`
            guide += `  if (!text) throw "Gunakan: " + usedPrefix + command + " <input>"\n`
            guide += `  m.reply("Response Data: " + text)\n`
            guide += `}\n\n`
            guide += `handler.command = ["cmd"]\n`
            guide += `handler.help = ["cmd <input>"]\n`
            guide += `handler.tags = ["category"]\n\n`
            guide += `// Access Control List (ACL)\n`
            guide += `handler.owner = false    // Khusus Owner\n`
            guide += `handler.group = false    // Khusus Grup\n`
            guide += `handler.admin = false    // Khusus Admin Grup\n`
            guide += `handler.limit = false    // Mengonsumsi Limit\n`
            guide += `handler.premium = false  // Khusus User Premium\n\n`
            guide += `export default handler\n`
            guide += `\`\`\`\n\n`

            // --- SECTION BARU: HANDLING MEDIA ---
            guide += `*HANDLING MEDIA (Baileys)*\n`
            guide += `Cara mengirim file media dalam plugin:\n`
            guide += `\`\`\`javascript\n`
            guide += `// 1. Mengirim Gambar dari URL\n`
            guide += `await conn.sendMessage(m.chat, { \n`
            guide += `  image: { url: "https://url.com/gambar.jpg" }, \n`
            guide += `  caption: "Ini Caption"\n`
            guide += `}, { quoted: m })\n\n`
            guide += `// 2. Mengirim Video/Dokumen dari Buffer\n`
            guide += `await conn.sendMessage(m.chat, { \n`
            guide += `  video: bufferData, \n`
            guide += `  gifPlayback: true // Kirim sebagai GIF\n`
            guide += `}, { quoted: m })\n`
            guide += `\`\`\`\n\n`

            // --- SECTION BARU: EXTERNAL API ---
            guide += `*FETCHING EXTERNAL APIS*\n`
            guide += `Gunakan library 'axios' (disarankan) atau 'node-fetch':\n`
            guide += `\`\`\`javascript\n`
            guide += `import axios from 'axios'\n\n`
            guide += `// Di dalam handler:\n`
            guide += `try {\n`
            guide += `  let { data } = await axios.get("https://api.example.com/json")\n`
            guide += `  m.reply(data.result)\n`
            guide += `} catch (e) {\n`
            guide += `  throw "Maaf, server error."\n`
            guide += `}\n`
            guide += `\`\`\`\n\n`
            
            guide += `*STATE MANAGEMENT*\n`
            guide += `Untuk interaksi dengan database sistem:\n`
            guide += `1. \`import { db, saveDb } from "#system/db/data.js"\`\n`
            guide += `2. \`import { Inventory } from "#system/inventory.js"\`\n\n`
            guide += `Modifikasi Data RPG:\n`
            guide += `\`Inventory.modify(m.sender, "tokens", 10)\`\n\n`
            guide += `Akses Database Manual:\n`
            guide += `\`const user = db().key[id]\`\n`
            guide += `\`user.money += 67000; saveDb()\`\n\n`
            
            guide += `*CORE LOGIC FLOW*\n`
            guide += `1. *index.js* menerima event pesan baru.\n`
            guide += `2. *middleware.js* melakukan filter izin (ACL).\n`
            guide += `3. *handle.js* mencari plugin yang cocok.\n`
            guide += `4. Plugin dieksekusi dengan *Hot-Reload* support.\n\n`

            // --- SECTION BARU: TIPS ---
            guide += `*ADVANCED TIPS*\n`
            guide += `• *Delay/Sleep:* Gunakan \`await new Promise(r => setTimeout(r, 2000))\` untuk jeda.\n`
            guide += `• *React:* Gunakan \`await m.react('👍')\` untuk memberi reaksi pada pesan.\n`
            guide += `• *Parsed Args:* Gunakan \`let [text1, text2] = text.split('|')\` untuk memisah input user.\n\n`
            
            guide += `*DEVELOPER BEST PRACTICES*\n`
            guide += `• Gunakan Path Alias (#) untuk semua import internal.\n`
            guide += `• Pisahkan logika API yang kompleks ke folder \`system/lib/\`.\n`
            guide += `• Gunakan \`try-catch\` untuk mencegah bot crash.\n\n`
            
            guide += `_Documentation - Guide for Developers_`

            await m.reply(guide)
        }
    })
}