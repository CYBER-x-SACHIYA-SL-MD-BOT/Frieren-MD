import { db, saveDb } from '#system/db/data.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (command === 'isibank' || command === 'addbank') {
        const nominal = parseInt(args[0])
        if (isNaN(nominal) || nominal < 1) return m.reply(`Gunakan: ${usedPrefix}${command} <nominal>`)
        
        const settings = db().settings || {}
        settings.bankBalance = (settings.bankBalance || 0) + nominal
        db().settings = settings
        saveDb()
        m.reply(`Berhasil menambah saldo Bank Pusat sebesar Rp ${nominal.toLocaleString('id-ID')}.`)
    }

    if (command === 'addmoney' || command === 'adduang') {
        const quoted = m.quoted ? m.quoted : (m.mentionedJid?.[0] ? { sender: m.mentionedJid[0] } : null)
        if (!quoted) return m.reply('Tag atau reply orang yang ingin diberi uang!')
        
        const nominal = parseInt(args[1] || args[0])
        if (isNaN(nominal) || nominal < 1) return m.reply(`Gunakan: ${usedPrefix}${command} @tag <nominal>`)
        
        const targetJid = quoted.sender
        const targetKey = Object.keys(db().key || {}).find(k => db().key[k]?.jid === targetJid)
        const target = targetKey ? db().key[targetKey] : null
        
        if (!target) return m.reply('User tidak ditemukan.')
        
        target.money = (target.money || 0) + nominal
        saveDb()
        m.reply(`Berhasil memberikan Rp ${nominal.toLocaleString('id-ID')} kepada @${targetJid.split('@')[0]}`, null, { mentions: [targetJid] })
    }

    if (command === 'delmoney' || command === 'deluang') {
        const quoted = m.quoted ? m.quoted : (m.mentionedJid?.[0] ? { sender: m.mentionedJid[0] } : null)
        if (!quoted) return m.reply('Tag atau reply orang yang ingin dikurangi uangnya!')
        
        const nominal = parseInt(args[1] || args[0])
        if (isNaN(nominal) || nominal < 1) return m.reply(`Gunakan: ${usedPrefix}${command} @tag <nominal>`)
        
        const targetJid = quoted.sender
        const targetKey = Object.keys(db().key || {}).find(k => db().key[k]?.jid === targetJid)
        const target = targetKey ? db().key[targetKey] : null
        
        if (!target) return m.reply('User tidak ditemukan.')
        
        target.money = Math.max(0, (target.money || 0) - nominal)
        saveDb()
        m.reply(`Berhasil menarik Rp ${nominal.toLocaleString('id-ID')} dari @${targetJid.split('@')[0]}`, null, { mentions: [targetJid] })
    }
}

handler.help = ['isibank <nominal>', 'addmoney @tag <nominal>', 'delmoney @tag <nominal>']
handler.tags = ['owner']
handler.command = ['isibank', 'addbank', 'addmoney', 'adduang', 'delmoney', 'deluang']
handler.owner = true
handler.prefix = true

export default handler