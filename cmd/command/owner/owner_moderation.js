import { db, saveDb, getGc, saveGc } from '../../../system/db/data.js'

export default function ownerModeration(ev) {
  ev.on({
    name: 'banchat',
    cmd: ['ban', 'banchat'],
    tags: 'Owner Menu',
    desc: 'banned pengguna',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { args, chat }) => {
      try {
        const ctx = m.message?.extendedTextMessage?.contextInfo || {}
        const nomor = args[0]
                ? args[0].replace(/[^0-9]/g, '')
                : (ctx.mentionedJid?.[0] || ctx.participant)?.replace(/@s.whatsapp.net$/, '')

        if (!nomor) return xp.sendMessage(chat.id, { text: 'reply/tag atau input nomor' }, { quoted: m })

        const found = Object.keys(db().key).some(k => {
          const u = db().key[k]
          if (u.jid.replace(/@s.whatsapp.net$/i, '') === nomor) {
            u.ban = !0
            return !0
          }
          return !1
        })

        if (!found) return xp.sendMessage(chat.id, { text: 'nomor belum terdaftar' }, { quoted: m })

        saveDb()
        xp.sendMessage(chat.id, { text: `${nomor} diban` }, { quoted: m })
      } catch (e) {
        console.error('error pada banchat', e)
        m.reply('Gagal banned user.')
      }
    }
  })

  ev.on({
    name: 'unban',
    cmd: ['unban'],
    tags: 'Owner Menu',
    desc: 'menghapus status ban pada pengguna',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { args, chat }) => {
      try {
        const ctx = m.message?.extendedTextMessage?.contextInfo || {}
        const nomor = args[0]
                ? args[0].replace(/[^0-9]/g, '')
                : (ctx.mentionedJid?.[0] || ctx.participant)?.replace(/@s.whatsapp.net$/, '')

        if (!nomor) return xp.sendMessage(chat.id, { text: 'reply/tag atau input nomor' }, { quoted: m })

        const found = Object.keys(db().key).some(k => {
          const u = db().key[k]
          if (u.jid.replace(/@s.whatsapp.net$/i, '') === nomor) {
            u.ban = !1
            return !0
          }
          return !1
        })

        if (!found) return xp.sendMessage(chat.id, { text: 'nomor belum terdaftar' }, { quoted: m })

        saveDb()
        xp.sendMessage(chat.id, { text: `${nomor} diunban` }, { quoted: m })
      } catch (e) {
        console.error('Error pada unban', e)
        m.reply('Gagal unban user.')
      }
    }
  })

  ev.on({
    name: 'bangrup',
    cmd: ['bangc', 'bangrup'],
    tags: 'Owner Menu',
    desc: 'memblokir grup',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { chat }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'Perintah ini hanya bisa digunakan digrup' }, { quoted: m })
        
        const gc = getGc(chat)
        if (!gc) return xp.sendMessage(chat.id, { text: 'Grup ini belum terdaftar' }, { quoted: m })

        gc.ban = !0
        saveGc()
        xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        console.error('error pada bangrup', e)
        m.reply('Gagal banned grup.')
      }
    }
  })

  ev.on({
    name: 'unbangc',
    cmd: ['unbangc', 'unbangrup'],
    tags: 'Owner Menu',
    desc: 'membuka ban grup',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { chat }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'Perintah ini hanya bisa digunakan digrup' }, { quoted: m })
        
        const gc = getGc(chat)
        if (!gc) return xp.sendMessage(chat.id, { text: 'Grup ini belum terdaftar' }, { quoted: m })

        gc.ban = !1
        saveGc()
        xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })

      } catch (e) {
        console.error('error pada unbangrup', e)
        m.reply('Gagal unban grup.')
      }
    }
  })

  // Helper function for user targeting
  const getTarget = (m, args) => {
      const ctx = m.message?.extendedTextMessage?.contextInfo
      const mentioned = ctx?.mentionedJid?.[0]
      const replied = ctx?.participant
      
      if (mentioned) return mentioned.split('@')[0]
      if (replied) return replied.split('@')[0]
      
      // If args[0] is number
      if (args[0] && !isNaN(args[0]) && args[0].length > 6) return args[0].replace(/[^0-9]/g, '')
      
      return null
  }

  // Generic Resource Manager (Add/Remove)
  const manageResource = async (xp, m, args, type, action) => {
      let isAll = args[0]?.toLowerCase() === 'all'
      let target = isAll ? 'all' : getTarget(m, args)
      
      let amountStr = args.find(a => {
          if (a.toLowerCase() === 'unlimited') return true
          if (isNaN(a) || a.includes('@')) return false
          const val = a.replace(/[^0-9]/g, '')
          if (!isAll && val === target) return false 
          return true
      })
      
      if (!target || !amountStr) return m.reply(`Format salah!\n.${action}${type} <tag/nomor/all> <jumlah/unlimited>\nContoh: .${action}${type} @user 1000\nContoh: .${action}${type} all unlimited`)

      let amount = amountStr.toLowerCase() === 'unlimited' ? 999999 : parseInt(amountStr)
      if (isNaN(amount)) return m.reply('❌ Jumlah harus berupa angka atau "unlimited".')

      const label = type === 'money' ? '💵 Money' : type === 'limit' ? '⚡ Limit' : '✨ XP'
      const actionText = action === 'add' ? 'ditambahkan' : 'dikurangi'
      const valText = amount === 999999 ? 'Unlimited' : amount.toLocaleString('id-ID')

      if (isAll) {
          let count = 0
          for (let k in db().key) {
              if (db().key[k]) {
                  let currentVal = db().key[k][type] || 0
                  if (action === 'add') {
                      db().key[k][type] = currentVal + amount
                  } else if (action === 'rem') {
                      // If removing "unlimited", reset to 0. Otherwise subtract amount.
                      db().key[k][type] = amount === 999999 ? 0 : Math.max(0, currentVal - amount)
                  }
                  count++
              }
          }
          saveDb()
          return m.reply(`✅ Berhasil ${actionText} ${label}: ${valText} ${action === 'add' ? 'ke' : 'dari'} ${count} pengguna (ALL).`)
      }

      let userKey = Object.keys(db().key || {}).find(k => {
          const u = db().key[k]
          return u.jid && u.jid.split('@')[0] === target
      })
      
      if (!userKey) return m.reply('❌ User tidak ditemukan di database.')
      
      // Attempt to extract the original tag text the user typed
      let tagText = args.find(a => a.startsWith('@')) || `@${target}`

      const currentVal = db().key[userKey][type] || 0
      let newVal = currentVal
      
      if (action === 'add') {
          newVal += amount
      } else if (action === 'rem') {
          newVal = amount === 999999 ? 0 : Math.max(0, currentVal - amount)
      }
      
      db().key[userKey][type] = newVal
      saveDb()
      
      const newValText = newVal >= 999999 ? 'Unlimited' : newVal.toLocaleString('id-ID')
      
      xp.sendMessage(m.chat, { 
          text: `✅ Berhasil ${actionText} ${label}: ${valText} ${action === 'add' ? 'ke' : 'dari'} ${tagText}\nSisa: ${newValText}`, 
          mentions: [target + '@s.whatsapp.net'] 
      }, { quoted: m })
  }

  // --- ADD COMMANDS ---
  ev.on({
    name: 'addlimit',
    cmd: ['addlimit'],
    tags: 'Owner Menu',
    desc: 'tambah limit user',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { args }) => manageResource(xp, m, args, 'limit', 'add')
  })

  ev.on({
    name: 'addexp',
    cmd: ['addexp', 'addxp'],
    tags: 'Owner Menu',
    desc: 'tambah xp user',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { args }) => manageResource(xp, m, args, 'exp', 'add')
  })

  // --- REMOVE COMMANDS ---
  ev.on({
    name: 'remmoney',
    cmd: ['remmoney', 'rembalance', 'kuranguang'],
    tags: 'Owner Menu',
    desc: 'kurangi saldo user',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { args }) => manageResource(xp, m, args, 'money', 'rem')
  })

  ev.on({
    name: 'remlimit',
    cmd: ['remlimit', 'kuranglimit', 'removelimit'],
    tags: 'Owner Menu',
    desc: 'kurangi limit user',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { args }) => manageResource(xp, m, args, 'limit', 'rem')
  })

  ev.on({
    name: 'remexp',
    cmd: ['remexp', 'remxp', 'kurangxp'],
    tags: 'Owner Menu',
    desc: 'kurangi xp user',
    owner: !0,
    prefix: !0,
    run: async (xp, m, { args }) => manageResource(xp, m, args, 'exp', 'rem')
  })
}
