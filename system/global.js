import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { fileURLToPath } from 'url'
import sys from './sys.js'
import { number } from './helper.js'
import { call, func } from './function.js'
import getMessageContent from './msg.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const readmore = '\u200E'.repeat(4e3 + 1)
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const q = (t) => new Promise((r) => rl.question(t, r))

// Assign Helper Functions & Defaults (If not set by config.js)
Object.assign(global, {
  ...sys,
  number,
  filename,
  dirname,
  readmore,
  call,
  func,
  getMessageContent,
  
  // Defaults if config.js missing
  prefix: global.prefix || ['.', '/', '#', '!'],
  nomorBot: global.nomorwa || '628xxx',
  botName: global.namebot || 'FrierenBot',
  ownerName: global.author || 'Owner',
  ownerNumber: global.owner ? global.owner.map(o => o[0]) : ['628xxx'],
  
  // System Settings (Default if not set in config)
  public: global.public !== undefined ? global.public : true,
  autoread: global.autoread !== undefined ? global.autoread : true,
  autotyping: global.autotyping !== undefined ? global.autotyping : false,
  autorecording: global.autorecording !== undefined ? global.autorecording : false,
  alwaysonline: global.alwaysonline !== undefined ? global.alwaysonline : true,
  anticall: global.anticall !== undefined ? global.anticall : false,
  gconly: global.gconly !== undefined ? global.gconly : false,
  pconly: global.pconly !== undefined ? global.pconly : false,
  autoreadsw: global.autoreadsw !== undefined ? global.autoreadsw : true,
  
  // Menu Settings
  idCh: '120363405765781159@newsletter',
  linkCh: global.sgc || 'https://whatsapp.com/channel/0029VbCGe9q1XquPfMgyhN1c',
  footer: global.wm || 'FrierenBot Multi-Device',
  
  // Tools
  log: console.log,
  err: console.error,
  rl,
  q
})

export default global
