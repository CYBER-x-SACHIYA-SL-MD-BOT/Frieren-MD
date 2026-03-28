import similarity from 'similarity'
import { db, saveDb } from './db/data.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { toRupiah, toCompact, toTokens, getTitle } from './lib/formatter.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class Inventory {
  static getUser(userJid) {
    if (!userJid) return null
    return db().key[userJid] || null
  }

  static _lookupCache = null

  static findItem(query) {
      if (!query) return null
      const config = this.getCfg()
      const items = config.items
      const recipes = config.recipes
      
      const clean = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '')
      const target = clean(query)
      
      // Initialize/Refresh Lookup Cache
      if (!this._lookupCache || this._lookupCache.cfgTime !== this._cfgTime) {
          const allKeys = [...new Set([...Object.keys(items), ...Object.keys(recipes)])]
          this._lookupCache = {
              cfgTime: this._cfgTime,
              entries: allKeys.map(k => {
                  const itemData = items[k] || recipes[k]
                  return {
                      key: k,
                      cleanKey: clean(k),
                      cleanName: clean(itemData?.name || ''),
                      cleanAliases: (itemData?.aliases || []).map(a => clean(a))
                  }
              })
          }
      }

      const cache = this._lookupCache.entries
      
      // 1. Exact Match (Key)
      for (const e of cache) {
          if (e.cleanKey === target) return e.key
      }

      // 2. Alias Match
      for (const e of cache) {
          if (e.cleanAliases.includes(target)) return e.key
      }
      
      // 3. Exact Name Match
      for (const e of cache) {
          if (e.cleanName === target) return e.key
      }
      
      // 4. Fuzzy Match
      let bestMatch = null
      let highestScore = 0
      for (const e of cache) {
          const score = Math.max(similarity(target, e.cleanKey), similarity(target, e.cleanName))
          if (score > highestScore) {
              highestScore = score
              bestMatch = e.key
          }
      }
      
      if (highestScore >= 0.6) return bestMatch
      
      return null
  }

  static getItem(usr, item) {
    const userData = this.getUser(usr)
    if (!userData) return 0
    this.init(userData)
    const value = item.split('.').reduce((acc, key) => acc && acc[key], userData)
    return value === undefined ? 0 : value
  }

  static setItem(usr, item, value) {
    const userData = this.getUser(usr)
    if (!userData) return false
    const keys = item.split('.')
    let current = userData
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current)) current[key] = {}
      current = current[key]
    }
    current[keys[keys.length - 1]] = value
    saveDb()
    return true
  }

  static modify(usr, item, amount) {
    let currentVal = this.getItem(usr, item)
    if (typeof currentVal !== 'number') currentVal = 0
    const newVal = currentVal + amount
    const finalVal = newVal < 0 ? 0 : newVal
    this.setItem(usr, item, finalVal)
    return finalVal
  }

  static setDefaults(target, defaults) {
    for (let key in defaults) {
      const defVal = defaults[key]
      if (typeof defVal === 'object' && defVal !== null && !Array.isArray(defVal)) {
        target[key] = target[key] || {}
        this.setDefaults(target[key], defVal)
      } else {
        if (target[key] === undefined) {
            target[key] = defVal
        }
      }
    }
  }

  static _cfgCache = null
  static _cfgTime = 0

  static getCfg() {
    // Cache for 30 seconds to allow updates but maintain performance
    if (this._cfgCache && Date.now() - this._cfgTime < 30000) {
        return this._cfgCache
    }

    try {
        const jsonPath = path.join(__dirname, 'db/rpg_items.json')
        const raw = fs.readFileSync(jsonPath, 'utf-8')
        const data = JSON.parse(raw)
        
        const settings = db().settings || {}
        const multiplier = settings.rpgPriceMultiplier || 1.0

        if (multiplier !== 1.0) {
            for (let k in data.items) {
                if (data.items[k].price > 0) data.items[k].price = Math.floor(data.items[k].price * multiplier)
                if (data.items[k].sell > 0) data.items[k].sell = Math.floor(data.items[k].sell * multiplier)
            }
        }
        
        this._cfgCache = data
        this._cfgTime = Date.now()
        return data
    } catch (e) {
        console.error('Failed to load RPG config:', e)
        return { items: {}, recipes: {}, inventory: {}, rpg_assets: {}, meta: {} }
    }
  }

  static init(userData) {
    if (!userData) return
    const cfg = this.getCfg()
    this.setDefaults(userData, { inventory: cfg.inventory || {} })
    this.setDefaults(userData, { rpg_assets: cfg.rpg_assets || {} })
    this.setDefaults(userData, { equipped: {}, durability: {} }) 
    this.setDefaults(userData, {
        health: 100, max_health: 100,
        stamina: 100, max_stamina: 100,
        strength: 10, defense: 10,
        level: 1, exp: 0, money: 0, bank: 0, limit: 20, tokens: 0 
    })
    
    // Auto-migrate old gold to tokens if exists
    if (userData.gold !== undefined) {
        userData.tokens = (userData.tokens || 0) + userData.gold
        delete userData.gold
    }
    
    return userData
  }

  static toRupiah(angka) { return toRupiah(angka) }

  static toCompact(number) { return toCompact(number) }

  static toTokens(number) { return toTokens(number) }

  static getStats(user) {
    const cfg = this.getCfg()
    
    let str = user.strength || 10
    let def = user.defense || 10
    let hp = user.max_health || 100
    
    // 1. Equipment Stats
    const equipped = user.equipped || {}
    for (const slot in equipped) {
        const key = equipped[slot]
        if (key) {
            const itemStats = (cfg.items[key] || cfg.recipes[key])?.stats
            if (itemStats) {
                if (itemStats.atk) str += itemStats.atk
                if (itemStats.def) def += itemStats.def
                if (itemStats.hp) hp += itemStats.hp
            }
        }
    }

    // 2. Pet Bonuses
    if (user.pet && user.pet.id) {
        const petBonus = user.pet.activeBonus || {}
        if (petBonus.str) str += petBonus.str
        if (petBonus.def) def += petBonus.def
        if (petBonus.hp) hp += petBonus.hp
    }

    // 3. Job Bonuses (NEW)
    if (user.role) {
        if (user.role === 'warrior') {
            str += 20
            hp += 200
        }
    }

    // 4. Temporary Buffs (NEW)
    if (user.buffs) {
        const now = Date.now()
        for (let b in user.buffs) {
            const buff = user.buffs[b]
            if (now < buff.end) {
                if (b === 'str_boost') str += (buff.value || 0)
            } else {
                delete user.buffs[b] // Buff expired
            }
        }
    }
    
    return { str, def, hp }
  }

  static reduceDurability(userJid, slot, amount = 1) {
      const user = this.getUser(userJid)
      if (!user || !user.equipped || !user.equipped[slot]) return null
      
      const itemKey = user.equipped[slot]
      user.durability = user.durability || {}
      
      if (user.durability[itemKey] === undefined) {
          const cfg = this.getCfg()
          user.durability[itemKey] = (cfg.recipes[itemKey] || cfg.items[itemKey])?.stats?.durability || 100
      }
      
      user.durability[itemKey] -= amount
      
      if (user.durability[itemKey] <= 0) {
          user.durability[itemKey] = 0
          const itemName = this.getCfg().recipes[itemKey]?.name || itemKey
          delete user.equipped[slot] 
          saveDb()
          return `💔 *${itemName}* RUSAK (Hancur)! Item dilepas.`
      }
      
      saveDb()
      return null
  }

  static getExpCap(level) {
      // Exponential scaling: Level 1-10 (1000-10000), then gets harder
      if (level <= 10) return level * 1000
      if (level <= 50) return Math.floor(10000 + (level - 10) * 2500)
      return Math.floor(110000 + (level - 50) * 10000)
  }

  static getTitle(level) { return getTitle(level) }

  static addExp(userJid, amount) {
      const user = this.getUser(userJid)
      if (!user) return { levelUp: false, msg: '' }
      this.init(user)
      
      let exp = user.exp + amount
      let level = user.level
      let levelUp = false
      let msg = ''
      
      let cap = this.getExpCap(level)
      const oldTitle = this.getTitle(level)
      
      while (exp >= cap) {
          level++
          exp -= cap
          levelUp = true
          cap = this.getExpCap(level)
          
          const moneyReward = level * 10000 // Increased reward
          user.money += moneyReward
          user.max_health += 20 // Increased scaling
          user.max_stamina += 10 // Increased scaling
          user.health = user.max_health
          user.stamina = user.max_stamina
          
          msg += `\n🆙 *LEVEL UP!* ${level-1} ➔ ${level}\n💰 +${this.toRupiah(moneyReward)}\n❤️ Max HP +20\n⚡ Max Stamina +10`
      }
      
      const newTitle = this.getTitle(level)
      if (newTitle !== oldTitle) {
          msg += `\n\n🎖️ *NEW TITLE UNLOCKED!*\nYour rank is now: *${newTitle}*`
      }
      
      user.exp = exp
      user.level = level
      saveDb()
      
      return { levelUp, msg, currentLevel: level, currentExp: exp, title: newTitle }
  }
}