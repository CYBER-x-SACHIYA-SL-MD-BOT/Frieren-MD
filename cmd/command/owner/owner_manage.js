import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { db, saveDb } from '#system/db/data.js'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
const config = path.join(dirname, '../../../system/set/config.json')

export default function ownerManage(ev) {
  ev.on({
    name: 'addowner',
    cmd: ['addowner'],
    tags: 'Owner Menu',
    desc: 'menambahkan owner',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { args, chat, isCreator }) => {
      try {
        if (!isCreator) return xp.sendMessage(chat.id, { text: '❌ Fitur khusus Creator (Owner Utama)' }, { quoted: m })

        const quoted = m.message?.extendedTextMessage?.contextInfo
        const target = args[0]
                ? await global.number(args[0])
                : (quoted?.mentionedJid?.[0] || quoted?.participant)?.replace(/@s\.whatsapp\.net$/, '')

        if (!target) return xp.sendMessage(chat.id, { text: 'reply/tag/masukan nomor nya' }, { quoted: m })

        const cfg = JSON.parse(fs.readFileSync(config, 'utf-8'))

        if (cfg.ownerSetting?.ownerNumber.includes(target)) {
          return xp.sendMessage(chat.id, { text: 'nomor sudah ada' }, { quoted: m })
        }

        cfg.ownerSetting.ownerNumber.push(target)
        fs.writeFileSync(config, JSON.stringify(cfg, null, 2), 'utf-8')
        
        // Update global variable immediately
        global.ownerNumber.push(target)
        
        xp.sendMessage(chat.id, { text: `${target} berhasil ditambahkan` }, { quoted: m })
      } catch (e) {
        console.error('error pada addowner', e)
      }
    }
  })

  ev.on({
    name: 'delowner',
    cmd: ['delowner', 'removeowner'],
    tags: 'Owner Menu',
    desc: 'Menghapus akses owner',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { args, chat, isCreator }) => {
      try {
        if (!isCreator) return xp.sendMessage(chat.id, { text: '❌ Fitur khusus Creator (Owner Utama)' }, { quoted: m })

        const target = args[0] 
            ? await global.number(args[0]) 
            : m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]?.replace('@s.whatsapp.net', '')

        if (!target) return xp.sendMessage(chat.id, { text: 'Tag atau masukkan nomor owner yang akan dihapus' }, { quoted: m })

        const cfg = JSON.parse(fs.readFileSync(config, 'utf-8'))
        
        if (!cfg.ownerSetting.ownerNumber.includes(target)) {
            return xp.sendMessage(chat.id, { text: 'Nomor tersebut bukan owner' }, { quoted: m })
        }

        cfg.ownerSetting.ownerNumber = cfg.ownerSetting.ownerNumber.filter(n => n !== target)
        fs.writeFileSync(config, JSON.stringify(cfg, null, 2))
        
        // Update global variable immediately
        global.ownerNumber = global.ownerNumber.filter(n => n !== target)
        
        xp.sendMessage(chat.id, { text: `✅ ${target} telah dihapus dari daftar owner` }, { quoted: m })
      } catch (e) {
        console.error('error pada delowner', e)
      }
    }
  })

  ev.on({
    name: 'listowner',
    cmd: ['listowner', 'ownerlist', 'owners'],
    tags: 'Owner Menu',
    desc: 'Melihat daftar owner bot',
    run: async (xp, m, { chat }) => {
        try {
            const cfg = JSON.parse(fs.readFileSync(config, 'utf-8'))
            const owners = cfg.ownerSetting.ownerNumber
            
            if (!owners.length) return m.reply('Tidak ada owner terdaftar.')

            let text = '👑 *DAFTAR OWNER* 👑\n\n'
            let mentions = []
            
            owners.forEach((num, i) => {
                const jid = num.includes('@') ? num : num + '@s.whatsapp.net'
                text += `${i+1}. @${jid.split('@')[0]}\n`
                mentions.push(jid)
            })
            
            await xp.sendMessage(chat.id, { text, mentions }, { quoted: m })
        } catch (e) {
            console.error('error pada listowner', e)
        }
    }
  })

  ev.on({
    name: 'mode',
    cmd: ['mode', 'setmode'],
    tags: 'Owner Menu',
    desc: 'Setting mode bot (Group/Private/All)',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { args, chat }) => {
      try {
        const arg = args[0]?.toLowerCase()
        const cfg = JSON.parse(fs.readFileSync(config, 'utf-8'))
        
        if (!['group', 'private', 'pc', 'all'].includes(arg)) {
            const current = global.gconly ? 'Group Only' : (global.pconly ? 'Private Chat Only' : 'All (Public)')
            return xp.sendMessage(chat.id, { text: `⚠️ *MODE SETTING*\n\nSaat ini: ${current}\n\nGunakan:\n• .mode group (Hanya respon di grup)\n• .mode pc (Hanya respon di PC)\n• .mode all (Respon di grup & PC)` }, { quoted: m })
        }

        let status = ''
        
        if (arg === 'group') {
            cfg.botSetting.gconly = true
            cfg.botSetting.pconly = false
            global.gconly = true
            global.pconly = false
            status = 'GROUP ONLY'
        } else if (arg === 'private' || arg === 'pc') {
            cfg.botSetting.gconly = false
            cfg.botSetting.pconly = true
            global.gconly = false
            global.pconly = true
            status = 'PRIVATE ONLY'
        } else {
            cfg.botSetting.gconly = false
            cfg.botSetting.pconly = false
            global.gconly = false
            global.pconly = false
            status = 'ALL (GROUP & PC)'
        }
        
        // Cleanup old variable
        delete cfg.botSetting.isGroup

        fs.writeFileSync(config, JSON.stringify(cfg, null, 2))
        
        xp.sendMessage(chat.id, { text: `✅ Mode berhasil diganti ke: *${status}*` }, { quoted: m })
      } catch (e) {
        console.error('error pada mode', e)
      }
    }
  })

  ev.on({
    name: 'public',
    cmd: ['public'],
    tags: 'Owner Menu',
    desc: 'pengaturan bot mode',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { args, chat }) => {
      try {
        const arg = args[0]?.toLowerCase()
        const cfg = JSON.parse(fs.readFileSync(config, 'utf-8'))
        const input = arg === 'on'

        if (!['on', 'off'].includes(arg)) {
          return xp.sendMessage(chat.id, {
            text: `gunakan: .public on/off\n\nstatus: ${global.public}`
          }, { quoted: m })
        }

        cfg.ownerSetting.public = input
        fs.writeFileSync(config, JSON.stringify(cfg, null, 2))
        global.public = input

        xp.sendMessage(chat.id, {
          text: `public ${input ? 'diaktifkan' : 'dimatikan'}`
        }, { quoted: m })
      } catch (e) {
        console.error('error pada public', e)
      }
    }
  })

  ev.on({
    name: 'adddb',
    cmd: ['adddb', 'addcontact'],
    tags: 'Owner Menu',
    desc: 'Menambahkan nomor kontak ke database secara manual',
    owner: true,
    run: async (xp, m, { args, chat }) => {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo
            let target = args[0]
                ? args[0].replace(/[^0-9]/g, '')
                : (quoted?.mentionedJid?.[0] || quoted?.participant)?.replace(/@s\.whatsapp\.net$/, '')

            if (!target) return m.reply('❌ Masukkan nomor, tag, atau reply pesan orangnya.\nContoh: .adddb 6281234567890')
            
            if (target.startsWith('08')) target = '62' + target.slice(1)
            const senderJid = target + '@s.whatsapp.net'

            const e = Object.values(db().key || {}).some(u => u.jid === senderJid)
            if (e) return xp.sendMessage(chat.id, { text: `⚠️ Nomor @${target} sudah ada di dalam database!`, mentions: [senderJid] }, { quoted: m })

            // Generate unique key
            let pushName = target
            let k = pushName, i = 1
            while (db().key[k]) k = `${pushName}_${i++}`

            // Insert new user
            db().key[k] = {
                jid: senderJid,
                noId: target.slice(-5),
                ban: false,
                registered: false,
                cmd: 0,
                limit: 20,
                money: 200000,
                tokens: 0,
                gold: 0,
                invest: { active: false, amount: 0, dueDate: 0 },
                crypto: { btc: 0, eth: 0, usdt: 0 },
                level: 1,
                exp: 0,
                health: 100,
                max_health: 100,
                strength: 10,
                defense: 10,
                stamina: 100,
                max_stamina: 100,
                inventory: { potion: 0 },
                rpg_assets: { sword: 0, armor: 0, pickaxe: 0, axe: 0, fishing_rod: 0 },
                lastAdventure: 0,
                lastHunt: 0,
                lastMine: 0,
                lastChop: 0,
                jailExpired: 0,
                ai: { jarvis: false, chat: 0, role: 'Gak Kenal' }
            }

            await saveDb()
            xp.sendMessage(chat.id, { text: `✅ Berhasil menambahkan @${target} ke database!\nSekarang nomor tersebut bisa melihat status bot.`, mentions: [senderJid] }, { quoted: m })
        } catch (error) {
            console.error('error pada adddb', error)
            m.reply('❌ Gagal menambahkan nomor ke database.')
        }
    }
  })

  ev.on({
    name: 'maintenance',
    cmd: ['maintenance', 'mt', 'mtmode'],
    tags: 'Owner Menu',
    desc: 'Toggle maintenance mode',
    owner: true,
    run: async (xp, m, { args }) => {
        const arg = args[0]?.toLowerCase()
        if (!['on', 'off'].includes(arg)) return m.reply(`Status: ${global.maintenance}\nGunakan: .mt on/off`)
        
        const isMt = arg === 'on'
        global.maintenance = isMt
        
        // Save to config
        const cfg = JSON.parse(fs.readFileSync(config, 'utf-8'))
        cfg.botSetting.maintenance = isMt
        fs.writeFileSync(config, JSON.stringify(cfg, null, 2))
        
        m.reply(`🚧 Maintenance Mode: *${isMt ? 'ON' : 'OFF'}*`)
    }
  })
}