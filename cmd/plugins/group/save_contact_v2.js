/**
 * @module plugins/group/save_contact_v2
 * @description Save Group Contacts to VCF (Owner/Mod Only)
 */

import fs from 'fs/promises'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

let handler = async (m, { conn, args, command }) => {
  const idgroup = args[0]
  if (!idgroup || !idgroup.endsWith('@g.us')) {
    return m.reply('❌ Mohon berikan ID grup dengan format yang benar (akhiran @g.us).')
  }

  await m.reply('⏳ Mengambil metadata grup...')

  try {
      const chatID = idgroup
      const groupInfo = await conn.groupMetadata(chatID)
      const participants = groupInfo.participants
      const groupName = groupInfo.subject

      let vcard = ''
      let noPort = 0
      
      for (let participant of participants) {
        // Filter: Hanya nomor valid (skip bot/lid jika ada)
        if (participant.id && participant.id.includes('@s.whatsapp.net')) {
          const number = participant.id.split("@")[0]
          // Format Name: [Index] +Number (e.g., [1] +62812...)
          vcard += `BEGIN:VCARD
VERSION:3.0
FN:[${++noPort}] +${number}
TEL;type=CELL;type=VOICE;waid=${number}:+${number}
END:VCARD
`
        }
      }

      if (noPort === 0) {
        return m.reply('❌ Tidak ada kontak yang dapat disimpan.')
      }

      const fileName = `./temp/contacts_${Date.now()}.vcf`
      
      // Ensure temp dir exists
      try { await fs.mkdir('./temp') } catch {}

      await fs.writeFile(fileName, vcard.trim())

      m.reply(`✅ Berhasil mengambil *${noPort}* kontak.
Mengirim file...`)
      await sleep(2000)
      
      await conn.sendMessage(m.chat, {
        document: await fs.readFile(fileName),
        mimetype: 'text/vcard',
        fileName: `${groupName}.vcf`,
        caption: `📂 *GROUP:* ${groupName}
👥 *MEMBER:* ${noPort}`
      }, { quoted: m })
      
      await fs.unlink(fileName)

  } catch (e) {
      console.error(e)
      m.reply('❌ Gagal mengambil kontak grup. Pastikan ID benar dan Bot sudah bergabung di grup tersebut.')
  }
}

handler.help = ['svkontakv2 <idgroup>']
handler.tags = ['owner', 'group']
handler.command = ['svkontakv2']
handler.owner = true
handler.prefix = true

export default handler