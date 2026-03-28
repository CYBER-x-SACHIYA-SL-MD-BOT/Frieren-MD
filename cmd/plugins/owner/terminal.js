/**
 * @module plugins/owner/terminal
 * @author Naruya Izumi (Modified for Node.js)
 */

import { exec } from 'child_process'
import si from 'systeminformation'

const blocked = [
    "rm -rf /", "rm -rf *", "rm --no-preserve-root -rf /",
    "mkfs.ext4", "dd if=", "chmod 777 /", "chown root:root /",
    "mv /", "cp /", "shutdown", "reboot", "poweroff", "halt",
    "kill -9 1", ">(){ :|: & };:",
];


const formatSize = (bytes) => {
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
};

let handler = async (m, { conn, isOwner, text, usedPrefix }) => {
    if (!isOwner) return 

    let cmd = m.text.trim().slice(2).trim();
    if (!cmd) return;

    if (cmd === 'os' || cmd === 'stats' || cmd === 'vps') {
        await conn.sendMessage(m.chat, { react: { text: '🖥️', key: m.key } })
        
        try {
            const mem = await si.mem();
            const cpu = await si.currentLoad();
            const disk = await si.fsSize();
            const osInfo = await si.osInfo();
            const time = await si.time();

            let hud = `╭━━━━「 🖥️ *𝐒𝐘𝐒𝐓𝐄𝐌* 」━━━━
┃
┃ 💻 *𝐎𝐒 𝐈𝐍𝐅𝐎*
┃ ├ Platform: ${osInfo.platform}
┃ ├ Arch: ${osInfo.arch}
┃ └ Distro: ${osInfo.distro}
┃
┃ 🧠 *𝐑𝐄𝐒𝐎𝐔𝐑𝐂𝐄𝐒*
┃ ├ CPU Load: ${cpu.currentLoad.toFixed(2)}%
┃ ├ RAM Used: ${formatSize(mem.active)}
┃ └ RAM Total: ${formatSize(mem.total)}
┃
┃ 🗄️ *𝐒𝐓𝐎𝐑𝐀𝐆𝐄*
┃ ├ Total: ${formatSize(disk[0]?.size || 0)}
┃ └ Used: ${disk[0]?.use.toFixed(2)}%
┃
┃ ⏳ *𝐔𝐏𝐓𝐈𝐌𝐄:* ${Math.floor(time.uptime / 3600)}h ${Math.floor((time.uptime % 3600) / 60)}m
╰━━━━━━━━━━━━━━━━━━━━━━━━`

            return await conn.sendMessage(m.chat, { 
                text: hud,
                contextInfo: {
                    externalAdReply: {
                        title: "SYSTEM MONITOR",
                        body: `Server: ${osInfo.hostname}`,
                        mediaType: 1,
                        thumbnailUrl: 'https://c.termai.cc/i180/ckb.jpg',
                        sourceUrl: '',
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });
        } catch (e) {
            return m.reply(`Error: ${e.message}`);
        }
    }

    // --- STANDARD TERMINAL ---
    if (blocked.some((b) => cmd.startsWith(b))) {
        return m.reply(`❌ Command blocked for security:\n> ${cmd}`);
    }

    exec(cmd, (err, stdout, stderr) => {
        if (err) return m.reply(`❌ *ERROR*\n\n\`\`\`${err.message}\`\`\``);
        
        const output = stdout || stderr || '✅ Done (No Output)';
        const msg = `*𝐓𝐄𝐑𝐌𝐈𝐍𝐀𝐋 𝐎𝐔𝐓𝐏𝐔𝐓*\n\n> \`${cmd}\`\n\n\`\`\`\n${output.trim()}\n\`\`\``;
        
        m.reply(msg);
    });
};

handler.help = ["$ <command>"];
handler.tags = ["owner"];
handler.command = ['$']; 
handler.owner = true;
handler.prefix = false 

export default handler;
