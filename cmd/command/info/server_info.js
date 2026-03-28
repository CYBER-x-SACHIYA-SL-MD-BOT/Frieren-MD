import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { performance } from "perf_hooks";

const execAsync = promisify(exec);

// ==================== 🛠️ UTILITY FUNCTIONS ====================

const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const formatDuration = (seconds) => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
};

// ==================== 🔍 SYSTEM DATA GATHERING (ROBUST) ====================

const getOSRelease = async () => {
    try {
        if (os.platform() === 'win32') return os.version();
        // Cek Android via getprop
        try {
            const { stdout: androidVer } = await execAsync('getprop ro.build.version.release');
            if (androidVer.trim()) return `Android ${androidVer.trim()}`;
        } catch {}
        // Cek Linux Distro
        try {
            const { stdout } = await execAsync('cat /etc/os-release | grep PRETTY_NAME');
            return stdout.split('=')[1]?.replace(/"/g, '').trim() || os.type();
        } catch { return os.type() + ' ' + os.release(); }
    } catch {
        return 'Unknown OS';
    }
};

/** Ambil Info CPU Mendalam */
const getCPUDetails = async () => {
    const cpus = os.cpus();
    let model = cpus[0].model.trim();
    // Shorten CPU name for Canvas
    model = model.replace('Intel(R) Core(TM) ', '').replace('CPU @ ', '').replace('GHz', '').trim();
    // For Android/ARM often just 'ARMv8' or similar generic from os.cpus
    
    try {
        const { stdout } = await execAsync('lscpu');
        const lines = stdout.split('\n');
        const modelLine = lines.find(l => l.includes('Model name:'));
        if (modelLine) model = modelLine.split(':')[1].trim();
    } catch {}

    // Extreme shorten
    if (model.length > 15) model = model.substring(0, 15) + '..';
    
    return model;
};

/** Ambil Info Disk (Filter Improved for Android/Termux) */
const getDiskDetails = async () => {
    try {
        if (os.platform() === 'win32') return null;
        const { stdout } = await execAsync('df -h --output=source,size,used,avail,pcent,target');
        const lines = stdout.trim().split('\n').slice(1);
        return lines.filter(line => {
            const raw = line.trim();
            return (raw.endsWith(' /') || raw.includes('/data') || raw.includes('/storage')) && 
                   !raw.includes('tmpfs') && !raw.includes('udev');
        }).map(line => {
            const parts = line.trim().split(/\s+/).filter(Boolean);
            if (parts.length < 6) return null;
            return {
                mount: parts.slice(5).join(' '),
                used: parts[2],
                total: parts[1],
                raw_percent: parts[4]
            };
        }).filter(d => d);
    } catch { return null; }
};

export default function(ev) {
    ev.on({
        name: 'serverinfo',
        cmd: ['os', 'system', 'info', 'cpu', 'server'],
        tags: 'information Menu',
        desc: 'Displays detailed system and server status information (Visual)',
        run: async (conn, m, { chat }) => {
            const timestamp = performance.now();

            try {
                // Eksekusi semua task secara paralel
                const results = await Promise.allSettled([
                    getOSRelease(),
                    getCPUDetails(),
                    getDiskDetails()
                ]);

                const unwrap = (index, fallback) =>
                    results[index].status === 'fulfilled' ? results[index].value : fallback;

                const osName = unwrap(0, os.type());
                const cpuModel = unwrap(1, 'Unknown CPU');
                const disks = unwrap(2, []);

                // Hitung Uptime & Latency (Real Network/Processing Latency)
                const msgTimestamp = m.messageTimestamp ? (typeof m.messageTimestamp === 'number' ? m.messageTimestamp : m.messageTimestamp.low || m.messageTimestamp) * 1000 : Date.now();
                const latensi = Date.now() - msgTimestamp;
                const finalPing = (latensi > 0 ? latensi : Math.abs(latensi)).toFixed(2);
                
                const uptime = formatDuration(os.uptime());
                
                // RAM %
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                const ramPercent = ((usedMem / totalMem) * 100).toFixed(0) + '%';

                const stats = {
                    platform: os.platform(),
                    ping: finalPing,
                    ram: ramPercent,
                    cpuShort: cpuModel,
                    uptime: uptime,
                    os: osName,
                    node: process.version,
                    cores: os.cpus().length,
                    totalMem: formatSize(totalMem)
                };

                let detailedTxt = `🖥️ *SYSTEM DETAIL OVERVIEW*
━━━━━━━━━━━━━━━━━━
💻 *OS:* ${osName}
🏗️ *Kernel:* ${os.release()}
⚡ *NodeJS:* ${process.version}
⚙️ *Arch:* ${os.arch()}

🧠 *CPU INFO*
🦾 *Model:* ${cpuModel}
📊 *Cores:* ${os.cpus().length}
🏎️ *Speed:* ${os.cpus()[0]?.speed} MHz

💾 *MEMORY*
📦 *RAM:* ${formatSize(totalMem - freeMem)} / ${formatSize(totalMem)} (${ramPercent})

💿 *STORAGE*`;

                if (disks && disks.length > 0) {
                    disks.forEach(d => {
                        detailedTxt += `\n📂 *${d.mount}*: ${d.used} / ${d.total} (${d.raw_percent})`;
                    });
                } else {
                    detailedTxt += `\n⚠️ Main Disk Not Detected`;
                }

                detailedTxt += `\n\n⏱️ *Uptime:* ${uptime}`;

                await conn.sendMessage(m.chat, { text: detailedTxt }, { quoted: m });

            } catch (e) {
                console.error(e);
                m.reply('Gagal render system info.');
            }
        }
    })
}