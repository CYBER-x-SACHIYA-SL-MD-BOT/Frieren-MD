/**
 * @module plugins/group/intro
 * @description Template Intro Member Baru (User Style)
 */

let handler = async (m, { conn }) => {
    // Ambil Foto Profil Grup (jika ada)
    let pp = await conn.profilePictureUrl(m.chat, 'image').catch(_ => null)
    
    // Fallback image jika tidak ada PP
    const thumbUrl = pp || 'https://telegra.ph/file/241d7180c0fa827916b44.jpg'

    const txt = `  𝑰𝑵𝑻𝑹𝑶𝑶 𝑴𝑬𝑴 𝑩𝑨𝑹𝑼
╭─ׅ──ֹ━━━ׅ━⁞ ✶ ⁞━ׅ━━━ֹ──ׅ─╮
╠━ *𝐍𝐚𝐦𝐚*  ︎ ︎: 
╠━ *𝐔𝐦𝐮𝐫* ︎ ︎ ︎: 
╠━ *𝐊𝐞𝐥𝐚𝐬* ︎ ︎ ︎: 
╠━ *𝐂𝐨/𝐂𝐞* ︎ ︎: 
╠━ *𝐀𝐬𝐤𝐨𝐭*  ︎ ︎: 
╠━ *𝐇𝐨𝐛𝐢* ︎ ︎ ︎ ︎ ︎: 
╠━ *𝐒𝐭𝐚𝐭𝐮𝐬* : 
╠━ *𝐀𝐠𝐚𝐦𝐚* : 
╰────────────────╯
∘₊✧──────☆───────✧₊∘
> *_NOTE/CATATAN_*:
> ● *Status = Jomblo/Pacaran*
> ● *Askot = Asal Kota*
> ● *Agama Boleh Di Privat*
> ● *Jangan Lupa Baca Desk Gc*
∘₊✧──────☆───────✧₊∘

╭︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎︎─ ︎ ︎     ︎ ︎──── ︎  ︎ ︎︎ ︎ ︎  ︎─╮
︎ ︎  ︎    𝐒𝐀𝐋𝐊𝐄𝐍 𝐀𝐋𝐋
╰︎─ ︎ ︎ ︎ ︎ ︎  ︎ ︎──── ︎ ︎ ︎  ︎ ︎ ︎ ︎─╯`

    // Kirim pesan dengan AdReply (Thumbnail Besar)
    await conn.sendMessage(m.chat, {
        text: txt,
        contextInfo: {
            externalAdReply: {
                title: "👋 WELCOME NEW MEMBER",
                body: "Silakan Copy & Isi Data Diri",
                thumbnailUrl: thumbUrl,
                sourceUrl: null,
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })
}

handler.help = ['intro']
handler.tags = ['group']
handler.command = ['intro']
handler.prefix = true
handler.group = true

export default handler