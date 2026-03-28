/**
 * UI Formatter Utilities for FRIEREN-MD
 */

/**
 * Format number to Indonesian Rupiah (Rp)
 * @param {number|string} n 
 * @returns {string}
 */
export const toRupiah = (n) => {
    const value = typeof n === 'number' ? n : parseFloat(n || 0)
    return 'Rp ' + Math.floor(value).toLocaleString('id-ID')
}

/**
 * Format number to compact notation (e.g. 1.2k, 5M)
 * @param {number|string} n 
 * @returns {string}
 */
export const toCompact = (n) => {
    const value = typeof n === 'number' ? n : parseFloat(n || 0)
    return Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

/**
 * Format number to Token notation with emoji
 * @param {number} n 
 * @returns {string}
 */
export const toTokens = (n) => {
    if (isNaN(n)) return '0 🎟️'
    return Math.floor(n).toLocaleString('id-ID') + ' 🎟️'
}

/**
 * Get RPG Title based on level
 * @param {number} level 
 * @returns {string}
 */
export const getTitle = (level) => {
    if (level >= 100) return '👑 God Emperor'
    if (level >= 95) return '👑 Supreme King'
    if (level >= 90) return '👑 Great King'
    if (level >= 85) return '👑 King'
    if (level >= 80) return '🏰 Archduke'
    if (level >= 75) return '🏰 Grand Duke'
    if (level >= 70) return '🏰 Duke'
    if (level >= 65) return '🏯 Prince'
    if (level >= 60) return '🏯 Marquess'
    if (level >= 55) return '🛡️ Count'
    if (level >= 50) return '🛡️ Viscount'
    if (level >= 45) return '⚔️ Baron'
    if (level >= 40) return '⚔️ Baronet'
    if (level >= 35) return '🎖️ Paladin'
    if (level >= 30) return '🎖️ Grand Knight'
    if (level >= 25) return '🎖️ Senior Knight'
    if (level >= 20) return '🎖️ Knight'
    if (level >= 15) return '🏹 Squire'
    if (level >= 10) return '🗡️ Apprentice'
    if (level >= 5) return '🔰 Novice'
    return '👤 Commoner'
}
