import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kbbiPath = path.join(__dirname, '../../../system/db/local/kbbi_list.json');

// Helper untuk cek kata baku
const isBaku = (word) => {
    try {
        if (!fs.existsSync(kbbiPath)) return null;
        const list = JSON.parse(fs.readFileSync(kbbiPath));
        return list.includes(word.toLowerCase());
    } catch { return null; }
};

export default function(ev) {
    // --- CEK KATA BAKU ---
    ev.on({
        name: 'cekbaku',
        cmd: ['baku', 'cekbaku', 'kbbi2'],
        tags: 'Tools Menu',
        desc: 'Cek apakah kata termasuk kata baku di KBBI',
        run: async (xp, m, { args }) => {
            const word = args[0];
            if (!word) return m.reply('Masukkan kata yang ingin dicek!\nContoh: .baku aktivitas');

            const check = isBaku(word);
            if (check === null) return m.reply('Database kata baku belum siap.');

            if (check) {
                m.reply(`✅ Kata *"${word}"* adalah kata BAKU sesuai KBBI.`);
            } else {
                m.reply(`❌ Kata *"${word}"* TIDAK ditemukan dalam daftar kata baku KBBI.`);
            }
        }
    });
}
