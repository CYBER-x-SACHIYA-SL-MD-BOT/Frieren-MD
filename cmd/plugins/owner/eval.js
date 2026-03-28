/**
 * @module plugins/owner/eval
 * @description Advanced Eval plugin for Bot Owner.
 * Supports:
 * >  - Execute code (Exec)
 * => - Execute and return result (Return)
 */

import util from 'util'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { db, gc, stats, saveDb, saveGc } from '#system/db/data.js'
import { Inventory } from '#system/inventory.js'
import { func, call } from '#system/function.js'

let handler = async (m, { conn, isOwner, text, usedPrefix, command, args }) => {
    // Determine the actual code
    // If command is '=>' or '>', the code is 'text'
    // If prefix was used (e.g. .=>), command will be '=>'
    // If no prefix was used (prefix: false), command will also be '=>' or '>'
    
    let code = text || args.join(' ')
    if (!code) return

    // Add common variables to the scope
    const _ = {
        axios, fs, path, util, 
        db, gc, stats, saveDb, saveGc,
        Inventory, func, call,
        m, conn, xp: conn,
        chat: m.chat,
        sender: m.sender,
        isOwner,
        args
    }

    // Reaction for process
    await m.react('⏳')

    try {
        let evaled
        // Execute based on command type
        if (command === '=>') {
            // Return mode: Wrap in async and return
            evaled = await eval(`(async ({ ${Object.keys(_).join(', ')} }) => { 
                try {
                    return ${code} 
                } catch (e) {
                    return e
                }
            })(_)` )
        } else {
            // Exec mode: Just run
            evaled = await eval(`(async ({ ${Object.keys(_).join(', ')} }) => { 
                try {
                    ${code} 
                } catch (e) {
                    return e
                }
            })(_)` )
        }

        // Handle undefined/null specifically for 'exec' mode if no output
        if (command === '>' && (evaled === undefined || evaled === null)) {
            return await m.react('✅')
        }

        // Format result
        let output
        if (typeof evaled !== 'string') {
            output = util.inspect(evaled, { depth: 4, compact: true })
        } else {
            output = evaled
        }

        // Clean output from sensitive data (Optional but good practice)
        // e.g. hide session data or API keys if found in string
        
        await m.reply(output)
        await m.react('✅')
    } catch (e) {
        await m.reply(util.format(e))
        await m.react('❌')
    }
}

handler.help = ["> <code>", "=> <code>", ".eval <code>"];
handler.tags = ["owner"];
handler.command = ['>', '=>', 'eval', 'ev'];
handler.owner = true;
handler.prefix = false; 

export default handler;
