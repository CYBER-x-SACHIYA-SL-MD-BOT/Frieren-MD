import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
const configPath = path.join(dirname, '../../../system/set/config.json')

const updateConfig = (key, value) => {
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    cfg.botSetting[key] = value
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2))
    global[key] = value 
    return value
}

export default function settings(ev) {

    // --- AUTO READ ---
    ev.on({
        name: 'autoread',
        cmd: ['autoread'],
        tags: 'Setbot Menu',
        desc: 'Otomatis membaca pesan (blue tick)',
        owner: !0,
        prefix: !0,
        run: async (xp, m, { args, chat }) => {
            const input = args[0]?.toLowerCase()
            if (!['on', 'off'].includes(input)) {
                return xp.sendMessage(chat.id, { text: `Gunakan: .autoread on/off\nStatus saat ini: ${global.autoread ? 'ON' : 'OFF'}` }, { quoted: m })
            }
            
            const status = input === 'on'
            updateConfig('autoread', status)
            xp.sendMessage(chat.id, { text: `✅ Auto Read berhasil di-${status ? 'aktifkan' : 'matikan'}` }, { quoted: m })
        }
    })

    // --- AUTO TYPING ---
    ev.on({
        name: 'autotyping',
        cmd: ['autotyping'],
        tags: 'Setbot Menu',
        desc: 'Otomatis status mengetik',
        owner: !0,
        prefix: !0,
        run: async (xp, m, { args, chat }) => {
            const input = args[0]?.toLowerCase()
            if (!['on', 'off'].includes(input)) {
                return xp.sendMessage(chat.id, { text: `Gunakan: .autotyping on/off\nStatus saat ini: ${global.autotyping ? 'ON' : 'OFF'}` }, { quoted: m })
            }
            
            const status = input === 'on'
            updateConfig('autotyping', status)
            xp.sendMessage(chat.id, { text: `✅ Auto Typing berhasil di-${status ? 'aktifkan' : 'matikan'}` }, { quoted: m })
        }
    })

    // --- AUTO RECORDING ---
    ev.on({
        name: 'autorecording',
        cmd: ['autorecording', 'autorecord'],
        tags: 'Setbot Menu',
        desc: 'Otomatis status merekam suara',
        owner: !0,
        prefix: !0,
        run: async (xp, m, { args, chat }) => {
            const input = args[0]?.toLowerCase()
            if (!['on', 'off'].includes(input)) {
                return xp.sendMessage(chat.id, { text: `Gunakan: .autorecording on/off\nStatus saat ini: ${global.autorecording ? 'ON' : 'OFF'}` }, { quoted: m })
            }
            
            const status = input === 'on'
            updateConfig('autorecording', status)
            xp.sendMessage(chat.id, { text: `✅ Auto Recording berhasil di-${status ? 'aktifkan' : 'matikan'}` }, { quoted: m })
        }
    })

    // --- ALWAYS ONLINE ---
    ev.on({
        name: 'alwaysonline',
        cmd: ['alwaysonline', 'online'],
        tags: 'Setbot Menu',
        desc: 'Selalu terlihat online',
        owner: !0,
        prefix: !0,
        run: async (xp, m, { args, chat }) => {
            const input = args[0]?.toLowerCase()
            if (!['on', 'off'].includes(input)) {
                return xp.sendMessage(chat.id, { text: `Gunakan: .alwaysonline on/off\nStatus saat ini: ${global.alwaysonline ? 'ON' : 'OFF'}` }, { quoted: m })
            }
            
            const status = input === 'on'
            updateConfig('alwaysonline', status)
            
            if (status) {
                xp.sendPresenceUpdate('available')
            } else {
                xp.sendPresenceUpdate('unavailable')
            }

            xp.sendMessage(chat.id, { text: `✅ Always Online berhasil di-${status ? 'aktifkan' : 'matikan'}` }, { quoted: m })
        }
    })

    // --- GC ONLY (PC LOCK) ---
    ev.on({
        name: 'gconly',
        cmd: ['gconly', 'pclock'],
        tags: 'Setbot Menu',
        desc: 'Bot hanya merespon di Grup (Kunci PC)',
        owner: !0,
        prefix: !0,
        run: async (xp, m, { args, chat }) => {
            const input = args[0]?.toLowerCase()
            if (!['on', 'off'].includes(input)) {
                return xp.sendMessage(chat.id, { text: `Gunakan: .gconly on/off\nStatus saat ini: ${global.gconly ? 'ON' : 'OFF'}` }, { quoted: m })
            }
            
            const status = input === 'on'
            updateConfig('gconly', status)
            xp.sendMessage(chat.id, { text: `✅ GC Only berhasil di-${status ? 'aktifkan' : 'matikan'}. Bot hanya akan merespon di grup.` }, { quoted: m })
        }
    })

    // --- ANTICALL ---
    ev.on({
        name: 'anticall',
        cmd: ['anticall', 'anticallbot'],
        tags: 'Setbot Menu',
        desc: 'Otomatis block/reject panggilan',
        owner: !0,
        prefix: !0,
        run: async (xp, m, { args, chat }) => {
            const input = args[0]?.toLowerCase()
            if (!['on', 'off'].includes(input)) {
                return xp.sendMessage(chat.id, { text: `Gunakan: .anticall on/off\nStatus saat ini: ${global.anticall ? 'ON' : 'OFF'}` }, { quoted: m })
            }
            
            const status = input === 'on'
            updateConfig('anticall', status)
            xp.sendMessage(chat.id, { text: `✅ Anticall berhasil di-${status ? 'aktifkan' : 'matikan'}` }, { quoted: m })
        }
    })

    // --- AUTO READ STATUS ---
    ev.on({
        name: 'autoreadsw',
        cmd: ['autoreadsw', 'autosw'],
        tags: 'Setbot Menu',
        desc: 'Otomatis lihat status orang lain',
        owner: !0,
        prefix: !0,
        run: async (xp, m, { args, chat }) => {
            const input = args[0]?.toLowerCase()
            if (!['on', 'off'].includes(input)) {
                return xp.sendMessage(chat.id, { text: `Gunakan: .autoreadsw on/off\nStatus saat ini: ${global.autoreadsw ? 'ON' : 'OFF'}` }, { quoted: m })
            }
            
            const status = input === 'on'
            updateConfig('autoreadsw', status)
            xp.sendMessage(chat.id, { text: `✅ Auto Read Status berhasil di-${status ? 'aktifkan' : 'matikan'}` }, { quoted: m })
        }
    })

    // --- SET FONT NAME ---
    ev.on({
        name: 'setfont',
        cmd: ['setfont', 'font', 'setbotname'],
        tags: 'Setbot Menu',
        desc: 'Ganti gaya font nama bot',
        owner: !0,
        prefix: !0,
        run: async (xp, m, { args, chat }) => {
            if (!args[0]) {
                return xp.sendMessage(chat.id, { text: `🔤 *PILIH GAYA FONT*\n\n1. 𝐌.𝐀.𝐑.𝐒 (Bold Serif)\n2. 𝙼.𝙰.𝚁.𝚂 (Monospace)\n3. 𝗠.𝗔.𝗥.𝗦 (Sans Bold)\n\nContoh: .setfont 3` }, { quoted: m })
            }

            const selection = args[0]
            let name, fullname, footer

            switch (selection) {
                case '1':
                    name = '𝐌.𝐀.𝐑.𝐒'
                    fullname = '𝐌𝐮𝐥𝐭𝐢-𝐩𝐮𝐫𝐩𝐨𝐬𝐞 𝐀𝐮𝐭𝐨𝐦𝐚𝐭𝐞𝐝 𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞 𝐒𝐲𝐬𝐭𝐞𝐦'
                    footer = '𝐌.𝐀.𝐑.𝐒 • 𝐒𝐲𝐬𝐭𝐞𝐦'
                    break
                case '2':
                    name = '𝙼.𝙰.𝚁.𝚂'
                    fullname = '𝙼𝚞𝚕𝚝𝚒-𝚙𝚞𝚛𝚙𝚘𝚜𝚎 𝙰𝚞𝚝𝚘𝚖𝚊𝚝𝚎𝚍 𝚁𝚎𝚜𝚙𝚘𝚗𝚜𝚎 𝚂𝚢𝚜𝚝𝚎𝚖'
                    footer = '𝙼.𝙰.𝚁.𝚂 • 𝚂𝚢𝚜𝚝𝚎𝚖'
                    break
                case '3':
                    name = '𝗠.𝐀.𝗥.𝗦'
                    fullname = '𝗠𝘂𝗹𝘁𝗶-𝗽𝘂𝗿𝗽𝗼𝘀𝗲 𝗔𝘂𝘁𝗼𝗺𝗮𝘁𝗲𝗱 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗦𝘆𝘀𝘁𝗲𝗺'
                    footer = '𝗠.𝐀.𝗥.𝗦 • 𝗦𝘆𝘀𝘁𝗲𝗺'
                    break
                default:
                    return xp.sendMessage(chat.id, { text: '❌ Pilihan tidak valid. Pilih 1, 2, atau 3.' }, { quoted: m })
            }

            // Update Config & Global
            const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
            cfg.botSetting.botName = name
            cfg.botSetting.botFullName = fullname
            cfg.botSetting.menuSetting.footer = footer
            
            fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2))
            
            global.botName = name
            global.botFullName = fullname
            global.footer = footer

            xp.sendMessage(chat.id, { text: `✅ Nama bot berhasil diubah ke gaya ${selection}:\n\n${name}\n${fullname}` }, { quoted: m })
        }
    })
}