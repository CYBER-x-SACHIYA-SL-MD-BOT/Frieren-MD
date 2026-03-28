/**
 * @module plugins/owner/deletefile
 * @author Naruya Izumi (Modified for Node.js)
 */

import fs from 'fs'
import path from 'path'

let handler = async (m, { args, usedPrefix, command }) => {
    if (!args.length) {
        return m.reply(`Usage: ${usedPrefix + command} <file path>\nExample: ${usedPrefix + command} cmd/plugins/test.js`);
    }

    let t = path.join(...args);
    // Auto add .js if missing and no extension provided
    if (!path.extname(t)) t += ".js";
    
    const fp = path.resolve(process.cwd(), t);

    if (!fp.startsWith(process.cwd())) {
        return m.reply("❌ Akses ditolak: Tidak bisa menghapus file di luar folder bot.");
    }

    const coreFiles = ['index.js', 'package.json', 'config.json', 'handle.js'];
    if (coreFiles.some(f => fp.endsWith(f))) {
        return m.reply("❌ Akses ditolak: File inti sistem tidak boleh dihapus.");
    }

    try {
        if (!fs.existsSync(fp)) {
            return m.reply(`❌ File tidak ditemukan: ${t}`);
        }

        fs.unlinkSync(fp);
        m.reply(`✅ File berhasil dihapus:\n${t}`);
    } catch (e) {
        m.reply(`❌ Gagal menghapus file: ${e.message}`);
    }
};

handler.help = ["deletefile <path>"];
handler.tags = ["owner"];
handler.command = ['df', 'deletefile', 'delfile'];
handler.owner = true; 
handler.prefix = true;

export default handler;
