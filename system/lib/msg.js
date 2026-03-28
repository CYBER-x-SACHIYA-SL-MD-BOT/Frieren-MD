import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { proto, areJidsSameUser, extractMessageContent } = require("@adiwajshing/baileys");

const MEDIA_TYPES = new Set([
    "imageMessage",
    "videoMessage",
    "audioMessage",
    "stickerMessage",
    "documentMessage",
]);

const fastKeys = (o) => (o && typeof o === "object" ? Object.keys(o) : []);
const safeGet = (o, k) => (o && Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined);
const SYM_PROCESSED = Symbol.for("smsg.processed");

const firstMeaningfulType = (msg) => {
    const keys = fastKeys(msg);
    if (!keys.length) return "";
    const skipTypes = new Set(["senderKeyDistributionMessage", "messageContextInfo"]);
    for (const key of keys) {
        if (!skipTypes.has(key)) return key;
    }
    return keys[keys.length - 1];
};

const getMediaEnvelope = (root, node) => {
    if (!node) return null;
    if (node?.url || node?.directPath) return root;
    const extracted = extractMessageContent(root);
    return extracted || null;
};

const createQuotedMessage = (self, ctx, quoted, rawNode, type) => {
    const textNode = typeof rawNode === "string" ? rawNode : rawNode?.text;
    const base = typeof rawNode === "string" ? { text: rawNode } : rawNode || {};
    const out = Object.create(base);

    return Object.defineProperties(out, {
        mtype: { get: () => type, enumerable: true, configurable: true },
        mediaMessage: {
            get() {
                const env = getMediaEnvelope(quoted, rawNode);
                if (!env) return null;
                const t = fastKeys(env)[0];
                return MEDIA_TYPES.has(t) ? env : null;
            },
            enumerable: true,
            configurable: true
        },
        mediaType: {
            get() {
                const m = this.mediaMessage;
                return m ? fastKeys(m)[0] : null;
            },
            enumerable: true,
            configurable: true
        },
        id: { get: () => ctx.stanzaId || null, enumerable: true, configurable: true },
        chat: { get: () => ctx.remoteJid || self.chat, enumerable: true, configurable: true },
        isBaileys: {
            get() {
                const id = this.id;
                return !!(id && (id.length === 16 || (id.startsWith?.("3EB0") && id.length === 12)));
            },
            enumerable: true,
            configurable: true
        },
        sender: {
            get() {
                const raw = ctx.participant || this.chat || "";
                const conn = self.conn;
                let decoded = raw;
                if (conn?.decodeJid) decoded = conn.decodeJid(raw);
                else if (typeof raw.decodeJid === "function") decoded = raw.decodeJid();
                
                // Resolve LID if available
                if (typeof decoded === 'string' && decoded.endsWith('@lid')) {
                    const e = Object.entries(global.lidCache ?? {});
                    const p = e.find(([, v]) => v === decoded)?.[0];
                    if (p) return `${p}@s.whatsapp.net`;
                }
                return decoded;
            },
            enumerable: true,
            configurable: true
        },
        fromMe: {
            get() {
                const connId = self.conn?.user?.id;
                return connId ? areJidsSameUser?.(this.sender, connId) || false : false;
            },
            enumerable: true,
            configurable: true
        },
        text: {
            get() {
                return textNode || this.caption || this.contentText || this.selectedDisplayText || "";
            },
            enumerable: true,
            configurable: true
        },
        mentionedJid: {
            get() {
                return rawNode?.contextInfo?.mentionedJid || [];
            },
            enumerable: true,
            configurable: true
        },
        name: {
            get() {
                const s = this.sender;
                if (!s) return "";
                return self.conn?.getName ? self.conn.getName(s) : "";
            },
            enumerable: true,
            configurable: true
        },
        vM: {
            get() {
                return proto.WebMessageInfo.fromObject({
                    key: { fromMe: this.fromMe, remoteJid: this.chat, id: this.id },
                    message: quoted,
                    ...(self.isGroup ? { participant: this.sender } : {}),
                });
            },
            enumerable: true,
            configurable: true
        },
        download: {
            async value() {
                const t = this.mediaType;
                if (!t || !self.conn?.downloadM) return Buffer.alloc(0);
                try {
                    const data = await self.conn.downloadM(this.mediaMessage[t], t.replace(/message/i, ""));
                    return Buffer.isBuffer(data) ? data : Buffer.alloc(0);
                } catch {
                    return Buffer.alloc(0);
                }
            },
            enumerable: true,
            configurable: true,
            writable: true
        },
        reply: {
            value(text, chatId, options = {}) {
                if (!self.conn?.reply) throw new Error("Connection not available");
                return self.conn.reply(chatId || this.chat, text, this.vM, options);
            },
            enumerable: true,
            configurable: true,
            writable: true
        },
        copy: {
            value() {
                if (!self.conn) throw new Error("Connection not available");
                const M = proto.WebMessageInfo;
                return M.fromObject(M.toObject(this.vM));
            },
            enumerable: true,
            configurable: true,
            writable: true
        },
        forward: {
            value(jid, force = false, options = {}) {
                if (!self.conn?.sendMessage) throw new Error("Connection not available");
                return self.conn.sendMessage(jid, { forward: this.vM, force, ...options }, options);
            },
            enumerable: true,
            configurable: true,
            writable: true
        },
        delete: {
            value() {
                if (!self.conn?.sendMessage) throw new Error("Connection not available");
                return self.conn.sendMessage(this.chat, { delete: this.vM.key });
            },
            enumerable: true,
            configurable: true,
            writable: true
        },
        react: {
            value(text) {
                if (!self.conn?.sendMessage) throw new Error("Connection not available");
                return self.conn.sendMessage(this.chat, { react: { text, key: this.vM.key } });
            },
            enumerable: true,
            configurable: true,
            writable: true
        },
    });
};

export function serialize() {
    return Object.defineProperties(proto.WebMessageInfo.prototype, {
        conn: { value: undefined, enumerable: false, writable: true, configurable: true },
        id: {
            get() { return this.key?.id || null; },
            set(v) { this.key.id = v; },
            enumerable: true,
            configurable: true
        },
        isBaileys: {
            get() {
                const id = this.id;
                return !!(id && (id.length === 16 || (id.startsWith?.("3EB0") && id.length === 12)));
            },
            enumerable: true,
            configurable: true
        },
        chat: {
            get() {
                const skdm = this.message?.senderKeyDistributionMessage?.groupId;
                const raw = this.key?.remoteJid || (skdm && skdm !== "status @broadcast" ? skdm : "") || "";
                const conn = this.conn;
                if (conn?.decodeJid) return conn.decodeJid(raw);
                if (typeof raw.decodeJid === "function") return raw.decodeJid();
                return raw;
            },
            set(v) { this.key.remoteJid = v; },
            enumerable: true,
            configurable: true
        },
        isChannel: {
            get() {
                const chat = this.chat;
                return typeof chat === "string" && chat.endsWith(" @newsletter");
            },
            enumerable: true,
            configurable: true
        },
        isGroup: {
            get() {
                const chat = this.chat;
                return typeof chat === "string" && chat.endsWith(" @g.us");
            },
            enumerable: true,
            configurable: true
        },
        sender: {
            get() {
                const conn = this.conn;
                const myId = conn?.user?.id;
                const cand = (this.key?.fromMe && myId) || this.participant || this.key?.participant || this.chat || "";
                
                let decoded = cand;
                if (conn?.decodeJid) decoded = conn.decodeJid(cand);
                else if (typeof cand.decodeJid === "function") decoded = cand.decodeJid();
                
                // Resolve LID if available
                if (typeof decoded === 'string' && decoded.endsWith('@lid')) {
                    const e = Object.entries(global.lidCache ?? {});
                    const p = e.find(([, v]) => v === decoded)?.[0];
                    if (p) return `${p}@s.whatsapp.net`;
                }
                return decoded;
            },
            set(v) { this.participant = v; },
            enumerable: true,
            configurable: true
        },
        fromMe: {
            get() {
                const me = this.conn?.user?.id;
                if (!me) return !!this.key?.fromMe;
                const sender = this.sender; // use the getter to get decoded/resolved JID
                return !!(this.key?.fromMe || areJidsSameUser?.(me, sender));
            },
            enumerable: true,
            configurable: true
        },
        mtype: {
            get() { return this.message ? firstMeaningfulType(this.message) : ""; },
            enumerable: true,
            configurable: true
        },
        msg: {
            get() {
                if (!this.message) return null;
                const type = this.mtype;
                return type ? this.message[type] : null;
            },
            enumerable: true,
            configurable: true
        },
        mediaMessage: {
            get() {
                if (!this.message) return null;
                const env = getMediaEnvelope(this.message, this.msg);
                if (!env) return null;
                const t = fastKeys(env)[0];
                return MEDIA_TYPES.has(t) ? env : null;
            },
            enumerable: true,
            configurable: true
        },
        mediaType: {
            get() {
                const m = this.mediaMessage;
                return m ? fastKeys(m)[0] : null;
            },
            enumerable: true,
            configurable: true
        },
        quoted: {
            get() {
                const baseMsg = this.msg;
                const ctx = baseMsg?.contextInfo;
                const quoted = ctx?.quotedMessage;
                if (!baseMsg || !ctx || !quoted) return null;
                const type = fastKeys(quoted)[0];
                if (!type) return null;
                const rawNode = quoted[type];
                return createQuotedMessage(this, ctx, quoted, rawNode, type);
            },
            set(v) { this._quoted = v; },
            enumerable: true,
            configurable: true
        },
        text: {
            get() {
                const msg = this.msg;
                if (!msg) return "";
                if (typeof msg === "string") return msg;
                const primary = msg.text || msg.caption || msg.contentText || msg.selectedId || msg.selectedDisplayText || "";
                if (primary) return primary;
                if (msg.nativeFlowResponseMessage?.paramsJson) {
                    try {
                        const parsed = JSON.parse(msg.nativeFlowResponseMessage.paramsJson);
                        if (parsed?.id) return String(parsed.id);
                    } catch {}
                }
                return msg.hydratedTemplate?.hydratedContentText || "";
            },
            set(v) { this._text = v; },
            enumerable: true,
            configurable: true
        },
        mentionedJid: {
            get() {
                const arr = safeGet(this.msg?.contextInfo || {}, "mentionedJid");
                return Array.isArray(arr) && arr.length ? arr : [];
            },
            enumerable: true,
            configurable: true
        },
        name: {
            get() {
                const pn = this.pushName;
                if (pn != null && pn !== "") return pn;
                const sender = this.sender;
                if (!sender) return "";
                return this.conn?.getName ? this.conn.getName(sender) : "";
            },
            enumerable: true,
            configurable: true
        },
        download: {
            async value() {
                const t = this.mediaType;
                if (!t || !this.conn?.downloadM) return Buffer.alloc(0);
                try {
                    const data = await this.conn.downloadM(this.mediaMessage[t], t.replace(/message/i, ""));
                    return Buffer.isBuffer(data) ? data : Buffer.alloc(0);
                } catch {
                    return Buffer.alloc(0);
                }
            },
            enumerable: true,
            configurable: true,
            writable: true
        },
        reply: {
            value(text, chatId, options = {}) {
                if (!this.conn?.reply) throw new Error("Connection not available");
                return this.conn.reply(chatId || this.chat, text, this, options);
            },
            enumerable: true,
            configurable: true,
            writable: true
        },
        copy: {
            value() {
                if (!this.conn) throw new Error("Connection not available");
                const M = proto.WebMessageInfo;
                return M.fromObject(M.toObject(this));
            },
            enumerable: true,
            configurable: true,
            writable: true
        },
        forward: {
            value(jid, force = false, options = {}) {
                if (!this.conn?.sendMessage) throw new Error("Connection not available");
                return this.conn.sendMessage(jid, { forward: this, force, ...options }, options);
            },
            enumerable: true,
            configurable: true,
            writable: true
        },
        delete: {
            value() {
                if (!this.conn?.sendMessage) throw new Error("Connection not available");
                return this.conn.sendMessage(this.chat, { delete: this.key });
            },
            enumerable: true,
            configurable: true,
            writable: true
        },
        react: {
            value(text) {
                if (!this.conn?.sendMessage) throw new Error("Connection not available");
                return this.conn.sendMessage(this.chat, { react: { text, key: this.key } });
            },
            enumerable: true,
            configurable: true,
            writable: true
        },
    });
}

export function smsg(conn, m) {
    if (!m) return m;
    if (m[SYM_PROCESSED]) {
        m.conn = conn;
        return m;
    }

    const M = proto.WebMessageInfo;
    if (M?.fromObject && !(m instanceof M)) {
        m = M.fromObject(m);
    }

    m.conn = conn;

    const msg = m.message;
    if (!msg) {
        m[SYM_PROCESSED] = true;
        return m;
    }

    m[SYM_PROCESSED] = true;
    return m;
}