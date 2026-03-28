import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..'); 

// --- HELPER FUNCTION ---
// Mencari file secara rekursif dalam direktori
function findFileRecursively(dir, filenameToFind) {
    let results = [];
    let list = [];
    try {
        list = fs.readdirSync(dir);
    } catch (e) {
        return [];
    }
    
    for (const file of list) {
        if (file === 'node_modules' || file === '.git' || file === 'session') continue; // Skip heavy folders
        
        const filePath = path.join(dir, file);
        let stat;
        try { stat = fs.statSync(filePath); } catch { continue; }
        
        if (stat && stat.isDirectory()) {
            results = results.concat(findFileRecursively(filePath, filenameToFind));
        } else {
            // Cek match nama file (dengan atau tanpa ekstensi input)
            if (file === filenameToFind || (filenameToFind + '.js' === file)) {
                results.push(filePath);
            }
        }
    }
    return results;
}

export default function(ev) {
    ev.on({
        name: 'getcode',
        cmd: ['getcode', 'code', 'getfile', 'gp'],
        tags: 'Owner Menu',
        desc: 'Melihat kode sumber command (Auto Search)',
        owner: true,
        run: async (xp, m, { args, usedPrefix, command }) => {
            if (!args[0]) return m.reply(`❌ Masukkan nama file.\n*Contoh:* ${usedPrefix + command} menu`)

            const inputName = args.join(' ').trim();
            
            // 1. CEK PATH LANGSUNG (Jika user memasukkan path lengkap)
            let targetPath = path.resolve(projectRoot, inputName);
            if (!fs.existsSync(targetPath) && !inputName.endsWith('.js')) targetPath += '.js';
            
            // Path Traversal Check
            if (!targetPath.startsWith(projectRoot)) {
                return m.reply('❌ Akses ditolak: Path di luar project root.')
            }
            
            if (fs.existsSync(targetPath) && fs.lstatSync(targetPath).isFile()) {
                return sendFileContent(xp, m, targetPath);
            }

            // 2. AUTO SEARCH (Jika user cuma input nama file)
            m.reply('🔍 Mencari file...')
            const searchDirs = [
                path.join(projectRoot, 'cmd'),
                path.join(projectRoot, 'system')
            ];

            let matches = [];
            for (const dir of searchDirs) {
                if (fs.existsSync(dir)) {
                    matches = matches.concat(findFileRecursively(dir, inputName));
                }
            }
            
            // Cek juga di root (untuk file seperti index.js, package.json)
            const rootFiles = fs.readdirSync(projectRoot).filter(f => f === inputName || f === inputName + '.js');
            rootFiles.forEach(f => matches.push(path.join(projectRoot, f)));

            // Remove duplicates
            matches = [...new Set(matches)];

            // --- HASIL PENCARIAN ---
            if (matches.length === 0) {
                return m.reply(`❌ File *${inputName}* tidak ditemukan di folder cmd, system, atau root.`)
            }

            if (matches.length === 1) {
                return sendFileContent(xp, m, matches[0]);
            }

            // Jika ketemu banyak (Ambigu)
            let txt = `⚠️ *Ditemukan ${matches.length} file dengan nama mirip:*

`;
            matches.forEach((p, i) => {
                const relative = path.relative(projectRoot, p);
                txt += `${i + 1}. ${relative}\n`;
            });
            txt += `
Silakan spesifikasikan path-nya.`;
            return m.reply(txt);
        }
    })
}

async function sendFileContent(xp, m, filePath) {
    try {
        const relativeName = path.relative(process.cwd(), filePath);
        const code = fs.readFileSync(filePath, 'utf-8');
        
        await m.reply(`📄 *FILE FOUND*\nPath: ${relativeName}\n\n` + "```javascript\n" + code + "\n```");
    } catch (e) {
        console.error('Error reading file:', e);
        m.reply('❌ Gagal membaca file: ' + e.message);
    }
}
