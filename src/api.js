const F = require('./FractalMIDI')
const easymidi = require('easymidi')

const API = (outputProvider, inputProvider, deviceID = F.DEVICE.FM3, verbose = false) => {
    //    console.log(`*** Calling API with: `, { outputProvider, inputProvider, verbose, deviceID }, new Error('Call stack').stack)
    const selectedDevice = deviceID || F.DEVICE.FM3

    const isEasyMidiInput = (a) => {
        return (typeof easymidi !== 'undefined' && a instanceof easymidi.Input)
    }
    const isEasyMidiOutput = (a) => {
        return (typeof easymidi !== 'undefined' && a instanceof easymidi.Output)
    }

    const isFractalSysexResponse = (bytes) => {
        // F0 00 00 74 00 00 06 00 00 10 F7
        return bytes[0] === 0xF0 // sysex start  -  240
            && bytes[1] === 0x00 // Manf. ID byte0   - 0
            && (bytes[2] === 0x00 || bytes[2] === 0x01) // Manf. ID byte1   - 1 or 0???
            && bytes[3] === 0x74 // Manf. ID byte2   - 116
        // && bytes[4] === 0x11 // Model Nr. FM3 - 17 
        //s&& bytes.slice(-1) === 0xF7 // sysex end 247
    }
    const isVerbose = () => verbose
    const waitForResult = async (functionID, runnable, resolver) => {
        const timeout = 1000 * 555//20 // 20sec //1000 * 60 /* 1 minute */
        let timer
        let start
        let input

        const funNameRes = F.HELPER.findFunctionName(functionID, F.FUNCTION)
        return new Promise(async (resolve, reject) => {
            const _do_resolve = (content) => {
                resolve(content)
                if (input) {
                    input.close()
                }
            }
            const _do_reject = (error) => {
                reject(error)
                if (input) {
                    input.close()
                }
            }
            try {
                if (resolver) {// only if we have a resolver we need to listen
                    if (isVerbose())
                        console.log(`*** Listening *** ${funNameRes} (${functionID})`)
                    // input = new easymidi.Input("USB MIDI Interface")
                    input = inputProvider.getInput()
                } else {
                    if (isVerbose())
                        console.log(`*** NOT Listening *** ${funNameRes} (${functionID})`)
                    _do_resolve()
                }
                timer = setInterval(() => {
                    if (Date.now() - start > timeout) {
                        clearInterval(timer)
                        const error = new Error(`TIMEOUT waiting for MIDI Sysex message for: ${functionID}/${funNameRes}`)
                        console.error(error)
                        _do_reject(error)
                        if (input)
                            input.close()
                    }
                }, 300)
                start = Date.now()

                await runnable.call()
                if (input) {
                    const onMessageBytes = async (messageBytes) => {
                        if (isVerbose())
                            console.log(`ON MIDI message: ${_UTILS_.bytesToHexString(messageBytes)}`)
                        /**
                         * 0xF0 ... =0xF7 = Sysex [command]
                         * 144 66 127= Note on [command][note][velocity]
                         * 128 66 127 = Note off [command][note][velocity]
                         * 0xC6 0x07 = Programmchange [command][programm]
                         */
                        const command = messageBytes && messageBytes[0]
                        if (command === 0xF0) {// SYSEX
                            if (isVerbose())
                                console.log(`MIDI Sysex Message: ${_UTILS_.bytesToHexString(messageBytes)}`)
                            // console.log('result:', _UTILS_.bytesToHexString(messageBytes))
                            if (!isFractalSysexResponse(messageBytes)) {
                                if (isVerbose())
                                    console.log(`Not a Fractal MIDI Sysex message: ${_UTILS_.bytesToHexString(messageBytes)}`)
                                return
                            }
                        } else {// MIDI MESSAGE
                            if (command === F.FUNCTION.PATCH * -1) {
                                // Midi patch change command
                                if (isVerbose())
                                    console.log(`MIDI Patch Change Message: ${_UTILS_.bytesToHexString(messageBytes)}`)
                            } else if (command === F.FUNCTION.PATCH * -1) {
                                // Midi patch change command
                                if (isVerbose())
                                    console.log(`MIDI Control Change Message: ${_UTILS_.bytesToHexString(messageBytes)}`)
                            } else {
                                // unsupported MIDI message response
                                if (isVerbose())
                                    console.log(`Unsupported MIDI Message Response: ${_UTILS_.bytesToHexString(messageBytes)}`)
                                return
                            }

                        }
                        if (!resolver || await resolver(messageBytes)) {
                            _do_resolve(messageBytes)
                            if (input)
                                input.close()
                        }
                    }
                    if (isEasyMidiInput(input)) {
                        input.on(
                            // 'sysex'
                            'message' // listen to all messages
                            , async (msg) => {
                                // console.log('***MSG', JSON.stringify(msg))
                                // console.log('msg.data', msg.data)
                                // console.log('input.parseMessage.toString()', input.parseMessage.toString())

                                /**
                                Input object of easymidi has been modified
                                to carry allways also the bytes in the message
                                `msg.bytes` is equal the equivalent of the standard MIDI api `msg.data`
                                 */
                                if (msg._type = 'sysex') {
                                    // {"bytes":[240,0,1,116,...32,32,0,47,247],"_type":"sysex"}
                                    onMessageBytes(msg.data)
                                    //onMessageBytes(msg.bytes)
                                } else if (msg._type = 'program') {
                                    // {"channel":0,"number":2,"_type":"program"}
                                    // onMessageBytes([F.FUNCTION.PATCH, msg.number])
                                    onMessageBytes(msg.data)
                                } else if (msg._type = 'cc') {
                                    // {"channel":0,"controller":0,"value":0,"_type":"cc"}
                                    // onMessageBytes([F.FUNCTION.CC, msg.controller, msg.value])
                                    onMessageBytes(msg.data)
                                } else if (msg.data) {
                                    onMessageBytes(msg.data)
                                } else {
                                    if (isVerbose())
                                        console.log(`MIDI Message unknown`, msg, JSON.stringify(msg, null, 2))

                                }
                            })
                    } else {
                        input.onmidimessage = (msg) => {
                            onMessageBytes(msg.data)
                        }
                    }

                }
            } catch (e) {
                console.error('waitForResult#promise', e)
                clearInterval(timer)
                _do_reject(e)
                if (input)
                    input.close()
            } finally {
            }
        })
    }

    const _TEST_ = {
        waitForResult,
        isFractalSysexResponse
    }
    const _UTILS_ = {
        /*

        from fractal
int bytesToInt(byte byte1, byte byte2){
  return (byte1 & 0x7F) | ((byte2 & 0x7F)<<7);
}
This is the reverse of the above to turn a decimal number into two bytes where x is the decimal number.

byte byte1 = (x & 0x7F);

byte byte2 = ((x >> 7) & 0x7F);
        */
        /**
         * Create the 1st byte of the EffectID
         * @param {*} value 
         * @returns 
         */
        byte1: (value) => {
            /*
              data[1] = number >> 0 & 0xff;
              data[2] = number >> 7 & 0xff;
            */
            // return value >> 0 & 127;
            const byte1 = (value & 0x7F);
            return byte1
        },
        /**
         * Create the 2nd byte of the EffectID  
         * @param {*} value 
         * @returns 
         */
        byte2: (value) => {
            // return value >> 7;
            const byte2 = ((value >> 7) & 0x7F);
            return byte2
        },
        revertByte1And2: (byte1, byte2) => {
            //return (byte2 << 8 | byte1) //??? TODO
            return (byte1 & 0x7F) | ((byte2 & 0x7F) << 7);
        },
        send: (data) => {
            if (verbose) {
                console.log('** send data hex:', _UTILS_.bytesToHexString(data))
                console.log('** send data dec:', data.join(' '))
            }
            const output = outputProvider.getOutput()
            if (isEasyMidiOutput(output)) {
                outputProvider.getOutput().send('sysex', data)
            } else {
                outputProvider.getOutput().send(data)
            }
            return data
        },
        sendSysex: (functionID, payload) => {
            /**
             * Just the bytes of the Fractal Sysex Function.
             * @param {*} bytes 
             */
            const prepareMessage = (functionID, argBytes) => {
                const createChecksum = (bytes) => {
                    let checksum;
                    for (const byte of bytes) {
                        if (0xF7 === byte)
                            break
                        // console.log(`byte:${byte}`)
                        checksum ^= byte
                    }
                    checksum = checksum & 0x7F
                    return checksum
                }

                const data = []
                data.push(// ** Systex - Start **
                    0xF0
                )
                // ** Device ID **
                data.push(// Manf. ID byte0
                    0x00)
                data.push(// Manf. ID byte1
                    0x01)
                data.push(// Manf. ID byte2
                    0x74)
                data.push(// 0x11 // Model # (FM3 = 0x11)
                    // F.DEVICE.FM3
                    selectedDevice
                )
                data.push(functionID)
                if (argBytes)
                    for (const b of argBytes) {
                        data.push(b)
                    }
                const checksum = createChecksum(data)
                data.push(checksum)
                data.push(
                    // ** Systex - End **
                    0xF7
                )
                return data
            }

            const data = prepareMessage(functionID, payload)
            if (verbose) {
                console.log('** send data hex:', _UTILS_.bytesToHexString(data))
                console.log('** send data dec:', data.join(' '))
            }
            const output = outputProvider.getOutput()
            if (isEasyMidiOutput(output)) {
                outputProvider.getOutput().send('sysex', data)
            } else {
                outputProvider.getOutput().send(data)
            }
            return data
        }
        ,
        sendPatchChange: (patch) => {
            const _p = Number.parseInt(`${patch}`)
            const output = outputProvider.getOutput()
            if (isEasyMidiOutput(output)) {
                outputProvider.getOutput().send('program', {
                    number: _p,
                    channel: 0
                })
            } else {
                outputProvider.getOutput().send(
                    /* here we must create the midi cc message for patch-change our own */
                    [
                        0xC0 // patch-change
                        , _p])
            }
            return _p
        }
        , sendBankSelect: (bank) => {
            const _b = Number.parseInt(`${bank}`)
            const output = outputProvider.getOutput()
            if (isEasyMidiOutput(output)) {
                outputProvider.getOutput().send('cc', {
                    controller: 0,
                    value: _b,
                    // channel: 0
                })
            } else {
                outputProvider.getOutput().send(
                    /* here we must create the midi cc message for bank-select our own */
                    [
                        0xB0 // continiuos-controler
                        , 0x00 // bank-select
                        , _b])
            }
            return _b
        }
        ,
        assertBoolean: (value) => {
            if (`${value}` === 'true')
                return true
            if (`${value}` === 'false')
                return false
        }
        ,
        assertEffectID: (value) => {
            let val
            if (isNaN(value) && (val = F.EFFECT[value])) {
                return val
            }
        }
        ,
        bytesToHexString: (data) => {
            if (verbose)
                console.log('DATA:', data)
            if (!data)
                return ''
            const use00xPrefix = true
            return Array.from(data)
                .map(item => ((use00xPrefix ? ' 0x' : '') + `00${(Number.parseInt(`${item || 0}`)).toString(16).toUpperCase()}`.slice(-2)))
                .join(use00xPrefix ? ', ' : ' ')
        }
    }
    let lastTempo
    const _PARSER_ = {
        QUERY_PATCH_NAME: (bytes) => {
            /**
                Returns preset name.
                Message format:
                F0 00 01 74 10 0D dd dd cs F7
                where dd dd is the preset number. To query the current preset name let dd dd = 7F 7F.
                Returns:
                F0 00 01 74 10 0D nn nn dd dd dd … cs F7;
                where nn nn is the preset number as two 7-bit MIDI bytes, LS first
                and dd dd dd … is 32 characters of name.
             */
            if (bytes[5] !== F.FUNCTION.QUERY_PATCH_NAME) {
                if (verbose)
                    console.log(`Not a query patch name MIDI Sysex message: ${bytes[5]}`)
                return
            }
            let text = bytes.slice(8, 7 + 32).map(item => String.fromCharCode(item)).join('').trim()
            if (bytes instanceof Uint8Array) {
                // In WebMidi it comes as Uint8Array
                text = new TextDecoder('utf-8').decode(Uint8Array.from(bytes.slice(8, 7 + 32)))
            }

            text = text.trim()
            return {
                number: _UTILS_.revertByte1And2(bytes[6], bytes[7]),
                name: text
            }
        },
        QUERY_SCENE_NAME: (bytes) => {
            /**
            F0 00 01 74 10 0E nn dd dd dd … cs F7;
            where nn is the scene number and dd dd dd … is 32 characters of name
             */
            if (bytes[5] !== F.FUNCTION.QUERY_SCENE_NAME) {
                if (verbose)
                    console.log(`Not a query scene name MIDI Sysex message: ${bytes[5]}`)
                return
            }

            let text
            if (bytes instanceof Uint8Array) {
                // In WebMidi it comes as Uint8Array
                text = new TextDecoder('utf-8').decode(Uint8Array.from(bytes.slice(7, 6 + 32)))
            } else {
                text = bytes.slice(7, 6 + 32).map(item => String.fromCharCode(item)).join('').trim()
            }

            return {
                number: bytes[6],
                //name: bytes.slice(7, 6 + 32).map(item => String.fromCharCode(item)).join('').trim()
                name: text
            }
        },
        TEMPO: (bytes) => {
            //0xF0,  0x00,  0x01,  0x74,  0x11,  0x14,  0x18,  0x00,  0x18,  0xF7
            //0xF0,  0x00,  0x01,  0x74,  0x11,  0x14,  0x18,  0x00,  0x18,  0xF7
            if (
                bytes[0] !== 0xF0
                , bytes[1] !== 0x00
                , bytes[2] !== 0x01
                , bytes[3] !== 0x74
                , bytes[4] !== 0x11
                , bytes[5] !== 0x14
                , bytes[9] !== 0xF7
            ) {
                if (verbose)
                    console.log(`Not a tempo MIDI Sysex message: 'F0 00 01 74 01 14 ds ds ds F7'`)
                return
            }
        },
        TEMPO_TAP: (bytes) => {
            if (
                bytes[0] !== 0xF0
                , bytes[1] !== 0x00
                , bytes[2] !== 0x01
                , bytes[3] !== 0x74
                , bytes[4] !== 0x00
                , bytes[5] !== 0x00
                , bytes[6] !== 0xF7
            ) {
                if (verbose)
                    console.log(`Not a tempo tap MIDI Sysex message: 'F0 00 01 74 00 00 F7'`)
                return
            }
            // Sent on the tempo down beat
            // F0 00 01 74 00 00 F7
            // TODO
            const diff = Date.now() - lastTempo
            if (verbose)
                console.log(`TEMPO STAT: ${diff}`)

            lastTempo = Date.now()

            return diff + 'ms'
        },
        TEMPO_MIDI: (bytes) => {
            // 0xF0,  0x00,  0x01,  0x74,  0x11,  0x10,  0xF7
            if (!(bytes[0] === 0xF0
                && bytes[1] === 0x00
                && bytes[2] === 0x01
                && bytes[3] === 0x74
                && (bytes[4] === 0x10 || bytes[4] === 0x11) // 0x10 or 0x11???
                && bytes[5] === (F.FUNCTION.TEMPO_MIDI * -1) // 0x10
                && bytes[6] === 0xF7
            )
            ) {
                if (verbose)
                    console.log(`Not a midi tempo MIDI Sysex message: ${bytes[5]}`)
                return
            }
            /*
                Sent on the tempo down beat.
                Message format:
                F0 00 01 74 10 10 F7.
                Note that no checksum is sent so as to minimize message length.
             */
            return true

        },
        BYPASS: (bytes) => {
            //ID_REVERB1  (on): F0 00 00 60 00 0A 00 00 01
            //ID_REVERB1 (off): F0 00 00 60 00 0A 00 00 00
            if (bytes[5] !== F.FUNCTION.BYPASS) {
                if (verbose)
                    console.log(`Not a bypass state MIDI Sysex message: ${bytes[5]}`)
                return
            }
            /*
            Sets and/or gets the bypass state of an effect.
            Message format:
            F0 00 01 74 10 0A id id dd cs F7.
            id id is the effect ID as two 7-bit MIDI bytes, LS first.
            dd is the bypass state (0 = engaged, 1 = bypassed).
            To query set dd = 7F.
            Returns:
            F0 00 01 74 10 0A id id dd cs F7
            where dd is the current bypass state: 0 = engaged, 1 = bypassed
             */
            // const orgVal = (bytes[6] << 8 | bytes[7])
            const orgVal = _UTILS_.revertByte1And2(bytes[6], bytes[7])
            const effectName = F.EFFECT[`${orgVal}`]
            const on = bytes[8] === 0
            if (verbose)
                console.log(`Effect: ${effectName} (${orgVal}) Status: ${on ? 'ON' : 'OFF'}`)
            // F0 00 00 74 00 00 3E 00 00
            return {
                id: effectName
                , engaged: on
            }
        },
        TUNER_STATE: (bytes) => {
            // 0xf0 0x00 0x01 0x74 0x11 0x11 0x00 0x05 0x3f 0xf7
            if (!(bytes[0] === 0xF0
                && bytes[1] === 0x00
                && bytes[2] === 0x01
                && bytes[3] === 0x74
                && (bytes[4] === 0x10 || bytes[4] === 0x11) // 0x10 or 0x11??
                && bytes[5] === (F.FUNCTION.TUNER_STATE * -1)//0x11
                && bytes[9] === 0xF7
            )
            ) {
                if (verbose)
                    console.log(`Not a tuner state MIDI Sysex message: ${bytes[5]}`)
                return
            }

            /*
            F0 00 01 74 10 11 nn ss cc F7.
            where:
            nn = note (0 – 11)
            ss = string (0 – 5, 0 = low E)
            cc = cents (offset binary, 63 = 0, 62 = -1, 64 = +1, etc.)
            Note that no checksum is sent so as to minimize message length.
            */
            const nn = bytes[6]
            const ss = bytes[7]
            const cc = bytes[8]
            const notes = 'A,Bb,B,C,Db,D,E,F,Gb,G'.split(',')
            const string = 'E,A,D,G,B,E'.split(',')
            let cents = cc === 63 ? 0 : 63 - cc
            if (verbose)
                console.log(`Tuner: String: ${string[ss]}, Note: ${notes[nn]} Cents: ${cents} `)
            return {
                string: string[ss],
                note: notes[nn],
                cents: cents
            }
        },
        GET_FIRMWARE_VERSION: (bytes) => {
            if (bytes[5] !== F.FUNCTION.GET_FIRMWARE_VERSION) {
                if (verbose)
                    console.log(`Not a firmware version MIDI Sysex message: ${bytes[5]}`)
                return
            }
            if (verbose)
                console.log(`Firmware Version: ${bytes[6]}.${bytes[7]}`)
            return `${bytes[6]}.${bytes[7]}`
        },
        CHANNEL: (bytes) => {
            if (bytes[5] !== F.FUNCTION.CHANNEL) {
                if (verbose)
                    console.log(`Not a channel MIDI Sysex message: ${bytes[5]}`)
                return
            }
            /*
            Sets and/or gets the channel of an effect.
            Message format:
            F0 00 01 74 10 0B id id dd cs F7.
            id id is the effect ID as two 7-bit MIDI bytes, LS first.
            dd is the channel (0 – 3).
            To query set dd = 7F.
            Returns:
            F0 00 01 74 10 0B id id dd cs F7
            where dd is the current channel (0 - 3).
            */
            const orgVal = _UTILS_.revertByte1And2(bytes[6], bytes[7])
            const effectName = F.EFFECT[`${orgVal}`]
            const channel = {
                channel: ['A', 'B', 'C', 'D'][bytes[8]]
                , effectID: orgVal
                , effectName: effectName
            }
            if (verbose)
                console.log(`Channel`, channel)
            return channel
        },
        SCENE: (bytes) => {
            if (bytes[5] !== F.FUNCTION.SCENE) {
                if (verbose)
                    console.log(`Not a scene MIDI Sysex message: ${bytes[5]}`)
                return
            }
            /*
            Sets and/or gets the scene.
            Message format:
            F0 00 01 74 10 0C dd cs F7.
            dd is the desired scene. To query set dd = 7F.
            Returns:
            F0 00 01 74 10 0C dd cs F7; where dd is the current scene
            */
            const result = [1, 2, 3, 4, 5, 6, 7, 8][bytes[6]]
            if (verbose)
                console.log(`Scene`, result)
            return result
        },
        STATUS_DUMP: (bytes) => {
            if (bytes[5] !== F.FUNCTION.STATUS_DUMP) {
                if (verbose)
                    console.log(`Not a status dump MIDI Sysex message: ${bytes[5]}`)
                return
            }
            const result = []
            /*
            This command requests a status dump of all effects in the current preset.
            Message format:
            F0 00 01 74 10 13 cs F7.
            Returns a variable length message:
            F0 00 01 74 10 13 <packet0> <packet1> … <packetN> cs F7
            where a packet is three bytes, id id dd, defined as follows:
            id = effect ID, 14 bits over two MIDI bytes, LS first
            dd:
            bit 0: bypass state: 0 = engaged, 1 = bypassed
            bit 3-1 channel (0-7, currently the maximum number of channels for any effect is 3).
            bit 6-4: number of channels supported for this effect (0-7).
            */
            const parsePacket = (byte1, byte2, byte3) => {
                const orgVal = _UTILS_.revertByte1And2(byte1, byte2)
                const effectName = F.EFFECT[`${orgVal}`]

                const s = byte3.toString(2)
                const bypass = Number.parseInt(`${s.slice(-1)}`, 2)
                const channel = Number.parseInt(`${s.slice(-4, -1)}`, 2)
                const channels = Number.parseInt(`${s.slice(-7, -4)}`, 2)

                return {
                    effectID: orgVal,
                    effectName: effectName,
                    bypass: bypass,
                    channel: channel,
                    channels: channels
                }
            }
            const _bytes = bytes.slice(6, -2)
            if (0 !== _bytes.length % 3) {
                console.error(`Wrong byte size for packets...`)
            }
            for (let i = 0; i < _bytes.length; i++) {
                const info = parsePacket(_bytes[i++], _bytes[i++], _bytes[i])
                result.push(info)
            }
            if (verbose)
                console.log(`Status dump`, result)
            return result
        }

    }
    const getParser = (functionIDOrName, args) => {
        let functionName = functionIDOrName
        if (!isNaN(functionIDOrName)) {
            functionName = F.HELPER.findFunctionName(functionIDOrName, F.FUNCTION)
        }
        return _PARSER_[functionName]
    }

    const _COMMAND_ = {
        SYSEX: (arg) => {// send sysex without listening
            const bytes = (arg || '')
                .trim()
                .replace(new RegExp(' ', 'ig'), ',')
                .replace(new RegExp(',,*', 'ig'), ',')
                .replace(new RegExp('  ', 'ig'), ' ')
                .split(',')
                .map(item => Number.parseInt(`0x${item}`.slice(-4)))
            _UTILS_.send(bytes)
        },
        /**
         * 
         * Parse a hex byte string to bytes and send it
         * to all parsers to check which one matches
         * @param {*} arg A string containing hex values:
         * "0xF0,  0x00,  0x01,  0x74,  0x11,  0x11,  0x01,  0x04,  0xF7"
         * "0xF0  0x00  0x01  0x74  0x11  0x11  0x01  0x04  0xF7"
         * "F0, 00, 01, 74, 10, 0D, dd, dd, cs, F7"
         * "F0 00 01 74 10 0D dd dd cs F7"
         */
        TEST_SYSEX: (arg) => {
            if (verbose) {
                console.log(`Testing SYSEX `)
                console.log(`Arg:`, arg)
            }
            const bytes = (arg || '')
                .trim()
                .replace(new RegExp(' ', 'ig'), ',')
                .replace(new RegExp(',,*', 'ig'), ',')
                .replace(new RegExp('  ', 'ig'), ' ')
                .split(',')
                .map(item => Number.parseInt(`0x${item}`.slice(-4)))
            // const bytes = (arg || '').replace(new RegExp(', ', 'ig'), '').replace(new RegExp(',', 'ig'), '').split(' ').map(hex => Number.parseInt(hex))
            if (verbose) {
                console.log(`Bytes:`, bytes)
            }
            Object.values(_PARSER_).forEach(async (parser, index) => {
                let res = await parser(bytes)
                if (res) {
                    if (verbose)
                        console.log(`***RES from parser '${Object.keys(_PARSER_)[index]}':`, res)
                } else {

                }
            })
        }
        , GET_FIRMWARE_VERSION: () => _UTILS_.sendSysex(F.FUNCTION.GET_FIRMWARE_VERSION)
        //F0 00   01    74     10     11          dd              cs   F7.
        // (XOC CHECKSUM FM3 - 
        // ON: 0xF0,  0x00,  0x01,  0x74,  0x11,  0x11,  0x01,  0x04,  0xF7
        // OFF: 0xF0,  0x00,  0x01,  0x74,  0x11,  0x11,  0x00,  0x05,  0xF7
        , TUNER_ON: () => _UTILS_.sendSysex(F.FUNCTION.TUNER_ON, [0x01])
        , TUNER_OFF: () => _UTILS_.sendSysex(F.FUNCTION.TUNER_ON, [0x00])
        /**
         * e.g. <code>_BYPASS_(EFF.ID_DELAY1, true)</code>
         * @param {*} effectID 
         * @param {*} on 
         * @returns 
         */
        , _BYPASS_: (effectID, on) => {
            const _effectID = _UTILS_.assertEffectID(effectID)
            _UTILS_.sendSysex(F.FUNCTION.BYPASS, [
                _UTILS_.byte1(_effectID),
                _UTILS_.byte2(_effectID),
                (_UTILS_.assertBoolean(on) ? 0x00 : 0x01)])
        }
        , _BYPASS_STATE_: (effectID) => {
            const _effectID = _UTILS_.assertEffectID(effectID)
            _UTILS_.sendSysex(F.FUNCTION.BYPASS, [
                _UTILS_.byte1(_effectID),
                _UTILS_.byte2(_effectID),
                0x7F])
        }
        , BYPASS: (effectID, on) => {
            if ('true' !== `${on}` && 'false' !== `${on}`) {
                return _COMMAND_._BYPASS_STATE_(effectID)
            }
            return _COMMAND_._BYPASS_(effectID, on)
        }
        , QUERY_PATCH_NAME: (presetNumber) => {
            // F0 00 01 74 10 0D dd dd cs F7
            let presetN = [0x7F, 0x7F]
            if (presetNumber >= 0) {
                presetN[0] = _UTILS_.byte1(presetNumber)
                presetN[1] = _UTILS_.byte2(presetNumber)
            }
            _UTILS_.sendSysex(F.FUNCTION.QUERY_PATCH_NAME, presetN)
        }
        , QUERY_SCENE_NAME: (sceneNumber) => {
            // F0 00 01 74 10 0E dd cs F7; where dd is desired scene.
            let sceneN = [0x7F]
            if (sceneNumber >= 0) {
                sceneN = [sceneNumber]
            }
            _UTILS_.sendSysex(F.FUNCTION.QUERY_SCENE_NAME, sceneN)
        }
        , CHANNEL: (effectID, channel /* 0=A, 1=B, 2=C, 3=D */) => {
            const _effectID = _UTILS_.assertEffectID(effectID)
            // F0 00 01 74 10 0B id id dd cs F7.
            _UTILS_.sendSysex(F.FUNCTION.CHANNEL, [
                (channel >= 0 && channel < 4 ? channel : 0x7F)
            ])
        }
        , SCENE: (scene /* 0=1, 1=2, 2=3, 3=4, 4=5, 5=6, 6=7, 7=8 */) => {
            // F0 00 01 74 10 0B id id dd cs F7.
            _UTILS_.sendSysex(F.FUNCTION.SCENE, [(scene >= 0 && scene < 8 ? scene : 0x7F)])
        }
        , TEMPO: (tempo) => {
            console.error(`NOT FULLY IMPLEMENTED YET!!!! just sets the tempo to 0`)
            /*
            Sets/gets the Tempo.
            Message format:
            F0 00 01 74 10 14 dd dd cs F7;
            where dd dd is the desired tempo as two 7-bit MIDI bytes, LS first.
            To query the tempo let dd dd = 7F 7F.
            */

            // //240    0       1      116    17     20     120,  0      0       247
            const num = Number.parseInt(tempo)
            const payload = tempo ? [
                _UTILS_.byte1(num),
                _UTILS_.byte2(num),
            ] : [0x7F, 0x7F]
            // set-get tempo
            _UTILS_.sendSysex(F.FUNCTION.TEMPO, [payload])
        }
        , TEMPO_TAP: () => {
            /*
            Remotely taps the Tempo button.
            Message format:
            F0 00 01 74 10 10 cs F7.
            */
            _UTILS_.sendSysex(F.FUNCTION.TEMPO_TAP, [])
        }
        , TEMPO_MIDI: () => { }
        , STATUS_DUMP: () => {
            _UTILS_.sendSysex(F.FUNCTION.STATUS_DUMP, [])
        }
        , TUNER_STATE: () => { }
        , PATCH: (patch) => _UTILS_.sendPatchChange(patch)
        , BANK: (bank) => _UTILS_.sendBankSelect(bank)
        , PROGRAM: (patch) => {
            const _p = Number.parseInt(patch)
            const _patch = _p % 128
            const _bank = (_p - _patch) / 128
            _UTILS_.sendBankSelect(_bank)
            _UTILS_.sendPatchChange(_patch)
        }
        , G_BLOCK_PARAMETER_VALUE: (effectID, parameterID, value) => {
            // https://wiki.fractalaudio.com/wiki/index.php?title=MIDI_SysEx#PRESET_BLOCKS_DATA
            /*
0x02 Function ID (0x02)
0xdd effect ID bits 6-0
0xdd effect ID bits 13-7
0xdd parameter ID bits 6-0
0xdd parameter ID bits 13-7
0xdd parameter value bits 6-0
0xdd parameter value bits 13-7
0xdd parameter value bits 15-14
0x00 0=query value, 1=set value
0xdd Checksum
0xF7 SysEx End
            */
            // Bypassing/Engaging a Block is also done with this function with parameter 255. Send the value 0 to Engage, 1 to Bypass.
            // 0x00 0=query value, 1=set value
            const _effectID = _UTILS_.assertEffectID(effectID)
            F.FUNCTION.G_BLOCK_PARAMETER_VALUE = 0x02

            const query_or_set_value = value && value === 1 ? value : 0
            _UTILS_.sendSysex(F.FUNCTION.G_BLOCK_PARAMETER_VALUE, [
                , _UTILS_.byte1(_effectID)
                , _UTILS_.byte2(_effectID)
                , 0x00 //parameter ID bits 6-0
                , 0x00 //parameter ID bits 13-7
                , 0x00 //parameter value bits 6-0
                , 0x00 //parameter value bits 13-7
                , 0x00 //parameter value bits 15-14
                , query_or_set_value])

            // response: 0xF0,  0x00,  0x01,  0x74,  0x11,  0x64,  0x02,  0x05,  0x77,  0xF7
            // 
        }
    }

    return {
        _TEST_,
        _UTILS_,
        _PARSER_,
        _COMMAND_,
        getParser,
        verbose
    }
}

module.exports = API