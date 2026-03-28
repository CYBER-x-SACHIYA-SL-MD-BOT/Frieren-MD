/**
 * @module plugins/group/pushkontak/savekontak
 * @description Simpan semua kontak grup ke file VCF (vCard) - V2 Optimized
 * @author Har (FRIEREN-MD)
 */

import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const namaKontak = text?.trim()
    if (!namaKontak) {
        return m.reply(
            `📥 *𝐒𝐀𝐕𝐄 𝐊𝐎𝐍𝐓𝐀𝐊 𝐕𝐂𝐅*\n\n` +
            `Fitur ini akan mengekspor seluruh member grup menjadi file kontak (.vcf).\n\n` +
            `*Cara Pakai:* \n` +
            `\`${usedPrefix + command} NamaBase\`\n\n` +
            `*Contoh:* \n` +
            `\`${usedPrefix + command} Member_FRIEREN\``
        )
    }
    
    await conn.sendMessage(m.chat, { react: { text: '📂', key: m.key } })
    
    try {
        const metadata = await conn.groupMetadata(m.chat)
        const participants = metadata.participants
            .map(p => p.id)
            .filter(id => id !== conn.user.id.split(':')[0] + '@s.whatsapp.net') // Exclude Bot
        
        if (participants.length === 0) {
            return m.reply(`❌ *𝐆𝐀𝐆𝐀𝐋*\n\nTidak ada kontak untuk disimpan.`)
        }
        
        // Generate VCard Content (Professional Format)
        const vcardContent = participants.map((contact, index) => {
            const phone = contact.split('@')[0]
            const timestamp = new Date().toLocaleDateString('id-ID')
            return [
                'BEGIN:VCARD',
                'VERSION:3.0',
                `FN:${namaKontak} ${index + 1}`,
                `ORG:FRIEREN-MD Community;`,
                `TEL;type=CELL;type=VOICE;waid=${phone}:+${phone}`,
                `NOTE:Saved from ${metadata.subject} on ${timestamp}`,
                'END:VCARD',
                ''
            ].join('\n')
        }).join('')
        
        // Create Temp File Path
        const tmpDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
        
        const fileName = `${namaKontak.replace(/\s+/g, '_')}_${participants.length}_contacts.vcf`
        const vcfPath = path.join(tmpDir, fileName)
        
        fs.writeFileSync(vcfPath, vcardContent, 'utf8')
        
        // Send to Private Chat (Sender)
        const caption = `✅ *𝐄𝐗𝐏𝐎𝐑𝐓 𝐒𝐔𝐊𝐒𝐄𝐒*

╭┈┈⬡「 📋 *𝐃𝐄𝐓𝐀𝐈𝐋* 」
┃ 🏷️ *Base Name:* ${namaKontak}
┃ 👥 *Total:* ${participants.length} Kontak
┃ 🏢 *Grup:* ${metadata.subject}
┃ 📅 *Tanggal:* ${new Date().toLocaleDateString('id-ID')}
╰┈┈┈┈┈┈┈┈⬡

_File VCF telah dikirim ke chat ini._`

        await conn.sendMessage(m.sender, {
            document: fs.readFileSync(vcfPath),
            fileName: fileName,
            mimetype: 'text/vcard',
            caption: caption
        }, { quoted: m })
        
        // Clean up
        if (fs.existsSync(vcfPath)) fs.unlinkSync(vcfPath)
        
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        
        if (m.chat !== m.sender) {
            await m.reply(`✅ *𝐒𝐔𝐊𝐒𝐄𝐒*\n\nFile VCF (${participants.length} kontak) telah dikirim ke *Private Chat* Anda.`)
        }
        
    } catch (error) {
        console.error('Savekontak Error:', error)
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        m.reply(`❌ *𝐒𝐘𝐒𝐓𝐄𝐌 𝐄𝐑𝐑𝐎𝐑*\n\n${error.message}`)
    }
}

handler.help = ['savekontak <nama>']
handler.tags = ['owner', 'pushkontak']
handler.command = ['savekontak', 'svkontak', 'dumpkontak']
handler.owner = true
handler.group = true

export default handler
