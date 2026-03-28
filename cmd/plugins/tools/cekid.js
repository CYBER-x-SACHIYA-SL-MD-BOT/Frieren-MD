/**
 * @module plugins/tools/cekid
 * @author Naruya Izumi (Modified for FrierenBot)
 */

let handler = async (m, { conn, text, usedPrefix }) => {
    try {
        if (!text) return m.reply(`Usage: ${usedPrefix}cekid <link grup/channel>`);

        let url;
        try {
            url = new URL(text);
        } catch {
            return m.reply("❌ Link tidak valid.");
        }

        let isGroup = url.hostname === "chat.whatsapp.com";
        let isChannel = url.hostname === "whatsapp.com" && url.pathname.startsWith("/channel/");
        let id;
        let title = "Unknown";
        let type = "Unknown";

        await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });

        if (isGroup) {
            const code = url.pathname.replace(/^\/+/, "");
            const res = await conn.groupGetInviteInfo(code);
            id = res.id;
            title = res.subject || "Unknown Group";
            type = "Group";
        } else if (isChannel) {
            const code = url.pathname.split("/channel/")[1]?.split("/")[0];
            // newsletterMetadata might differ based on Baileys version
            // Try standard method
            try {
                const res = await conn.newsletterMetadata("invite", code);
                id = res.id;
                title = res.name || "Unknown Channel";
                type = "Channel";
            } catch (e) {
                throw new Error("Gagal mengambil info Channel. Fitur mungkin belum didukung di versi ini.");
            }
        } else {
            return m.reply("❌ Link tidak didukung. Masukkan link Grup atau Channel WhatsApp.");
        }

        const msg = `🎯 *TARGET ID FOUND*
        
📌 Tipe: ${type}
🏷️ Nama: ${title}
🆔 ID: ${id}

Gunakan ID ini untuk keperluan broadcast atau database.`;

        await conn.sendMessage(m.chat, { 
            text: msg,
            contextInfo: {
                externalAdReply: {
                    title: "ID EXTRACTOR",
                    body: `ID: ${id}`,
                    mediaType: 1,
                    thumbnailUrl: await conn.profilePictureUrl(id, 'image').catch(() => 'https://telegra.ph/file/241d7180c0fa827916b44.jpg'),
                    sourceUrl: text,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply(`❌ Error: ${e.message}`);
    }
};

handler.help = ["cekid <link>"];
handler.tags = ["tools"];
handler.command = ['cekid', 'id', 'checkid'];
handler.prefix = true;

export default handler;
