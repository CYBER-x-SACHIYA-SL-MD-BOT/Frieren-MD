import { getGc, saveGc, gc } from '#system/db/data.js';
import fetch from 'node-fetch';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const args = text.split(' ');
    const setting = args[0]?.toLowerCase();
    const groupIdentifier = args[1];
    const action = args[2]?.toLowerCase();
    const value = args.slice(3).join(' ');
    const allGroups = Object.values(gc().key || {});

    // Jika tidak ada groupIdentifier, tampilkan daftar grup
    if (!groupIdentifier) {
        if (allGroups.length === 0) return m.reply('Bot tidak terdaftar di grup manapun.');

        let listText = '*DAFTAR GRUP BOT*\n\n';
        listText += `Gunakan nomor grup sebagai target.\nContoh: \`${usedPrefix + command} autosholat 1 on Pontianak\`\n\n`;
        
        allGroups.forEach((group, index) => {
            listText += `${index + 1}. *${group.subject}*\n   - ID: \`${group.id}\`\n`;
        });
        
        return m.reply(listText);
    }
    
    // Tampilkan bantuan jika aksi tidak ada
    if (!setting || !action) {
        let helpText = `*Owner Group Settings*\n\n`;
        helpText += `Gunakan: ${usedPrefix + command} <setting> <group_id/no> <action> [value]\n\n`;
        helpText += `*Contoh:*\n`;
        helpText += `• ${usedPrefix + command} autosholat 1 on Pontianak\n`;
        helpText += `• ${usedPrefix + command} autosholat 123@g.us off\n\n`;
        helpText += `*Setting yang Tersedia:*\n`;
        helpText += `1. \`autosholat\`: Mengatur notifikasi adzan otomatis.`;
        
        return m.reply(helpText);
    }

    // Resolve groupIdentifier ke groupId
    let targetGroupId = null;
    const choice = parseInt(groupIdentifier);

    if (!isNaN(choice) && choice > 0 && choice <= allGroups.length) {
        targetGroupId = allGroups[choice - 1].id;
    } else if (groupIdentifier.endsWith('@g.us')) {
        targetGroupId = groupIdentifier;
    } else {
        return m.reply('ID Grup atau nomor pilihan tidak valid. Ketik `.setgc` untuk melihat daftar grup.');
    }

    const gcData = getGc(targetGroupId);
    if (!gcData) {
        return m.reply('Grup tidak ditemukan di database. Pastikan bot pernah masuk ke grup tersebut.');
    }

    switch (setting) {
        case 'autosholat':
            if (action === 'on') {
                if (!value) return m.reply(`Gunakan: ${usedPrefix + command} autosholat <group_id/no> on <nama_kota>`);

                const kota = value;
                try {
                    // Validasi kota
                    const api = `http://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(kota)}&country=Indonesia&method=20`;
                    const res = await fetch(api).then(r => r.json());
                    
                    if (res.code !== 200 || !res.data) {
                        return m.reply(`Kota "${kota}" tidak valid atau tidak ditemukan.`);
                    }

                    gcData.adzanCity = kota;
                    saveGc();
                    
                    m.reply(`✅ Berhasil mengaktifkan Auto-Sholat untuk grup *${gcData.subject}* dengan kota *${kota}*.`);
                    
                } catch (e) {
                    m.reply('Terjadi error saat validasi kota.');
                    console.error(e);
                }

            } else if (action === 'off') {
                if (!gcData.adzanCity) {
                   return m.reply(`Fitur Auto-Sholat untuk grup *${gcData.subject}* memang sudah tidak aktif.`);
                }
                
                delete gcData.adzanCity;
                saveGc();
                
                m.reply(`✅ Berhasil mematikan Auto-Sholat untuk grup *${gcData.subject}*.`);

            } else {
                m.reply(`Aksi tidak valid untuk 'autosholat'. Gunakan 'on' atau 'off'.`);
            }
            break;

        default:
            m.reply(`Setting "${setting}" tidak ditemukan.`);
            break;
    }
};

handler.help = ['setgc [no|group_id] <setting> <action> [value]'];
handler.tags = ['owner'];
handler.command = ['setgc', 'setgroup', 'groupsetting'];
handler.owner = true;
handler.prefix = true;

export default handler;
