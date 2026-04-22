const parseArgs = (argsSettings) => {
    const path = require('path')
    /*
        const argsSettings = {
            description: `Search url for API backends`,
            args: [
                { name: ['--url', '-u'], description: 'Set the url to discovery API backends from', isFlag: false, required: true }
                ,
            ]
            , examples: [`${path.basename(process.argv[1])} --url https://my.backend.de`]
        }
    */

    const args = process.argv.slice(2)
    const argsValues = {}
    const argsconf = []
    argsconf.push(...argsSettings.args)
    const argHelp = { name: ['--help', '-h'], description: 'Show this help', isFlag: true }
    argsconf.push(argHelp)
    const showHelp = !args.length || args.find(item => -1 !== argHelp.name.indexOf(item))
    if (showHelp) {
        const text = []
        text.push(argsSettings.description)
        text.push(``)
        text.push(`Usage:`)
        text.push(`\t${path.basename(process.argv[1])} <options>`)
        if ((argsSettings.examples || []).length) {
            text.push(`Options:`)
            for (const a of argsSettings.args) {
                text.push(`\t${(Array.isArray(a.name) ? a.name : [a.name]).join(',')}   : ${a.description}`)
            }
        }
        if ((argsSettings.examples || []).length) {
            text.push(``)
            text.push(`Examples:`)
            for (const example of argsSettings.examples) {
                text.push(`\t${example}`)
            }
        }
        console.log(text.join(`\n`))
        process.exit(-1)
    }
    const argsmap = {}
    argsconf.forEach(item => {
        ; (Array.isArray(item) ? item : [item]).forEach(name => {
            argsmap[name] = item
        })
    })

    for (let i = 0; i < args.length; i++) {
        const a = args[i]
        const _a = argsmap[a]
        if (_a) {
            const argName = Array.isArray(_a.name) ? _a.name[0] : _a.name
            if (_a.isFlag) {
                argsValues[argName] = true
            } else {
                argsValues[argName] = args[++i]
            }
        } else if (a.startsWith('-')) {
            // decide what to do with unkonwn args
            const val = args[++i]
            argsValues[a] = typeof val !== 'undefined' ? val : true
        } else {
            // decide what to do with unnamed positional args
            argsValues[i] = a
        }
    }

    const requiredArgs = argsconf.filter(item => item.required)
    for (const item of requiredArgs) {
        const keys = Array.isArray(item.name) ? item.name : [item.name]
        const found = Object.keys(argsValues).find(key => -1 !== keys.indexOf(key))
        if (!found) {
            throw Error(`Missing required argument '${keys.join(', ')}'`)
        }
    }

    Object.keys(argsValues).forEach(key => {
        const val = argsValues[key]
        delete argsValues[key]
        const n = key.replace('-', '').replace('-', '')
        argsValues[n] = val
    })
    return argsValues
}
/*
const argsSettings = {
    description: `Search url for API backends`,
    args: [
        { name: '--url', description: 'Set the url to discovery API backends from', isFlag: false, required: true }
        ,
        { name: '--delay', description: 'Set the delay time in millis to wait after every request', isFlag: false, required: true }
        ,
        { name: '--firstFinding', description: 'Stop on first finding', isFlag: true, required: false }
        ,
    ]
    , examples: [`${path.basename(process.argv[1])} --url https://my.backend.de`]
}
const argsOptions = parseArgs(argsSettings)
*/
module.exports = {
    parse: parseArgs
}