import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
const configPath = path.join(dirname, '../../../system/set/config.json')

export default function(ev) {
    const getConfig = () => {
        try {
            if (fs.existsSync(configPath)) {
                return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            }
        } catch (e) {
            console.error('Error reading config:', e);
        }
        return {};
    }

    ev.on({
        name: 'ptvch',
        cmd: ['ptvch', 'ptvchannel'],
        tags: 'Owner Menu',
        desc: 'Kirim Video Note (PTV) ke Channel',
        owner: true,
        run: async (xp, m, { args, text, usedPrefix, command }) => {
            try {
                // Get Channel ID from Config
                const cfg = getConfig();
                const idChannel = global.idCh;

                if (!idChannel) {
                    return m.reply('❌ ID Channel belum disetting di config.json!');
                }

                // Get Quoted Message
                let q = m.quoted || m;
                let mime = (q.msg || q).mimetype || '';

                if (!/video|image|gif/g.test(mime)) {
                    return m.reply(`⚠️ Kirim/Reply video dengan caption *${usedPrefix + command}*`);
                }

                await m.reply('⏳ Mengirim PTV ke Channel...');

                const media = await q.download();
                
                await xp.sendMessage(
                    idChannel, 
                    {
                        video: media,
                        ptv: true,
                        caption: text || '' // Optional caption if supported by PTV (usually not, but passed anyway)
                    }
                );

                await xp.sendMessage(m.chat, { 
                    text: `✅ Sukses mengirim PTV ke Channel!\nID: ${idChannel}` 
                }, { quoted: m });

            } catch (e) {
                console.error('PTV Channel Error:', e);
                m.reply(`❌ Gagal: ${e.message}`);
            }
        }
    })
}
