/**
 * @module system/lib/gemini_helper
 * @description Helper untuk rotasi API Key Gemini & Fallback ke NexRay
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';

let keyIndex = 0;

/**
 * Mendapatkan instance GoogleGenerativeAI dengan API Key yang dirotasi.
 * Mendukung env: GEMINI_API_KEYS (koma separated), GEMINI_API_KEY, atau GEMINI_TOKEN.
 * @returns {GoogleGenerativeAI} Instance client
 */
export function getGeminiClient() {
    const keysRaw = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || process.env.GEMINI_TOKEN || "";
    let keys = keysRaw.split(',').map(k => k.trim()).filter(k => k);

    if (keys.length === 0) {
        throw new Error("GEMINI_API_KEYS not found in environment variables.");
    }

    const currentKey = keys[keyIndex];
    keyIndex = (keyIndex + 1) % keys.length;

    return new GoogleGenerativeAI(currentKey);
}

/**
 * Fallback AI using NexRay API
 * Digunakan jika Google GenAI limit/error.
 * @param {string} text Input text/prompt
 * @returns {Promise<string>} AI Response
 */
export async function fetchNexRayAI(text) {
    try {
        // console.log('[AI] Switching to NexRay fallback...');
        const { data } = await axios.get(`https://api.nexray.web.id/ai/gemini?text=${encodeURIComponent(text)}`);
        
        if (data.code === 200 && data.result) {
            return data.result;
        }
        throw new Error('Invalid response from NexRay');
    } catch (e) {
        // console.error('[AI Fallback Error]', e.message);
        throw e; // Rethrow if even fallback fails
    }
}
