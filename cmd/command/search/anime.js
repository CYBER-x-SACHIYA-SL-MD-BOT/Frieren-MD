import fetch from 'node-fetch'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { sendIAMessage } from '../../../system/function.js'

function processName(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_");
}

async function getUmaData(inputName) {
  const slug = processName(inputName);

  try {
    const url = `https://umamusumedb.com/characters/${slug}/`; 
    
    let html;
    try {
        const res = await axios.get(`https://umamusumedb.com/characters/${slug}_2025/`);
        html = res.data;
    } catch {
        try {
             const res = await axios.get(`https://umamusumedb.com/characters/${slug}/`);
             html = res.data;
        } catch {
             return { status: false, error: "Character not found" };
        }
    }

    const $ = cheerio.load(html);

    let dataJson = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      const txt = $(el).contents().text().trim();
      try {
        const obj = JSON.parse(txt);
        if (obj["@type"] === "VideoGameCharacter") dataJson = obj;
      } catch {}
    });

    if (!dataJson) return { status: false, error: "Data JSON not found" };

    const name = dataJson.name || null;
    const jpName = dataJson.alternateName || null;
    const description = dataJson.description || null;

    const stats = {};
    if (Array.isArray(dataJson.characterAttribute)) {
      dataJson.characterAttribute.forEach(a => stats[a.name] = a.value);
    }

    const image = $("meta[property='og:image']").attr("content") || null;

    const pick = (label) => {
      const el = $("div.text-xs.text-gray-500").filter(function () {
        return $(this).text().trim() === label;
      }).first();
      if (!el.length) return null;
      return el.nextAll("div.font-semibold").first().text().trim().replace(/\s+/g, " ");
    };

    return {
      status: true,
      name,
      jpName,
      description,
      image,
      surface: pick("Surface"),
      bestDistance: pick("Best Distance"),
      strategy: pick("Preferred Strategy"),
      signature: pick("Signature Stat"),
      stats,
      url: url
    };

  } catch (e) {
    return { status: false, error: e.message };
  }
}

export default function anime(ev) {
    // --- ANIME INFO (JIKAN API) ---
    ev.on({
        name: 'animeinfo',
        cmd: ['anime', 'animeinfo'],
        tags: 'Search Menu',
        desc: 'Cari info anime',
        run: async (xp, m, { args, chat }) => {
            if (!args[0]) return m.reply('Anime apa?')
            try {
                const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(args.join(' '))}&limit=1`).then(r => r.json())
                const a = res.data[0]
                if (!a) return m.reply('Gak nemu.')
                
                const txt = `⛩️ *${a.title}*\n⭐ ${a.score}\n📺 ${a.episodes}Eps\n📝 ${a.synopsis?.slice(0, 300)}...`
                await xp.sendMessage(chat.id, { image: { url: a.images.jpg.large_image_url }, caption: txt }, { quoted: m })
            } catch { m.reply('Error.') }
        }
    })

    // --- UMA MUSUME SEARCH ---
    ev.on({
        name: 'uma',
        cmd: ['umamusume', 'uma'],
        tags: 'Search Menu',
        desc: 'Cari info karakter Uma Musume',
        run: async (xp, m, { args, chat }) => {
            if (!args[0]) return m.reply('Masukkan nama karakter! Contoh: .uma special week')
            
            await xp.sendMessage(chat.id, { react: { text: '🐎', key: m.key } })
            
            const query = args.join(' ')
            const data = await getUmaData(query)
            
            if (!data.status) return m.reply(`❌ Karakter *${query}* tidak ditemukan.\nCoba nama lengkap (ex: Mejiro McQueen).`)
            
            const statsTxt = Object.entries(data.stats)
                .map(([k, v]) => `├ ${k}: ${v}`)
                .join('\n')

            const caption = `🐎 *UMA MUSUME DATABASE* 🐎
━━━━━━━━━━━━━━━━
👤 *Nama:* ${data.name}
🇯🇵 *Jp:* ${data.jpName || '-'}
📝 *Deskripsi:*
${data.description || '-'}

📊 *STATS & INFO*
├ 🛣️ Surface: ${data.surface || '-'}
├ 📏 Distance: ${data.bestDistance || '-'}
├ 🧠 Strategy: ${data.strategy || '-'}
├ ✨ Signature: ${data.signature || '-'}
${statsTxt}
━━━━━━━━━━━━━━━━`

            const buttons = [
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🔗 Lihat di Web",
                        url: data.url,
                        merchant_url: data.url
                    })
                }
            ]

            if (data.image) {
                await sendIAMessage(xp, chat.id, buttons, {
                    media: data.image,
                    mediaType: 'image',
                    body: caption
                }, { quoted: m })
            } else {
                m.reply(caption)
            }
        }
    })

    // --- OTAKUDESU SEARCH ---
    ev.on({
        name: 'otakudesusearch',
        cmd: ['otakudesu', 'otaku', 'otakudesusearch'],
        tags: 'Search Menu',
        desc: 'Cari anime di Otakudesu',
        run: async (xp, m, { args, chat }) => {
            const query = args.join(' ');
            if (!query) return m.reply('Masukkan judul anime yang ingin dicari!');

            try {
                await xp.sendMessage(chat.id, { react: { text: 'SEARCHING', key: m.key } });

                const apiUrl = `https://api.ootaizumi.web.id/anime/otakudesu/search?query=${encodeURIComponent(query)}`;
                const res = await fetch(apiUrl);
                const json = await res.json();

                if (!json.status || !json.result || json.result.length === 0) {
                    return m.reply(`❌ Anime dengan judul "${query}" tidak ditemukan di Otakudesu.`);
                }

                let responseText = `✅ *Hasil Pencarian untuk "${query}"*\n\n`;
                json.result.slice(0, 5).forEach((anime, index) => {
                    responseText += `*${index + 1}. ${anime.title}*\n`;
                    responseText += `   - Rating: ${anime.rating}\n`;
                    responseText += `   - Status: ${anime.status}\n`;
                    responseText += `   - Link: ${anime.url}\n\n`;
                });

                await m.reply(responseText);

            } catch (e) {
                console.error("Otakudesu Search Error:", e);
                m.reply('❌ Terjadi kesalahan saat mencari anime di Otakudesu.');
            }
        }
    });

    // --- ANIME THEME SEARCH ---
    ev.on({
        name: 'themesearch',
        cmd: ['animesong', 'ost', 'laguanime'],
        tags: 'Search Menu',
        desc: 'Cari lagu Opening/Ending dari sebuah anime',
        run: async (xp, m, { args, chat }) => {
            const query = args.join(' ');
            if (!query) return m.reply('Masukkan judul anime!');

            try {
                await xp.sendMessage(chat.id, { react: { text: '🎵', key: m.key } });

                const apiUrl = `https://api.ootaizumi.web.id/anime/theme-search?query=${encodeURIComponent(query)}`;
                const res = await fetch(apiUrl);
                const json = await res.json();

                if (!json.status || (!json.result.openings.length && !json.result.endings.length)) {
                    return m.reply(`❌ Tidak ditemukan lagu tema untuk anime "${query}".`);
                }

                let responseText = `🎶 *Lagu Tema untuk "${query}"*\n\n`;

                if (json.result.openings && json.result.openings.length > 0) {
                    responseText += "🎤 *OPENING(S):*\n";
                    json.result.openings.forEach(op => {
                        responseText += `- ${op}\n`;
                    });
                    responseText += "\n";
                }

                if (json.result.endings && json.result.endings.length > 0) {
                    responseText += "🎧 *ENDING(S):*\n";
                    json.result.endings.forEach(ed => {
                        responseText += `- ${ed}\n`;
                    });
                }

                await m.reply(responseText.trim());

            } catch (e) {
                console.error("Theme Search Error:", e);
                m.reply('❌ Terjadi kesalahan saat mencari lagu tema.');
            }
        }
    });

    // --- LIVECHART.ME SEARCH ---
    ev.on({
        name: 'livechart',
        cmd: ['livechart', 'lc'],
        tags: 'Search Menu',
        desc: 'Cari jadwal tayang anime di LiveChart.me',
        run: async (xp, m, { args, chat }) => {
            const query = args.join(' ');
            if (!query) return m.reply('Masukkan judul anime yang ingin dicari jadwalnya!');

            try {
                await xp.sendMessage(chat.id, { react: { text: '📅', key: m.key } });

                const apiUrl = `https://api.ootaizumi.web.id/search/livechart?query=${encodeURIComponent(query)}`;
                const res = await fetch(apiUrl);
                const json = await res.json();

                if (!json.status || !json.result || json.result.length === 0) {
                    return m.reply(`❌ Tidak ditemukan anime dengan judul "${query}" di LiveChart.`);
                }
                
                // Ambil hasil pertama sebagai hasil utama
                const mainResult = json.result[0];
                
                let responseText = `📅 *LiveChart.me Search Result*\n\n`;
                responseText += `*${mainResult.title}*\n`;
                responseText += `*Rilis:* ${mainResult.premiere || 'N/A'}\n`;
                if (mainResult.rating) {
                    responseText += `*Rating:* ${mainResult.rating}\n`;
                }
                responseText += `*Info Lengkap:* ${mainResult.link}\n\n`;
                
                // Tambahkan beberapa hasil lain jika ada
                if (json.result.length > 1) {
                    responseText += `*Hasil lainnya:*\n`;
                    json.result.slice(1, 4).forEach(anime => {
                        responseText += `- ${anime.title} (${anime.premiere || 'TBA'})\n`;
                    });
                }
                
                await xp.sendMessage(m.chat, {
                    image: { url: mainResult.poster },
                    caption: responseText.trim()
                }, { quoted: m });

            } catch (e) {
                console.error("LiveChart Search Error:", e);
                m.reply('❌ Terjadi kesalahan saat mencari jadwal anime.');
            }
        }
    });



    // --- HUSBU & LOLI ---
    ev.on({
        name: 'husbu',
        cmd: ['husbu', 'husbando'],
        tags: 'Anime Menu',
        desc: 'Random husbu image',
        run: async (xp, m, { chat }) => {
            await xp.sendMessage(chat.id, { react: { text: '🤵', key: m.key } })
            try {
                const res = await fetch('https://raw.githubusercontent.com/KazukoGans/database/main/anime/husbu.json')
                const json = await res.json()
                const url = json[Math.floor(Math.random() * json.length)]

                const buttons = [{
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🔄 NEXT HUSBU",
                        id: ".husbu"
                    })
                }]

                await sendIAMessage(xp, chat.id, buttons, {
                    media: url,
                    mediaType: 'image',
                    body: `🤵 *RANDOM HUSBU* 🤵`,
                    footer: global.botName
                }, { quoted: m })

            } catch (e) {
                m.reply('Gagal mengambil husbu.')
            }
        }
    })



    // --- PINTEREST CHARACTERS ---
    const chars = [
        { cmd: 'reze', query: 'reze chainsaw man icon', name: 'Reze (Bomb Girl)' },
        { cmd: 'makima', query: 'makima chainsaw man icon', name: 'Makima' },
        { cmd: 'power', query: 'power chainsaw man icon', name: 'Power' },
        { cmd: 'denji', query: 'denji chainsaw man icon', name: 'Denji' },
        { cmd: 'naruto', query: 'naruto uzumaki aesthetic', name: 'Naruto Uzumaki' },
        { cmd: 'sasuke', query: 'sasuke uchiha icon', name: 'Sasuke Uchiha' },
        { cmd: 'luffy', query: 'monkey d luffy icon', name: 'Monkey D. Luffy' },
        { cmd: 'zoro', query: 'roronoa zoro icon', name: 'Roronoa Zoro' },
        { cmd: 'sanji', query: 'vinsmoke sanji icon', name: 'Sanji' },
        { cmd: 'goku', query: 'son goku icon', name: 'Son Goku' },
        { cmd: 'saitama', query: 'saitama one punch man icon', name: 'Saitama' },
        { cmd: 'killua', query: 'killua zoldyck icon', name: 'Killua Zoldyck' },
        { cmd: 'gon', query: 'gon freecss icon', name: 'Gon Freecss' },
        { cmd: 'alya', query: 'alya roshidere icon', name: 'Alisa Mikhailovna' },
        { cmd: 'waguri', query: 'kaoru waguri icon', name: 'Kaoru Waguri' },
        { cmd: 'yor', query: 'yor forger icon', name: 'Yor Forger' },
        { cmd: 'anya', query: 'anya forger icon', name: 'Anya Forger' },
        { cmd: 'marin', query: 'marin kitagawa icon', name: 'Marin Kitagawa' },
        { cmd: 'chisato', query: 'chisato nishikigi icon', name: 'Chisato Nishikigi' },
        { cmd: 'takina', query: 'takina inoue icon', name: 'Takina Inoue' },
        { cmd: 'rem', query: 'rem re zero icon', name: 'Rem' },
        { cmd: 'ram', query: 'ram re zero icon', name: 'Ram' },
        { cmd: 'emilia', query: 'emilia re zero icon', name: 'Emilia' },
        { cmd: 'miku', query: 'miku nakano icon', name: 'Miku Nakano' },
        { cmd: 'nino', query: 'nino nakano icon', name: 'Nino Nakano' },
        { cmd: 'kaguya', query: 'kaguya shinomiya icon', name: 'Kaguya Shinomiya' },
        { cmd: 'chika', query: 'chika fujiwara icon', name: 'Chika Fujiwara' },
        { cmd: 'nezuko', query: 'nezuko kamado icon', name: 'Nezuko Kamado' },
        { cmd: 'maihil', query: 'mai sakurajima icon', name: 'Mai Sakurajima' },
        { cmd: 'elaina', query: 'elaina majo no tabitabi icon', name: 'Elaina' },
        { cmd: 'siesta', query: 'siesta majo no tabitabi icon', name: 'Siesta' },
        { cmd: 'zero2', query: 'zero two darling in the franxx icon', name: 'Zero Two' },
        { cmd: 'hori', query: 'kyoko hori icon', name: 'Kyoko Hori' },
        { cmd: 'miyamura', query: 'izumi miyamura icon', name: 'Izumi Miyamura' },
        { cmd: 'chizuru', query: 'chizuru mizuhara icon', name: 'Chizuru Mizuhara' },
        { cmd: 'ruka', query: 'ruka sarashina icon', name: 'Ruka Sarashina' },
        { cmd: 'sumi', query: 'sumi sakurasawa icon', name: 'Sumi Sakurasawa' },
        { cmd: 'shirogane', query: 'miyuki shirogane icon', name: 'Miyuki Shirogane' },
        { cmd: 'hayasaka', query: 'ai hayasaka icon', name: 'Ai Hayasaka' },
        { cmd: 'sakuta', query: 'sakuta azusagawa icon', name: 'Sakuta Azusagawa' },
        { cmd: 'yukino', query: 'yukino yukinoshita icon', name: 'Yukino Yukinoshita' },
        { cmd: 'yui', query: 'yui yuigahama icon', name: 'Yui Yuigahama' },
        { cmd: 'iroha', query: 'iroha isshiki icon', name: 'Iroha Isshiki' },
        { cmd: 'hachiman', query: 'hachiman hikigaya icon', name: 'Hachiman Hikigaya' },
        { cmd: 'chitoge', query: 'chitoge kirisaki icon', name: 'Chitoge Kirisaki' },
        { cmd: 'onodera', query: 'kosaki onodera icon', name: 'Kosaki Onodera' },
        { cmd: 'taiga', query: 'taiga aisaka icon', name: 'Taiga Aisaka' },
        { cmd: 'violet', query: 'violet evergarden icon', name: 'Violet Evergarden' },
        { cmd: 'mahiru', query: 'mahiru shiina icon', name: 'Mahiru Shiina' },
        { cmd: 'shikimori', query: 'shikimori micchon icon', name: 'Shikimori' },
        { cmd: 'nagatoro', query: 'hayase nagatoro icon', name: 'Nagatoro' },
        { cmd: 'komi', query: 'shouko komi icon', name: 'Komi Shouko' },
        { cmd: 'frieren', query: 'frieren icon', name: 'Frieren' },
        { cmd: 'fern', query: 'fern frieren icon', name: 'Fern' },
        { cmd: 'stark', query: 'stark frieren icon', name: 'Stark' },
        { cmd: 'ayanokouji', query: 'kiyotaka ayanokouji icon', name: 'Ayanokouji' },
        { cmd: 'horikita', query: 'suzune horikita icon', name: 'Horikita Suzune' },
        { cmd: 'kei', query: 'kei karuizawa icon', name: 'Kei Karuizawa' },
        { cmd: 'arisu', query: 'arisu sakayanagi icon', name: 'Arisu Sakayanagi' },
        { cmd: 'aihoshino', query: 'ai hoshino icon', name: 'Ai Hoshino' },
        { cmd: 'aqua', query: 'aqua hoshino icon', name: 'Aqua Hoshino' },
        { cmd: 'ruby', query: 'ruby hoshino icon', name: 'Ruby Hoshino' },
        { cmd: 'kana', query: 'kana arima icon', name: 'Kana Arima' },
        { cmd: 'akane', query: 'akane kurokawa icon', name: 'Akane Kurokawa' },
        { cmd: 'gojo', query: 'satoru gojo icon', name: 'Satoru Gojo' },
        { cmd: 'sukuna', query: 'ryomen sukuna icon', name: 'Ryomen Sukuna' },
        { cmd: 'megumi', query: 'megumi fushiguro icon', name: 'Megumi Fushiguro' },
        { cmd: 'nobara', query: 'nobara kugisaki icon', name: 'Nobara Kugisaki' },
        { cmd: 'mikey', query: 'mikey tokyo revengers icon', name: 'Mikey (Manjiro)' },
        { cmd: 'draken', query: 'draken tokyo revengers icon', name: 'Draken' },
        { cmd: 'hutao', query: 'hu tao genshin impact icon', name: 'Hu Tao' },
        { cmd: 'raiden', query: 'raiden shogun icon', name: 'Raiden Shogun' },
        { cmd: 'nahida', query: 'nahida genshin icon', name: 'Nahida' },
        { cmd: 'furina', query: 'furina genshin icon', name: 'Furina' },
        { cmd: 'kafka_hsr', query: 'kafka honkai star rail icon', name: 'Kafka (HSR)' },
        { cmd: 'firefly', query: 'firefly honkai star rail icon', name: 'Firefly' },
        { cmd: 'kafka', query: 'kafka hibino kaiju no 8', name: 'Kafka Hibino' },
        { cmd: 'akame', query: 'akame ga kill icon', name: 'Akame' },
        { cmd: 'rimuru', query: 'rimuru tempest icon', name: 'Rimuru Tempest' }
    ]

    chars.forEach(c => {
        ev.on({
            name: c.cmd,
            cmd: [c.cmd],
            tags: 'Anime Menu',
            desc: `Random ${c.name} image`,
            run: async (xp, m, { chat }) => {
                await xp.sendMessage(chat.id, { react: { text: '🔍', key: m.key } })
                try {
                    const api = `https://api.nexray.web.id/search/pinterest?q=${encodeURIComponent(c.query)}`
                    const res = await fetch(api).then(r => r.json())
                    
                    if (!res.status || !res.result || res.result.length === 0) return m.reply('Gambar tidak ditemukan.')
                    
                    const img = res.result[Math.floor(Math.random() * res.result.length)].images_url

                    const buttons = [{
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: `🔄 NEXT ${c.cmd.toUpperCase()}`,
                            id: `.${c.cmd}`
                        })
                    }]

                    await sendIAMessage(xp, chat.id, buttons, {
                        media: img,
                        mediaType: 'image',
                        body: `✨ *${c.name.toUpperCase()}* ✨`,
                        footer: global.botName
                    }, { quoted: m })

                } catch (e) {
                    console.error(e)
                    m.reply('Gagal mengambil gambar karakter.')
                }
            }
        })
    })
}