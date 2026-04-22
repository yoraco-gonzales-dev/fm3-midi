class FAMidiClient {
    F = require('./FractalMIDI')
    __API__ = require('./api')
    _API_

    input
    output
    verbose
    constructor(input, output, fasDevice, verbose) {
        this.verbose = verbose
        this.input = input
        this.output = output

        const deviceIDMap = {
            'AXEFXIII': this.F.DEVICE['Axe-Fx III'],
            'FM3': this.F.DEVICE.FM3,
            'FM9': this.F.DEVICE.FM9
        }
        const fasDeviceID = deviceIDMap[fasDevice] || this.F.DEVICE.FM3

        this._API_ = this.__API__({ getOutput: () => this.output }, { getInput: () => this.input }, fasDeviceID, verbose)
    }

    async #_send(args, listen = true) {
        const F = this.F
        const API = this._API_
        let result
        if (!args.length)
            throw new Error(`Min 1 argument required!`)

        const functionID = args[0]
        let funName = args[0]
        if (isNaN(functionID)) {

        } else {
            funName = F.HELPER.findFunctionName(functionID, F.FUNCTION)
        }

        const fun = API._COMMAND_[funName]
        if (!fun) {
            throw new Error(`Unknown API function '${functionID}' -> '${funName}'`)
        }

        // Prepare args command
        const params = args.slice(1)
        // console.log(`Run '${funName}' "fun.apply(fun, [${params.join(', ')}])"`)
        const funRun = fun.bind(fun, ...params)


        return new Promise(async (resolve, reject) => {
            // Get parser if any
            let resolver
            let parserRes
            if (!listen) {
                if (this.verbose)
                    console.log(`NO LISTENING WANTED FOR '${funName}'`)
                resolve()
            } else if (!(parserRes = API.getParser(funName, params))) {
                if (this.verbose)
                    console.log(`NO PARSER FOUND FOR '${funName}'`)
                resolve()
            } else {
                // Start listener mit command to run
                resolver = async (result) => {
                    const resultRes = await parserRes(result)
                    if (typeof resultRes !== 'undefined' && null !== resultRes) {
                        // console.log(`*** resultRes`, resultRes)
                        resolve(resultRes)
                        return true // we're done scanning MIDI Sysex messages
                    }
                    return false // continue scanning MIDI Sysex messages
                }
            }

            try {
                result = await API._TEST_.waitForResult(F.FUNCTION[funName], funRun, resolver)
                if (this.verbose)
                    console.log(`result`, result)
            } catch (e) {
                console.error(`result-error:`, e)
                reject(e)
            }
        })

    }

    async send(...args) {
        return this.#_send(args)
    }

    async sendNoListen(...args) {
        return this.#_send(args, false)
    }

    static isMIDITempo(bytes) {
        const __API__ = require('./api')
        return __API__()._PARSER_.TEMPO_MIDI(bytes)
    }
}

module.exports = FAMidiClient