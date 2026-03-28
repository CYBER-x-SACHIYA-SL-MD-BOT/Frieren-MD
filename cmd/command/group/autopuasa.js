/**
 * @module plugins/group/autopuasa
 * @description Configuration for Autopuasa (Interactive Global Toggle added)
 */

import { gc, saveGc, db } from "../../../system/db/data.js";

const handler = async (m, { conn, text, args, usedPrefix, command, isOwner }) => {
    const groupData = gc().key?.[m.chat];
    if (!groupData) return;

    const isTogc = args.includes('togc');
    const allGroups = gc().key || {};

    // --- TOGC FEATURE (Owner Only) ---
    if (isTogc && isOwner) {
        const state = args[0]?.toLowerCase(); // on/off
        if (!['on', 'off'].includes(state)) return m.reply(`Gunakan: ${usedPrefix + command} on/off togc`);

        const targetIds = Object.keys(allGroups).filter(id => id.endsWith('@g.us'));
        
        // Session for confirmation
        conn.autopuasatogc = conn.autopuasatogc || {}
        const session = conn.autopuasatogc[m.chat]

        if (args.includes('confirm')) {
            if (!session) return m.reply("Sesi kadaluarsa.");
            let success = 0;
            for (let id of session.groups) {
                if (!allGroups[id].autopuasa) allGroups[id].autopuasa = { status: false, city: 'Pontianak' }
                if (session.state === 'on') {
                    allGroups[id].autopuasa.status = true
                    if (!allGroups[id].autopuasa.city) allGroups[id].autopuasa.city = 'Pontianak'
                } else allGroups[id].autopuasa.status = false
                success++;
            }
            await saveGc();
            delete conn.autopuasatogc[m.chat]
            return m.reply(`✅ Berhasil menyetel Autopuasa di ${success} grup.`);
        }

        await m.reply(`⏳ Menyetel Autopuasa menjadi *${state.toUpperCase()}* ke ${targetIds.length} grup...`)
        
        let success = 0;
        for (let id of targetIds) {
            const g = allGroups[id]
            if (g) {
                if (!g.autopuasa) g.autopuasa = { status: false, city: 'Pontianak' }
                if (state === 'on') {
                    g.autopuasa.status = true
                    if (!g.autopuasa.city) g.autopuasa.city = 'Pontianak'
                } else {
                    g.autopuasa.status = false
                }
                success++;
            }
        }
        await saveGc();
        delete conn.autopuasatogc[m.chat]
        return m.reply(`✅ Berhasil menyetel Autopuasa di ${success} grup.`)
    }

    // --- REGULAR MODE ---
    if (!groupData.autopuasa) groupData.autopuasa = { status: false, city: "Pontianak" };

    if (args[0] === "on") {
        groupData.autopuasa.status = true;
        if (!groupData.autopuasa.city && groupData.adzanCity) groupData.autopuasa.city = groupData.adzanCity;
        await saveGc();
        m.reply(`✅ *AUTO PUASA AKTIF*\nBot akan mengirim alarm saat Sahur, Imsak, dan Buka.\nKota: ${groupData.autopuasa.city}`);
    } else if (args[0] === "off") {
        groupData.autopuasa.status = false;
        await saveGc();
        m.reply(`❌ *AUTO PUASA DINONAKTIFKAN*`);
    } else {
        const city = groupData.autopuasa.city || groupData.adzanCity || 'Pontianak';
        let txt = `🕌 *AUTO PUASA SETTINGS*\n\n`;
        txt += `> Status Auto: ${groupData.autopuasa.status ? "✅ AKTIF" : "⛔ MATI"}\n`;
        txt += `> Kota: ${city}\n\n`;
        txt += `Gunakan:\n`;
        txt += `- ${usedPrefix + command} on (Aktifkan)\n`;
        txt += `- ${usedPrefix + command} off (Matikan)\n`;
        txt += `- ${usedPrefix}setkota <nama_kota> (Ganti kota)\n\n`;
        if (isOwner) txt += `_Owner: ${usedPrefix + command} on/off togc_`;
        
        m.reply(txt);
    }
};

export default function(ev) {
    ev.on({
        cmd: ["autopuasa", "cekjadwal", "setkota"],
        tags: 'Group Menu',
        desc: 'Set fitur Auto Puasa (Alarm Sahur & Buka)',
        run: handler
    })
}
