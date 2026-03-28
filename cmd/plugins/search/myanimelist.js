/**
 * @module plugins/search/myanimelist
 * @description MyAnimeList Scraper (Top, Search, Upcoming) - HD Image Fix
 */

import axios from "axios";
import * as cheerio from "cheerio";

// Helper to fix image resolution
const formatImage = (url) => {
    if (!url) return '';
    // Remove resize path like /r/50x70/ and query params
    return url.replace(/\/r\/\d+x\d+/, '').split('?')[0];
}

async function malTop() {
    const url = "https://myanimelist.net/topanime.php";
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const results = [];

    $(".ranking-list").each((i, el) => {
        const title = $(el).find(".title h3 a").text().trim();
        const link = $(el).find(".title h3 a").attr("href");
        const score = $(el).find(".score span").text().trim();
        let img = $(el).find("img").attr("data-src") || $(el).find("img").attr("src");
        img = formatImage(img);
        
        if (title) results.push({ title, link, score, img });
    });
    return results;
}

async function malUpcoming() {
    const url = "https://myanimelist.net/topanime.php?type=upcoming";
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const results = [];

    $(".ranking-list").each((i, el) => {
        const title = $(el).find(".title h3 a").text().trim();
        const link = $(el).find(".title h3 a").attr("href");
        let img = $(el).find("img").attr("data-src") || $(el).find("img").attr("src");
        img = formatImage(img);
        
        if (title) results.push({ title, link, img });
    });
    return results;
}

async function malSearch(query) {
    const url = `https://myanimelist.net/anime.php?q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const results = [];

    $(".js-categories-seasonal table tr").slice(1).each((i, el) => {
        const row = $(el);
        const title = row.find(".title strong").text().trim();
        const link = row.find(".title a").attr("href");
        let img = row.find(".picSurround img").attr("data-src") || row.find(".picSurround img").attr("src");
        img = formatImage(img);
        
        const desc = row.find(".pt4").text().replace('read more.', '').trim();
        const type = row.find("td").eq(2).text().trim();
        const eps = row.find("td").eq(3).text().trim();
        const score = row.find("td").eq(4).text().trim();

        if (title) results.push({ title, link, img, desc, type, eps, score });
    });
    return results;
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const type = (args[0] || '').toLowerCase();
    const query = args.slice(1).join(' ');

    if (type === 'top') {
        await m.reply('⏳ Mengambil Top Anime...');
        const res = await malTop();
        if (!res.length) return m.reply('❌ Gagal mengambil data.');
        
        let txt = `🏆 *TOP ANIME MAL* 🏆\n\n`;
        res.slice(0, 10).forEach((a, i) => {
            txt += `${i+1}. *${a.title}*\n⭐ Score: ${a.score}\n🔗 ${a.link}\n\n`;
        });
        
        // Send with first image if available
        if (res[0].img) {
            await conn.sendMessage(m.chat, { image: { url: res[0].img }, caption: txt }, { quoted: m });
        } else {
            m.reply(txt);
        }
    } 
    else if (type === 'upcoming') {
        await m.reply('⏳ Mengambil Upcoming Anime...');
        const res = await malUpcoming();
        if (!res.length) return m.reply('❌ Gagal mengambil data.');
        
        let txt = `📅 *UPCOMING ANIME* 📅\n\n`;
        res.slice(0, 10).forEach((a, i) => {
            txt += `${i+1}. *${a.title}*\n🔗 ${a.link}\n\n`;
        });
        
        if (res[0].img) {
            await conn.sendMessage(m.chat, { image: { url: res[0].img }, caption: txt }, { quoted: m });
        } else {
            m.reply(txt);
        }
    }
    else if (type === 'search' || (args.length > 0 && type !== 'top' && type !== 'upcoming')) {
        const q = type === 'search' ? query : args.join(' ');
        if (!q) return m.reply(`Cari anime apa?\nContoh: ${usedPrefix + command} naruto`);
        
        await m.reply(`🔍 Mencari "${q}"...`);
        const res = await malSearch(q);
        if (!res.length) return m.reply('❌ Anime tidak ditemukan.');

        const anime = res[0];
        const caption = `🎬 *MAL SEARCH* 🎬\n\n` +
            `🏷️ *Title:* ${anime.title}\n` +
            `⭐ *Score:* ${anime.score}\n` +
            `📺 *Type:* ${anime.type} (${anime.eps} eps)\n` +
            `📝 *Desc:* ${anime.desc}\n` +
            `🔗 *Link:* ${anime.link}`;

        await conn.sendMessage(m.chat, { image: { url: anime.img }, caption }, { quoted: m });
    }
    else {
        m.reply(
            `⛩️ *MYANIMELIST MENU* ⛩️\n\n` +
            `• ${usedPrefix}mal top\n` +
            `• ${usedPrefix}mal upcoming\n` +
            `• ${usedPrefix}mal search <judul>`
        );
    }
}

handler.help = ['mal <top/upcoming/search>'];
handler.tags = ['search', 'anime'];
handler.command = ['mal', 'myanimelist'];
handler.prefix = true;

export default handler;