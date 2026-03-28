/**
 * @module plugins/tools/getlid
 * @author Naruya Izumi (Modified for FrierenBot)
 */

let handler = async (m, { conn, text }) => {
    try {
        await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })

        // 1. Identify Target JID
        const targetJid = m.mentionedJid?.[0] || m.quoted?.sender || (text ? text.replace(/[^0-9]/g, '') + "@s.whatsapp.net" : null);
        if (!targetJid) throw new Error("Reply chat, tag user, atau masukkan nomor target.");

        let lid = null;

        // 2. Try to get LID from Quoted Message (Best source)
        if (m.quoted && m.quoted.vM?.key?.participant?.endsWith('@lid')) {
            lid = m.quoted.vM.key.participant;
        }

        // 3. Try from signalRepository (Baileys internal)
        if (!lid) {
            try {
                const repository = conn.signalRepository || conn.signalStore || conn.store?.signal;
                if (repository?.lidMapping) {
                    const r = await repository.lidMapping.getLIDForPN(targetJid);
                    if (r) lid = r;
                }
            } catch (e) {}
        }

        // 4. Try from Group Metadata
        if (!lid && m.isGroup) {
            try {
                const meta = await conn.groupMetadata(m.chat);
                const participant = meta.participants.find(p => p.id === targetJid || p.lid === targetJid);
                if (participant?.lid) lid = participant.lid;
            } catch (e) {}
        }

        if (!lid) throw new Error("Gagal mendapatkan LID. WhatsApp tidak mengirimkan info LID untuk nomor ini atau target belum masuk ke database bot.");

        // Normalize string
        lid = lid.replace(/@lid$/, "");

        const msg = `🎯 *TARGET LID FOUND*
        
👤 *JID:* ${targetJid.split('@')[0]}
🆔 *LID:* ${lid}

_LID adalah ID unik yang digunakan WhatsApp untuk enkripsi dan privasi di Komunitas._`

        await conn.sendMessage(m.chat, { 
            text: msg,
            contextInfo: {
                externalAdReply: {
                    title: "LID RESOLVER",
                    body: `Target: ${targetJid.split('@')[0]}`,
                    mediaType: 1,
                    thumbnailUrl: await conn.profilePictureUrl(targetJid, 'image').catch(() => 'https://telegra.ph/file/241d7180c0fa827916b44.jpg'),
                    sourceUrl: '',
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

    } catch (e) {
        console.error('GetLid Error:', e.message);
        m.reply(`❌ ${e.message}`);
    }
};

handler.help = ["getlid"];
handler.tags = ["tools"];
handler.command = ['getlid', 'lid'];
handler.prefix = true;

export default handler;
