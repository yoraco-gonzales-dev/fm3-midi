
const settingsStore = (() => {
    const _get = (name) => {
        const val = localStorage?.getItem(name)
        return JSON.parse(val)
    }
    const _set = (name, value) => {
        if (null == value || typeof (value) === 'undefined')
            return localStorage?.removeItem(name)
        return localStorage?.setItem(name, JSON.stringify(value))
    }
    return {
        getFasDevice: () => _get('fasDevice')
        , setFasDevice: (value) => _set('fasDevice', value)
        , getMIDIDevice: () => _get('fasMIDIDevice')
        , setMIDIDevice: (value) => _set('fasMIDIDevice', value)
    }
})()

const globalVerbose = false
const autoSelectIfSingleDevice = false // chrashes currently

const reduceINOUT2SingleEntry = true
const globalMidiDevices = { input: null, output: null, name: '' }
// init from localstorage
const loadMidiDeviceFromLocalStorage = async () => {
    let mDevice
    const storedDevice = settingsStore.getMIDIDevice()
    if (storedDevice) {
        mDevice = await findMIDIDeviceById(storedDevice.inputID, storedDevice.outputID)
        if (mDevice) {
            globalMidiDevices.input = mDevice.input
            globalMidiDevices.output = mDevice.output
            globalMidiDevices.name = storedDevice.name
            Array.from(document.querySelector('.deviceContainerInput select')?.options).forEach(item => {
                item.selected = item.value === globalMidiDevices.name
            })
        }
    }
    const selectedDevice = await getSelectedMIDIDevice()
    return {
        mDevice, storedDevice, selectedDevice
    }
}
const getSelectedMIDIDevice = async () => {
    let mDevice
    if (reduceINOUT2SingleEntry) {
        mDevice = await resolveMIDIDeviceFromGroup(globalMidiDevices.name)
    } else {
        mDevice = await findMIDIDeviceById(globalMidiDevices.input?.id, globalMidiDevices.output?.id)
    }
    if (mDevice) {
        mDevice.$fasDevice = getGlobalFasDevice()
        settingsStore.setMIDIDevice(mDevice)
    }
    return mDevice
}

let globalFasDevice
const getGlobalFasDevice = () => {
    if (!globalFasDevice) {
        const loc = new URL(window.location)
        const fasDevices = ['FM3', 'FM9', 'AXEFXIII']
        const defaultFASDevice = fasDevices[0]
        if (window.location.search.includes('fasDevice')) {
            let _globalFasDevice = loc.searchParams.get('fasDevice') || ''
            let ix
            if (-1 !== (ix = fasDevices.indexOf(_globalFasDevice.toUpperCase()))) {
                globalFasDevice = fasDevices[ix]
                settingsStore.setFasDevice(globalFasDevice)
            }
        }
        if (!globalFasDevice) {
            loc.searchParams.delete('fasDevice')
            loc.searchParams.append('fasDevice', settingsStore.getFasDevice() || defaultFASDevice)
            console.log('loc', loc)
            window.location = loc
        }
    }
    return globalFasDevice
}
globalFasDevice = getGlobalFasDevice()

const updateGlobalFasDevice = (fasDevice) => {
    const deviceName = document.querySelector('.deviceName')

    deviceName.classList.remove('FM3')
    deviceName.classList.remove('FM9')
    deviceName.classList.remove('AXEFXIII')
    if ('AXEFXIII' === fasDevice) {
        deviceName.classList.add('AXEFXIII')
    } else if ('FM3' === fasDevice) {
        deviceName.classList.add('FM3')
    } else if ('FM9' === fasDevice) {
        deviceName.classList.add('FM9')
    }

}

const startDevicePanel = async () => {
    //console.log(`***startDevicePanel`, new Error(`Call stack`).stack)

    const patchNameElement = document.querySelector('.patchName')
    if (patchNameElement) {
        patchNameElement.innerHTML = `
<span class="patchNameTitle"><span class="patchNameTitleNum">[###]</span><span class="patchNameTitleText">RE-CONNECT</span></span>
`
    }
    const actionButtons = document.querySelector('.bypassStates')
    if (actionButtons)
        actionButtons.innerHTML = `<h3>Effect blocks:</h3>`
    const sceneNameElement = document.querySelector('.sceneName')
    if (sceneNameElement) {
        sceneNameElement.innerHTML = `
<span class="sceneNameTitle"><span class="sceneNameTitleNum">[###]</span><span class="sceneNameTitleText">....................ongoing...........................................................</span></span>
`
    }
    const sceneNames = document.querySelector('.sceneNames')
    if (sceneNames)
        sceneNames.innerHTML = ''
    let controls = document.querySelector('.deviceDisplay .controls')
    if (controls)
        controls.innerHTML = ''



    const initBypassState = async () => {
        const actionButtons = document.querySelector('.bypassStates')
        actionButtons.innerHTML = `<h3>Effect blocks:</h3>`

        const midiDevice = await getSelectedMIDIDevice()
        const F = require('./FractalMIDI')

        const stateDump = midiDevice?.isInOutAvailable() ? await new FAMidiClient(midiDevice.input, midiDevice.output, globalFasDevice, globalVerbose).send("STATUS_DUMP") : []
        const bypassStates = {}
        stateDump.forEach(item => bypassStates[item.effectName] = item)

        Object.keys(F.EFFECT)
            .filter(item => !item.match(new RegExp('^[\\d]*$')))
            //.filter((item, index) => index > 10 && index < 20)
            .filter(item => bypassStates.hasOwnProperty(item))
            .forEach(async (key) => {
                const button = document.createElement('button')
                button.$_effectID = key
                button.$_state = bypassStates[button.$_effectID]

                button.$_effectDisplayString = key.replace('ID_', '').toLowerCase()
                    .replace(new RegExp('(\\d)*$'), ' $1')
                    .replace(new RegExp('(^[A-Z])', 'i'), (x, y, index) => {
                        return index === 0 ? x.toUpperCase() : x.toLowerCase();
                    })

                button.classList.add('effect')
                const channel = ['A', 'B', 'C', 'D'][button.$_state.channel]
                const title = `${button.$_effectDisplayString} <em title="Channel ${channel}">${channel}</em>`
                button.innerHTML = title

                button.$_engaged = 0 === button.$_state.bypass
                button.setAttribute('data-effect-block', button.$_effectID)
                button.classList.add(button.$_effectID)

                button.$_updateState = () => {
                    if (button.$_engaged) {
                        button.classList.add('effectON')
                        button.classList.remove('effectOFF')
                    } else {
                        button.classList.remove('effectON')
                        button.classList.add('effectOFF')
                    }
                }
                button.$_updateState()
                button.addEventListener('click', async (event) => {
                    const on = !!!button.$_engaged
                    // IMPORTANT: we use `sendNoListen` because waiting for a response causes freezing the app
                    // set state
                    await new FAMidiClient(midiDevice.input, midiDevice.output, globalFasDevice, globalVerbose).sendNoListen("BYPASS", button.$_effectID, on)
                    // query state
                    await new FAMidiClient(midiDevice.input, midiDevice.output, globalFasDevice, globalVerbose).sendNoListen("BYPASS", button.$_effectID)
                    button.$_engaged = on
                    button.$_updateState()
                })
                actionButtons.appendChild(button)
            })
    }

    try {
        await initBypassState()
    } catch (error) {
        console.error('initBypassState', error)
    }

    const initPatchName = async () => {
        // patch name
        const patchNameElement = document.querySelector('.patchName')
        patchNameElement.innerHTML = ''
        patchNameElement.$_addNavigation = () => {
            const button1 = document.createElement('span')
            const button2 = button1.cloneNode()
            button1.appendChild(document.createTextNode('Prev'))
            button2.appendChild(document.createTextNode('Next'))
            button1.classList.add('patchPrev')
            button2.classList.add('patchNext')
            button1.addEventListener('click', async () => {
                if (patchNameElement.$_midiDevice?.isInOutAvailable()) {
                    patchNameElement.$_patchName.number--
                    await new FAMidiClient(patchNameElement.$_midiDevice.input, patchNameElement.$_midiDevice.output, globalFasDevice, globalVerbose).send("PROGRAM", patchNameElement.$_patchName.number)
                }
            })
            button2.addEventListener('click', async () => {
                if (patchNameElement.$_midiDevice?.isInOutAvailable()) {
                    patchNameElement.$_patchName.number++
                    await new FAMidiClient(patchNameElement.$_midiDevice.input, patchNameElement.$_midiDevice.output, globalFasDevice, globalVerbose).send("PROGRAM", patchNameElement.$_patchName.number)
                }
            })

            const title = document.createElement('span')
            const title_1 = document.createElement('span')
            title_1.classList.add('patchNameTitleNum')

            title_1.appendChild(document.createTextNode(`000${patchNameElement.$_patchName?.number || ''}`.slice(-3)))

            const title_2 = document.createElement('span')
            title_2.classList.add('patchNameTitleText')
            if (patchNameElement.$_patchName?.number === -999) {
                title_2.innerHTML = patchNameElement.$_patchName?.name || ''
            } else {
                title_2.appendChild(document.createTextNode(patchNameElement.$_patchName?.name || ''))
            }

            title.classList.add('patchNameTitle')
            title.appendChild(title_1)
            title.appendChild(title_2)
            const label = document.createElement('span')
            label.appendChild(document.createTextNode('Patch:'))
            label.classList.add('patchNameLabel')
            patchNameElement.innerHTML = ''
            patchNameElement.appendChild(title)
            patchNameElement.prepend(button1)
            patchNameElement.prepend(label)
            patchNameElement.append(button2)
        }
        patchNameElement.updateContent = () => {
            patchNameElement.$_addNavigation()
        }
        patchNameElement.$_queryPatchName = async () => {
            patchNameElement.$_midiDevice = await getSelectedMIDIDevice()
            if (patchNameElement.$_midiDevice?.isInOutAvailable()) {
                const patchName = await new FAMidiClient(patchNameElement.$_midiDevice.input, patchNameElement.$_midiDevice.output, globalFasDevice, globalVerbose).send("QUERY_PATCH_NAME")
                console.log(`PATCHNAME:${patchName?.name}`, patchName)
                patchNameElement.$_patchName = patchName
            } else {
                patchNameElement.$_patchName = {
                    name: 'Not connected',
                    number: -999
                }
            }
            patchNameElement.updateContent()
        }

        await patchNameElement.$_queryPatchName()
    }

    try {
        await initPatchName()
    } catch (error) {
        console.error('initPatchName', error)
    }

    const initSceneName = async () => {
        // scene name
        const sceneNameElement = document.querySelector('.sceneName')
        sceneNameElement.innerHTML = ''
        sceneNameElement.$_addNavigation = () => {
            const button1 = document.createElement('span')
            const button2 = button1.cloneNode()
            button1.appendChild(document.createTextNode('Prev'))
            button2.appendChild(document.createTextNode('Next'))
            button1.classList.add('scenePrev')
            button2.classList.add('sceneNext')
            button1.addEventListener('click', async () => {
                if (sceneNameElement.$_midiDevice?.isInOutAvailable()) {
                    sceneNameElement.$_sceneName.number--
                    console.log(`button1 sceneNameElement.$_sceneName.number`, sceneNameElement.$_sceneName.number)
                    await new FAMidiClient(sceneNameElement.$_midiDevice.input, sceneNameElement.$_midiDevice.output, globalFasDevice, globalVerbose).send("SCENE", sceneNameElement.$_sceneName.number)
                    await sceneNameElement.$_querySceneName()

                    // get actual block states
                    await initBypassState()
                }
            })
            button2.addEventListener('click', async () => {
                if (sceneNameElement.$_midiDevice?.isInOutAvailable()) {
                    sceneNameElement.$_sceneName.number++
                    console.log(`button2 sceneNameElement.$_sceneName.number`, sceneNameElement.$_sceneName.number)
                    await new FAMidiClient(sceneNameElement.$_midiDevice.input, sceneNameElement.$_midiDevice.output, globalFasDevice, globalVerbose).send("SCENE", sceneNameElement.$_sceneName.number)
                    await sceneNameElement.$_querySceneName()

                    // get actual block states
                    await initBypassState()
                }
            })

            const title = document.createElement('span')
            const title_1 = document.createElement('span')
            title_1.classList.add('sceneNameTitleNum')
            title_1.appendChild(document.createTextNode('[' + `000${sceneNameElement.$_sceneName?.number || ''}`.slice(-3) + `]`))
            const title_2 = document.createElement('span')
            title_2.classList.add('sceneNameTitleText')
            title_2.appendChild(document.createTextNode(sceneNameElement.$_sceneName?.name || ''))
            title.classList.add('sceneNameTitle')
            title.appendChild(title_1)
            title.appendChild(title_2)
            const label = document.createElement('span')
            label.appendChild(document.createTextNode('Scene:'))
            label.classList.add('sceneNameLabel')
            sceneNameElement.innerHTML = ''
            sceneNameElement.appendChild(title)
            sceneNameElement.prepend(button1)
            sceneNameElement.prepend(label)
            sceneNameElement.append(button2)

        }
        sceneNameElement.updateContent = () => {
            sceneNameElement.$_addNavigation()
        }
        sceneNameElement.$_querySceneName = async () => {
            sceneNameElement.$_midiDevice = await getSelectedMIDIDevice()
            if (sceneNameElement?.$_midiDevice?.isInOutAvailable()) {
                const sceneName = await new FAMidiClient(sceneNameElement.$_midiDevice.input, sceneNameElement.$_midiDevice.output, globalFasDevice, globalVerbose).send("QUERY_SCENE_NAME")
                console.log(`SCENENAME:${sceneName?.name}`, sceneName)
                sceneNameElement.$_sceneName = sceneName
            } else {
                sceneNameElement.$_sceneName = {
                    name: 'Connect device via MIDI/USB cable',
                    number: -999
                }
            }
            sceneNameElement.updateContent()


            const sceneNames = document.querySelector('.sceneNames')
            if (sceneNames && sceneNames.$_setActiveScene)
                sceneNames.$_setActiveScene(sceneNameElement.$_sceneName.number)
        }

        await sceneNameElement.$_querySceneName()
    }

    try {
        await initSceneName()
    } catch (error) {
        console.error('initSceneName', error)
    }

    const initSceneNames = async () => {
        const sceneNames = document.querySelector('.sceneNames')
        sceneNames.innerHTML = ''

        sceneNames.$_midiDevice = await getSelectedMIDIDevice()

        const wait = () => new Promise((resolve, reject) => { setTimeout(resolve, 0) })

        if (sceneNames?.$_midiDevice?.isInOutAvailable()) {
            const currentScene = await new FAMidiClient(sceneNames.$_midiDevice.input, sceneNames.$_midiDevice.output, globalFasDevice, globalVerbose).send("QUERY_SCENE_NAME")
            console.log(`CURRRENT SCENE:${currentScene?.name}`, currentScene)
            await wait()


            const scenesRowT = document.createElement('span')

            scenesRowT.classList.add('scenesRow')
            const rows = []
            for (let i = 0; i < 8; i++) {
                console.log(`QUERY SCENENAME [${i}]...`)
                const sceneName = await new FAMidiClient(sceneNames.$_midiDevice.input, sceneNames.$_midiDevice.output, globalFasDevice, globalVerbose).send("QUERY_SCENE_NAME", i)
                console.log(`SCENENAME[${i}]::${sceneName?.name}`, sceneName)
                const scenesRow = scenesRowT.cloneNode()
                scenesRow.$_sceneIndex = i
                scenesRow.$_sceneName = sceneName
                scenesRow.$_sceneNumber = sceneName?.number
                scenesRow.$_sceneSelected = sceneName?.number === currentScene.number


                scenesRow.setAttribute('data-scene-index', scenesRow.$_sceneIndex)
                scenesRow.setAttribute('data-scene-name', scenesRow.$_sceneName.name)
                scenesRow.setAttribute('data-scene-number', scenesRow.$_sceneNumber)
                if (scenesRow.$_sceneSelected)
                    scenesRow.setAttribute('data-scene-selected', scenesRow.$_sceneSelected)


                scenesRow.innerHTML = `<span class="scenesNumber">${scenesRow.$_sceneName.number + 1}</span><span class="scenesName">${scenesRow.$_sceneName.name}</span>`

                rows.push(scenesRow)


                scenesRow.addEventListener('click', async (event) => {
                    const sceneNum = Number.parseInt(scenesRow.getAttribute('data-scene-number'))
                    const sceneNameElement = document.querySelector('.sceneName')
                    await new FAMidiClient(sceneNames.$_midiDevice.input, sceneNames.$_midiDevice.output, globalFasDevice, globalVerbose).send("SCENE", sceneNum)
                    await sceneNameElement.$_querySceneName()
                    sceneNames.$_setActiveScene(sceneNum)
                    // get actual block states
                    await initBypassState()
                })

                await wait()
            }

            sceneNames.innerHTML = ''
            rows.forEach(scenesRow => sceneNames.appendChild(scenesRow))

        }


        sceneNames.$_setActiveScene = (currentSceneNumber) => {
            Array.from(sceneNames.querySelectorAll('[data-scene-number]')).forEach(scenesRow => {
                const num = Number.parseInt(scenesRow.getAttribute('data-scene-number'))
                scenesRow.removeAttribute('data-scene-selected')
                scenesRow.$_sceneSelected = num === currentSceneNumber
                if (scenesRow.$_sceneSelected)
                    scenesRow.setAttribute('data-scene-selected', scenesRow.$_sceneSelected)

            })

        }

    }

    try {
        await initSceneNames()
    } catch (error) {
        console.error('initSceneNames', error)
    }


    const initControls = () => {

        const deviceDisplay = document.querySelector('.deviceDisplay')
        let controls = deviceDisplay.querySelector('.controls')
        if (!controls) {
            controls = document.createElement('span')
            controls.classList.add('controls')
            deviceDisplay.appendChild(controls)
        }
        controls.innerHTML = ''

        const actions = [{
            name: 'Toggle MIDI log',
            fun: (event) => {
                const logContainer = document.querySelector('.logContainer')
                logContainer._$Toggle()
            }
        },/* {
            name: 'Test log',
            fun: (event) => {
                console.log(`Test action`)
            }
        }*/]
        const aT = document.createElement('span')
        aT.classList.add('control')
        for (const action of actions) {
            const a = aT.cloneNode()
            a.appendChild(document.createTextNode(action.name))
            a.addEventListener('click', action.fun)
            controls.appendChild(a)
        }



        // midiTempo
        const midiTempoEnabled = true
        if (midiTempoEnabled) {
            const midiTempoEl = document.createElement('span')
            midiTempoEl.id = 'midiTempo'
            midiTempoEl.classList.add('midiTempoON')
            midiTempoEl.innerHTML = 'Tempo'
            controls.appendChild(midiTempoEl)
        }

    }

    try {
        initControls()
    } catch (error) {
        console.error('initControls', error)
    }


    updateGlobalFasDevice(getGlobalFasDevice())
}

const initMIDIDevices = async () => {
    const deviceContainer = document.querySelector('.deviceContainer')
    const deviceContainerInput = document.querySelector('.deviceContainerInput')
    const deviceContainerOutput = document.querySelector('.deviceContainerOutput')
    deviceContainerInput.innerHTML = ''
    deviceContainerOutput.innerHTML = ''

    let all = []
    if (reduceINOUT2SingleEntry) {
        const deviceList = await getMIDIDeviceGrouped()
        console.log(`deviceList`, deviceList)
        if (deviceList)
            all = Object.values(deviceList)
                .map(item => {
                    return {
                        id: '',
                        manufacturer: '',
                        name: item.name
                    }
                })
    } else {
        const midiDevices = await findMIDIDevices()
        console.log(`midiDevices`, midiDevices)
        all = Array.from(new Set(midiDevices.input.map(item => item.name).concat(midiDevices.output.map(item => item.name))))
            .map(item => {
                return {
                    id: '',
                    manufacturer: '',
                    name: item
                }
            })
    }

    const sT = document.createElement('select')
    const oT = document.createElement('option')
    const lT = document.createElement('label')
    const bT = document.createElement('button')

    const createDeviceSection = async (label, devices) => {
        const l = lT.cloneNode()
        l.appendChild(document.createTextNode(label))
        const s = sT.cloneNode()

        const o = oT.cloneNode()
        o.appendChild(document.createTextNode(`Select MIDI Device`))
        o.$_midiDevice = null
        o.setAttribute('value', '')
        o.setAttribute('data-midi-device-id', '')
        o.setAttribute('data-midi-device-name', '')
        s.appendChild(o)

        for (const device of devices) {
            const o = oT.cloneNode()
            o.appendChild(document.createTextNode(`${device.name}`))
            o.$_midiDevice = device
            o.setAttribute('value', device.name)
            o.setAttribute('data-midi-device-id', device.id)
            o.setAttribute('data-midi-device-name', device.name)
            o.setAttribute('data-midi-device-manufacturer', device.manufacturer)

            if (globalMidiDevices?.name === device.name) {
                o.setAttribute('selected', true)
            } else {
                o.removeAttribute('selected')
            }
            s.appendChild(o)
        }

        const b = bT.cloneNode()
        b.appendChild(document.createTextNode('Refresh'))
        b.addEventListener('click', (event) => {
            initMIDIDevices()
        })
        return { label: l, select: s, button: b }
    }

    const dSel = await createDeviceSection('MIDI Device', all)
    deviceContainerInput.appendChild(dSel.label)
    deviceContainerInput.appendChild(dSel.select)
    deviceContainerInput.appendChild(dSel.button)
    dSel.select.addEventListener('change', async (event) => {
        globalMidiDevices.output = null
        globalMidiDevices.input = null
        globalMidiDevices.name = ''
        if (event.target?.selectedOptions[0]?.value) {
            let d
            if (reduceINOUT2SingleEntry) {
                d = await resolveMIDIDeviceFromGroup(event.target?.selectedOptions[0]?.value)
            } else {
                d = await findMIDIDeviceByName(event.target.selectedOptions[0].value)
            }
            globalMidiDevices.output = d.output
            globalMidiDevices.input = d.input
            globalMidiDevices.name = event.target?.selectedOptions[0]?.value
            settingsStore.setMIDIDevice(getSelectedMIDIDevice())
            updateGlobalFasDevice(getGlobalFasDevice())
        } else {
            settingsStore.setMIDIDevice(null)
            updateGlobalFasDevice(null)
        }
        // restart midi device
        start(true)
    })

    deviceContainer.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });

}


const initTempoIndicator = (() => {
    let midiTempo
    const pulse = () => {
        if (!midiTempo) {
            midiTempo = document.querySelector('#midiTempo')
        }
        midiTempo.classList.add('midiTempoON')
        setTimeout(() => midiTempo.classList.remove('midiTempoON'), 100)
    }
    return {
        pulse: pulse
    }
})()

let midiDevice2
const stopListeningToProgrammChanges = () => {
    if (midiDevice2?.input) {
        midiDevice2?.input?.close()
    }
}
const listenToProgrammChanges = async () => {
    stopListeningToProgrammChanges()
    // console.log('Listen to programm changes...')
    // Listen to programm changes...
    // Programm change : 0xC6 // 198
    midiDevice2 = await getSelectedMIDIDevice()
    if (midiDevice2?.input) {
        midiDevice2.input.onmidimessage = async (msg) => {
            const ProgramChange = 0xc6
            const PatchChange = 0xc0

            if (-1 !== [ProgramChange, PatchChange].indexOf(msg.data[0])) {
                const command = msg.data[0]
                const programm = msg.data[1]
                await start()
            } else if (
                FAMidiClient.isMIDITempo(msg.data)
            ) {
                //console.log(`TEMPO: ${new Date()}`, msg)
                initTempoIndicator.pulse()
            }
        }
    }
}

const _initLog = async () => {
    const logMIDIDevice = await getSelectedMIDIDevice()
    const log = await logUnit(logMIDIDevice, true, false)
    console.log('logUnit', log)
    const send = await sendUnit(async (value) => {
        const sendMIDIDevice = await getSelectedMIDIDevice()
        if (sendMIDIDevice?.isInOutAvailable()) {
            const result = await new FAMidiClient(sendMIDIDevice.input, sendMIDIDevice.output, globalFasDevice, globalVerbose).send("SYSEX", value)
            console.log(`*** Result from send SYSEX ***`, result)
            return result
        }
    })
    console.log('sendUnit', send)
}

const updateSelectedDeviceLink = () => {
    document?.querySelector(`a[data-fas-id="${globalFasDevice}"]`)?.setAttribute('data-fas-selected', '')
}
const updateAutoSelectSingleMidiDevice = () => {
    if (autoSelectIfSingleDevice) {
        const select = document.querySelector('.deviceContainerInput select')
        if (select?.options.length === 2) {
            select.selectedIndex = 1
            select.dispatchEvent(new Event('change'))
        }
    }
}
const start = async (initial) => {
    if (initial) {
        await initMIDIDevices()
        const loadedDevice = await loadMidiDeviceFromLocalStorage()
        console.log('loadedDevice', loadedDevice)

        await _initLog()
    }

    await startDevicePanel()
    if (initial) {
        listenToProgrammChanges()
        await updateSelectedDeviceLink()
        await updateAutoSelectSingleMidiDevice()
    }
}

const initAppp = async () => {
    try {
        console.log(`Emergency launch in 10sec...`)
        let emegerncyLaunchIn10Sec = setTimeout(async () => { await start(true) }, 10000)

        navigator.permissions.query({ name: "midi", sysex: true }).then(async (result) => {
            console.log('Requesting permission for MIDI Sysex state: ', result)
            if (result.state === "granted") {
                // Access granted.
                console.log('Permission for MIDI Sysex granted')
                clearTimeout(emegerncyLaunchIn10Sec)
                await start(true)
            } else if (result.state === "prompt") {
                // Using API will prompt for permission
                console.log('Requesting permission for MIDI Sysex...')
            } else {

            }
            // Permission was denied by user prompt or permission policy
        });
    } catch (e) {
        await start(true)
        console.error('Error requesting permission for MIDI Sysex', e)
        // alert(`Unfortunately your browser doesn't support the Web MIDI API.`)

        document.querySelector('.sceneButtons').innerHTML = `Your browser doesn't support Web MIDI API :-(`
        document.querySelector('.sceneButtons').setAttribute('style', `color:red;font-size:1.5rem;font-weight:100`)
    }
}


window.$initAppp = initAppp