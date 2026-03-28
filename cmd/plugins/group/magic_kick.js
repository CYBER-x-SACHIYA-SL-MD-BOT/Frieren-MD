/**
 * @module plugins/group/magic_kick
 * @description Kick user with Anime Fantasy Magic (Megumin Style)
 */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let handler = async (m, { conn, usedPrefix, command, text }) => {
    let target = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
            ? m.quoted.sender 
            : text 
                ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' 
                : null

    if (!target) return m.reply(`📜 *GRIMOIRE OF KICK*

Siapa yang ingin kamu ledakkan?
Tag atau Reply targetnya!

Contoh: *${usedPrefix + command} @user*`)
    
    if (target === m.sender) return m.reply("❌ Kamu tidak bisa meledakkan dirimu sendiri!")
    
    const botId = conn.user.id.includes(':') ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : conn.user.id
    if (target === botId) return m.reply("❌ Mana kuatkanku menahan sihirku sendiri?")

    // 1. Initial Setup
    await m.react('🔥')
    
    // 2. Anime Fantasy Sequence (Megumin Chanting)
    const steps = [
        "📜 *ANCIENT MAGIC ACTIVATED* 📜",
        "🌑 _Kuro yori kuroku, yami yori kuraki shikkoku ni..._",
        "🩸 _Waga shinku no konkou o nozomikitann..._",
        "⚖️ _Kakusei no toki kitareri..._",
        "🎯 *TARGET LOCK:* @user",
        "💫 *E X P L O S I O N !!*",
    ]

    // Send first message
    let { key } = await conn.sendMessage(m.chat, { text: steps[0] })

    // Edit loop (Animation Effect)
    for (let i = 1; i < steps.length; i++) {
        await delay(1500) // Timing disesuaikan dengan panjang teks
        let txt = steps[i].replace('@user', `@${target.split('@')[0]}`)
        await conn.sendMessage(m.chat, { text: txt, edit: key, mentions: [target] })
    }

    await delay(500)

    // 3. Execution
    try {
        await conn.groupParticipantsUpdate(m.chat, [target], 'remove')
        await conn.sendMessage(m.chat, { 
            text: `💥 *K.O!* \n\nTarget @${target.split('@')[0]} telah hancur menjadi debu! ✨`, 
            mentions: [target] 
        }, { quoted: m })
    } catch (e) {
        console.error(e)
        await conn.sendMessage(m.chat, { text: `🛡️ *BLOCKED!* Target memiliki Magic Resistance (Admin/Owner)!`, edit: key })
    }
}

handler.help = ['sulap @user', 'explosion @user']
handler.tags = ['group']
handler.command = ['sulap', 'magickick', 'explosion']
handler.group = true
handler.admin = true
handler.botAdmin = true
handler.prefix = true

export default handler