#!/usr/bin/env node
/**
 * PRESET_BLOCKS_DATA
 * https://wiki.fractalaudio.com/wiki/index.php?title=MIDI_SysEx#PRESET_BLOCKS_DATA
 * https://wiki.fractalaudio.com/wiki/index.php?title=MIDI_SysEx#SysEx_Model_number_per_device
 */

const path = require('path')
const argParser = require(path.join(__dirname, 'argparser.js'))


const _API = require(path.join(__dirname, 'src/api'))()
const argsSettings = {
    description: `Send MIDI commands to FAS device FM3, FM9 or AXE-FX III`,
    args: [
        { name: '--midiIn', description: 'Name of the midi in device', isFlag: false, required: true }
        ,
        { name: '--midiOut', description: 'Name of the midi out device. Leave empty if same as --midiIn', isFlag: false, required: false }
        ,
        { name: '--fasDevice', description: 'Set to "FM3", "FM9" or "AXEFXIII"', isFlag: false, required: true }
        ,
        { name: '--command', description: `Set to a MIDI command to send.\n\t\tList of available FAS MIDI commands: \n\t\t${Object.keys(_API._COMMAND_).filter(item => !item.startsWith('_')).join('\n\t\t')}\n\n\t\tNote: Command is called "BYPASS" but handled as "ENGAGE"`, isFlag: false, required: true }
        ,
        { name: '--value', description: 'Set the MIDI value Sysex message', isFlag: false, required: false }
        ,
        { name: '--verbose', description: 'Verbose logging to console', isFlag: true, required: false }
    ]
    , examples: [
        `   
        Set bank to number
            ${path.basename(process.argv[1])} --midiIn "USB MIDI Interface" --fasDevice FM3 --command BANK --value 1`
        ,
        `
        Set patch to number
            ${path.basename(process.argv[1])} --midiIn "USB MIDI Interface" --fasDevice FM3 --command PATCH --value 0`
        , `
        Bypass CAB block:
            ${path.basename(process.argv[1])} --midiIn "USB MIDI Interface" --fasDevice FM3 --command BYPASS --value "ID_CAB1 false"
        `
        , `
        Engabe CAB block:
            ${path.basename(process.argv[1])} --midiIn "USB MIDI Interface" --fasDevice FM3 --command BYPASS --value "ID_CAB1 true"
            Exmaple output:
                {
                    "id": "ID_CAB1",
                    "engaged": true
                }
        `
        , `
        Query patch name:
            ${path.basename(process.argv[1])} --midiIn "USB MIDI Interface" --fasDevice FM3 --command QUERY_PATCH_NAME
            Example output:
                {
                    "number": 475,
                    "name": "Plexi 100W"
                }        
        `
        , `
        Query scene name:
            ${path.basename(process.argv[1])} --midiIn "USB MIDI Interface" --fasDevice FM3 --command QUERY_SCENE_NAME
            Example output:
                {
                    "number": 3,
                    "name": "1959SLP Treble"
                }
        `
        , `
        Query scene name:
            ${path.basename(process.argv[1])} --midiIn "USB MIDI Interface" --fasDevice FM3 --command GET_FIRMWARE_VERSION
            Example output:
                "12.0"
        ` 
    ]

}
const argsOptions = argParser.parse(argsSettings)



const verbose = argsOptions.verbose

const midiIn = argsOptions.midiIn
const midiOut = argsOptions.midiOut || midiIn

const options = []
options.push(argsOptions.fasDevice)
options.push(argsOptions.command)
options.push(...(argsOptions?.value?.split(' ')) || [])

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

const F = require('./src/FractalMIDI')
const CLIENT = require('./src/client')

const deviceIDMap = {
    'AXEFXIII': F.DEVICE['Axe-Fx III'],
    'FM3': F.DEVICE.FM3,
    'FM9': F.DEVICE.FM9
}
const fasDeviceID = deviceIDMap[process.argv[2]] || F.DEVICE.FM3

const API = require(path.join(__dirname, 'src/api'))(outputProvider, inputProvider, fasDeviceID, verbose)


const send = async (options) => {

    if (verbose)
        console.log(`*** Sending message`)
    //const args = process.argv.slice(2)
    //.filter(item => !item).concat(['FM3', 'QUERY_SCENE_NAME', '2'])
    //.filter(item => !item).concat(['FM3', 'GET_FIRMWARE_VERSION'])
    //.filter(item => !item).concat(['FM3', 'BYPASS', 'ID_INPUT1', 'true'])
    // .filter(item => !item).concat(['FM3', 'STATUS_DUMP'])
    // .filter(item => !item).concat(['FM3', 'PATCH', '31'])
    // .filter(item => !item).concat(['FM3', 'QUERY_PATCH_NAME'])
    // .filter(item => !item).concat(['FM3', 'TEMPO', '120'])

    async function _send(...options) {

        const _args = options.slice(1)
        return new CLIENT(inputProvider.getInput(), outputProvider.getOutput(), fasDeviceID, verbose)
            .send(..._args)
    }
    if (options.length) {
        return _send(...options)
    } else {
        if (verbose)
            console.log(`- - - - - - - - - - - - - - - - - - - - - - - - - - - - 
Available commands:
${Object.keys(API._COMMAND_).filter(item => !item.startsWith('_')).join('\n')}
- - - - - - - - - - - - - - - - - - - - - - - - - - - - 
            `)
        throw new Error(`Min 1 argument required!`)
    }
}

const main = async () => {
    const result = await send(options)
    if (null != result && typeof (result) !== 'undefined')
        console.log(JSON.stringify(result, null, 2))
}

main()
    .then(result => process.exit(0))
    .catch(e => {
        console.error(e, e.stack)
        process.exit(-1)
    })