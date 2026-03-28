/**
 * @module plugins/owner/setbio
 * @author Naruya Izumi (Modified for FrierenBot)
 */

let handler = async (m, { conn, text, command, usedPrefix }) => {
    if (!text) return m.reply(`Usage: ${usedPrefix + command} <text bio>\nExample: ${usedPrefix + command} Frieren Bot - Online 24/7`);

    try {
        await conn.updateProfileStatus(text);
        m.reply(`✅ Bio bot berhasil diubah menjadi:\n"${text}"`);
    } catch (e) {
        // Fallback for some Baileys versions
        try {
            await conn.query({
                tag: 'iq',
                attrs: {
                    to: '@s.whatsapp.net',
                    type: 'set',
                    xmlns: 'status',
                },
                content: [
                    {
                        tag: 'status',
                        attrs: {},
                        content: Buffer.from(text, 'utf-8'),
                    },
                ],
            })
            m.reply(`✅ Bio bot berhasil diubah (Fallback Method):\n"${text}"`);
        } catch (e2) {
            console.error(e2);
            m.reply(`❌ Gagal mengubah bio: ${e2.message}`);
        }
    }
};

handler.help = ["setbio <text>"];
handler.tags = ["owner"];
handler.command = ['setbio', 'setbiobot'];
handler.owner = true;
handler.prefix = true;

export default handler;
