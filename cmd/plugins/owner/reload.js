/**
 * @module plugins/owner/reload
 * @author Naruya Izumi (Modified for FrierenBot)
 */

let handler = async (m, { conn }) => {
    try {
        await conn.sendMessage(m.chat, { react: { text: '🔄', key: m.key } })
        
        if (global.reloadPlugins) {
            await global.reloadPlugins();
            m.reply("✅ *Plugins & Handlers Reloaded!*");
        } else {
            m.reply("❌ Fungsi reload tidak ditemukan di global scope.");
        }
    } catch (e) {
        console.error(e);
        m.reply(`❌ Gagal reload: ${e.message}`);
    }
};

handler.help = ["reload"];
handler.tags = ["owner"];
handler.command = ['reload', 'rl', 'refresh'];
handler.owner = true;
handler.prefix = true;

export default handler;
