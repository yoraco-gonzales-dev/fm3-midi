

const findMIDIDevice_USB_MIDI_Interface = async () => {
    var deviceName = 'USB MIDI Interface'
    const midiAccess = await navigator.requestMIDIAccess({ sysex: true, software: false })
    const midiDevice = {
        output: ((Array.from(midiAccess.outputs.entries()).find(entry => (entry || [])[1].name === deviceName)) || [])[1]
        , input: ((Array.from(midiAccess.inputs.entries()).find(entry => (entry || [])[1].name === deviceName)) || [])[1]
    }
    midiDevice.isInOutAvailable = () => { return midiDevice.input && midiDevice.output }
    // console.log(`findMIDIDevice_USB_MIDI_Interface - midiDevice`, midiDevice)
    return midiDevice
}

const findMIDIDevices = async () => {
    const midiAccess = await navigator.requestMIDIAccess({ sysex: true, software: false })
    const midiDevice = {
        output: Array.from(midiAccess.outputs.entries().map(entry => (entry || [])[1]))
        , input: Array.from(midiAccess.inputs.entries().map(entry => (entry || [])[1]))
    }
    midiDevice.isInOutAvailable = () => { return midiDevice.input && midiDevice.output }
    // console.log(`findMIDIDevices - midiDevices`, midiDevice)
    return midiDevice
}

/*

var a = 'Axe-Fx III MIDI IN'.toLowerCase().split('')
var b = 'Axe-FX III MIDI OUT'.toLowerCase().split('')

var c = a.map((item,index)=>b[index]!==item?item:null).join('')
*/

const findMIDIDeviceById = async (inputId, outputId) => {
    const midiAccess = await navigator.requestMIDIAccess({ sysex: true, software: false })
    const midiDevice = {
        output: outputId ? ((Array.from(midiAccess.outputs.entries()).find(entry => (entry || [])[1].id === outputId)) || [])[1] : null
        , input: inputId ? ((Array.from(midiAccess.inputs.entries()).find(entry => (entry || [])[1].id === inputId)) || [])[1] : null
    }
    midiDevice.isInOutAvailable = () => { return midiDevice.input && midiDevice.output }
    // console.log(`findMIDIDeviceById - midiDevice`, midiDevice)
    return midiDevice
}

const findMIDIDeviceByName = async (deviceName) => {
    const midiAccess = await navigator.requestMIDIAccess({ sysex: true, software: false })
    const midiDevice = {
        output: ((Array.from(midiAccess.outputs.entries()).find(entry => (entry || [])[1].name === deviceName)) || [])[1]
        , input: ((Array.from(midiAccess.inputs.entries()).find(entry => (entry || [])[1].name === deviceName)) || [])[1]
    }
    midiDevice.isInOutAvailable = () => { return midiDevice.input && midiDevice.output }
    // console.log(`findMIDIDeviceByName - midiDevice`, midiDevice)
    return midiDevice
}
/**
 * 
 * 
 * 
 */
const getMIDIDeviceGrouped = async () => {
    // TODO devices that are not equally prensent as midi input and midi output are not listed!!!

    const _mDevices = await findMIDIDevices()
    const outputsName = {}
    _mDevices.output.forEach(output => outputsName[output.name] = output)
    const inputsName = {}
    _mDevices.input.forEach(input => inputsName[input.name] = input)

    const displayName = {}

    const getNameDiff = (name1, name2) => {
        var a = /*'Axe-Fx III MIDI IN'*/name1.toLowerCase().split(' ')
        var b = /*'Axe-FX III MIDI OUT'*/name2.toLowerCase().split(' ')
        var c = a.map((item, index) => b[index] !== item ? item : null)
        var d = b.map((item, index) => a[index] !== item ? item : null)
        return {
            diff1: c,
            diff2: d
        }
    }

    for (let outputName of Object.keys(outputsName)) {
        // "MIDI DEVICE NAME out"
        const output = outputsName[outputName]
        for (let input of Object.values(inputsName)) {

            let valid = output.name === input.name
            let sharedName = output.name
            if (!valid) {
                // "MIDI DEVICE NAME in"
                const diff = getNameDiff(output.name, input.name)
                // console.log(`DIFFF`, diff)
                // "in"
                const diff1 = diff.diff1.filter(item => !!item).join('')
                // console.log(`DIFFF1`, diff1)
                // "out"
                const diff2 = diff.diff2.filter(item => !!item).join('')
                // console.log(`DIFFF1`, diff1)

                const validDiff1 = output.name.toLowerCase().endsWith(` ${diff1}`)
                const validDiff2 = input.name.toLowerCase().endsWith(` ${diff2}`)

                //console.log(`***DIFFING:: ${output.name} ~= ${input.name}`, 'diff1:', diff1, 'diff2:', diff2)
                valid = validDiff1 && validDiff2
                //console.log(`***DIFFING::valid: ${valid}`)
                if (valid)
                    sharedName = `${input.name}`.slice(0, -1 * ` ${diff2}`.length)
            } else {
                //console.log(`***TEXTMATCH:: ${output.name} ~= ${input.name}`)
            }
            if (valid) {
                displayName[sharedName] = {
                    name: `${sharedName} (in/out)`,
                    sharedName: sharedName,
                    input: input,
                    output: output,
                    inputID: input.id,
                    outputID: output.id
                }
                displayName[sharedName].isInOutAvailable = () => { return displayName[sharedName].input && displayName[sharedName].output }
                break
            }
        }
    }

    //console.log(`****displayName`, displayName)

    return displayName
}

const resolveMIDIDeviceFromGroup = async (name) => {
    const deviceList = await getMIDIDeviceGrouped()
    let found = deviceList[name]
    if (!found) {
        const deviceListByName = {}
        Object.values(deviceList).forEach(device => deviceListByName[device.name] = device)
        found = deviceListByName[name]
    }
    return found
}