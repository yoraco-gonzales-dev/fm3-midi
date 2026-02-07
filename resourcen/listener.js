#!/usr/bin/env node
/**
 * Listens to incoming MIDI Sysex messages
 */

const easymidi = require('easymidi')
const outputProvider = { getOutput: () => new easymidi.Output('USB MIDI Interface') }
const inputProvider = {
    getInput: () => {
        /**
         * Make this compliant with standard midi api
         */
        const input = new easymidi.Input("USB MIDI Interface")
        if (!input.$_parseMessage_Org) {
            input.$_parseMessage_Org = input.parseMessage
            input.parseMessage = (bytes) => {
                const msg = input.$_parseMessage_Org.apply(input, [bytes])
                msg.msg.data = bytes
                return msg
            }
        }
        return input
    }
}

const API = require('./src/api')(outputProvider, inputProvider)

inputProvider.getInput().on(
    // 'sysex'
    'message' // listen to all messages
    , async (msg) => {
        console.log(`
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
ON MIDI message:
HEX:${API._UTILS_.bytesToHexString(msg.bytes)}
JSON: ${JSON.stringify(msg)}
\n`)
    })