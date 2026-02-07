const logUnit = async (midiInputDevice, autostart, startVisible) => {
    const logMaxLines = 2000
    const logHexMaxCols = 16
    const getMidiDevice = async () => midiInputDevice || await getSelectedMIDIDevice()

    let currentMidiDevice = await getMidiDevice()
    const listen = async () => {
        const logContainer = document.querySelector('.logContainer')
        if (logContainer && logContainer.$currentMidiDevice) {
            try {
                logContainer.$currentMidiDevice?.input?.close()()
            } catch (e) {
                console.error('Error stop listening', e)
            }
        }
        currentMidiDevice = await getMidiDevice()
        logContainer.$currentMidiDevice = currentMidiDevice
        if (currentMidiDevice?.input) {
            if (!currentMidiDevice.input.onmidimessage)
                currentMidiDevice.input.onmidimessage = (message) => {
                    incomingLog._$AddBytes(message.data)
                    /*
                    // TODO: needs further check:
                    // bypass message comes double in...
                    // ... seems like an issue with the MIDI Input Device I'm using...?
                    // ... or FM3 send it double... 
                    // Scene change works fine, only one message is received...
                    const bypassEf = [0xf0, 0x00, 0x01, 0x74, 0x11, 0x0a]
                    const incoming = message.data.slice(0, 6)
                    if (bypassEf.join(';') === incoming.join(';')) {
                        console.error(`*****ONMIDIMESSAGE`, new Error().stack, 'data:', message.data, 'midi-device', currentMidiDevice)
                    }
                    */
                }
            return true
        }

        buildDataList()
    }
    const stop = () => {
        if (currentMidiDevice) {
            try {
                currentMidiDevice?.input?.close()()
            } catch (e) {
                console.error('Error stop listening', e)
            }
        }
    }

    // app
    const logContainer = document.querySelector('.logContainer')
    logContainer.$currentMidiDevice = currentMidiDevice
    // force re-build so any listener is destroyed
    logContainer.innerHTML = logContainer.innerHTML + ''

    const logHeader = document.querySelector('.logHeader')
    const logHeaderClose = document.querySelector('.logContainerClose')
    const incomingLog = document.querySelector('.incomingLog')
    const stopLog = document.querySelector('.stopLog')
    const startLog = document.querySelector('.startLog')
    const clearLog = document.querySelector('.clearLog')
    const restartLog = document.querySelector('.restartLog')
    const filterLog = document.querySelector('.filterLog')
    const filterLogClear = document.querySelector('.filterLogClear')


    // reset
    incomingLog.innerHTML = ''
    incomingLog._$Lines = []

    let doLog = false
    let doFilter

    stopLog.addEventListener('click', (event) => {
        doLog = false

        stopLog.classList.add('hidden')
        startLog.classList.remove('hidden')
    })
    startLog.addEventListener('click', (event) => {
        doLog = true

        stopLog.classList.remove('hidden')
        startLog.classList.add('hidden')
    })
    clearLog.addEventListener('click', (event) => {
        incomingLog._$Lines = []
        incomingLog.innerHTML = ''
    })
    restartLog.addEventListener('click', async (event) => {

    })
    restartLog.style.display = 'none'
    filterLogClear.addEventListener('click', () => {
        filterLog.value = ''
        filterLog.dispatchEvent(new Event('change'))
    })

    stopLog.dispatchEvent(new Event('click'))


    filterLog.addEventListener('change', (event) => {
        doFilter = filterLog.value
        incomingLog._$Filter(doFilter)
    })
    filterLog.addEventListener('keyup', (event) => {
        doFilter = filterLog.value
        incomingLog._$Filter(doFilter)
    })


    const buildDataList = () => {
        document.querySelector('#midimessagefilter')?.remove()
        const dataList = document.createElement('datalist')
        const dataListOption = document.createElement('option')
        /*
                "Axe-Fx III": 0x10,
                "FM3": 0x11,
                "FM9": 0x12
        */
        const deviceIDMap = {
            'AXEFXIII': 0x10,
            'FM3': 0x11,
            'FM9': 0x12
        }
        const idDeviceMap = {}
        Object.entries(deviceIDMap).forEach(entry => idDeviceMap[entry[1]] = entry[0])
        console.log('currentMidiDevice', currentMidiDevice)
        const deviceId = '0x' + (deviceIDMap[currentMidiDevice?.$fasDevice] || -1).toString(16)
        const deviceKey = idDeviceMap[deviceIDMap[currentMidiDevice?.$fasDevice]] || 'N.A'
        const manufacturerId = '0x00 0x01 0x74'
            ;[
                `0xf0 ${manufacturerId} ${deviceId} 0x0a *;Bypass effect (send)`,
                `0xF0 ${manufacturerId} ${deviceId} 0x11 0x01 0x04 0xF7;Tuner ON (send)`,
                `0xF0 ${manufacturerId} ${deviceId} 0x11 0x00 0x05 0xF7;Tuner OFF (send)`,
                `0xf0 ${manufacturerId} ${deviceId} 0x10 0xf7;Tempo pulse (send)`,
                `0xF0 ${manufacturerId} ${deviceId} 0x10 *;Tempo tap`,
                `0xF0 ${manufacturerId} ${deviceId} 0x14 *;Tempo set`,
                `0xc0 ?;Patch change`,
                `0xf0 ${manufacturerId} ${deviceId} 0x0c *;Scene change`
            ].forEach(item => {
                const val = item.split(';')
                val[0] = '0x' + val[0].replaceAll('0x', ' ').replaceAll('  ', ' ').trim()
                const _dataListOption = dataListOption.cloneNode()
                _dataListOption.value = val[0].trim().toLowerCase()
                _dataListOption.appendChild(document.createTextNode(val[1].trim() + (` (${deviceKey})`)))
                dataList.appendChild(_dataListOption)
            })
        dataList.id = 'midimessagefilter'
        filterLog.parentNode.appendChild(dataList)
        filterLog.setAttribute('list', dataList.id)
    }

    buildDataList()


    incomingLog._$Filter = (filter) => {
        let _filter = (filter || '').toLowerCase().trim().replaceAll('?', ' ? ').replaceAll('*', ' * ').replaceAll('  ', ' ')
        if (_filter.startsWith('0x')) {
            // is hex
            _filter = _filter.replaceAll('0x', ' ').replaceAll('  ', ' ').trim().split(' ').map(item => `0x${item}`)
        } else {
            // is decimal
            _filter = _filter.replaceAll('  ', ' ').trim().split(' ').map(item => {
                const p = Number.parseInt(item)
                if (!Number.isNaN(p)) {
                    return `0x${Number.parseInt(item).toString(16)}`
                }
                return item
            })
        }

        _filter = _filter.map(item => {
            if (-1 !== item.indexOf('?')) {
                return `0x[A-F0-9]{2}`
            } else if (-1 !== item.indexOf('*')) {
                return `( 0x[A-F0-9]{2})*`
            }
            return item
        })
        const filterRegex = '^' + _filter.join(' ').replaceAll(' ( ', '( ') + '$'
        const filterEntry = (entry) => {
            const incoming = entry.hex.join(' ')
            const res = new RegExp(filterRegex, 'i').test(incoming)
            /*
            if (res)
                console.log(`Compare in: ${incoming} filter: ${filterRegex} : ${res}`)
            */
            return res
        }
        const renderEntry = (entry, index) => {
            const c = []

            c.push(`<span class="logRow" data-group="${entry.group}" data-data-timestamp="${entry.timestamp}" data-index="${entry.index}">`)
            const dateString = entry.index === 0 ? new Date(entry.timestamp).toISOString().replace('T', ' ').replace('Z', ' ') : ''

            //c.push(`<span class="logTimestamp">${dateString}</span>`)
            c.push(`<span class="logTimestamp" data-group="${entry.group}" data-timestamp="${dateString}">${dateString && dateString.split(' ')[1]}</span>`)

            entry.hex.map((item, hexIndex) => `<span class="logHex" data-group="${entry.group}" data-timestamp="${dateString}" data-hex="${item}" data-index="${entry.index}" data-hex-index="${hexIndex}">${item}</span>`)
                .forEach(item => c.push(item))
            c.push(`</span>`)


            return c.join('')
        }
        const l = filter ? incomingLog._$Lines.filter(filterEntry) : incomingLog._$Lines
        const byGroup = {}
        l.forEach(item => {
            byGroup[item.group] = byGroup[item.group] || []
            byGroup[item.group].push(item)
        })
        const groupsHTML = []
        Object.keys(byGroup).forEach((key, index) => {

            const c = []
            c.push(`<group data-group-id="${key}" data-group-index="${index}">`)

            const groupItems = byGroup[key]
            const groupItemHTML = groupItems.map(renderEntry)
            c.push(groupItemHTML.join('\n\t'))

            c.push('</group>')

            groupsHTML.push(c.join(''))
        })

        if (doLog) {
            incomingLog.innerHTML = groupsHTML.join('\n')
        }
        /*
        const r = l.map(renderEntry)

        if (doLog) {
            incomingLog.innerHTML = r.join('\n')
        }
            */
    }
    incomingLog._$AddLine = (line) => {
        const lines = Array.isArray(line) ? line : [line]
        incomingLog._$Lines = incomingLog._$Lines || []
        lines.reverse().forEach(item => incomingLog._$Lines.unshift(item))
        incomingLog._$Lines = incomingLog._$Lines.slice(0, logMaxLines)
        incomingLog._$Filter(doFilter)
    }

    incomingLog._$AddBytes = (bytes) => {
        const prepareLogEntries = (bytes) => {
            const entries = []

            const _dateNow = Date.now()
            const chunk = (a, n) => [...Array(Math.ceil(a.length / n))].map((_, i) => a.slice(n * i, n + n * i));
            const listBytes = Array.from(bytes)

            const listBytesHex = listBytes.map(item => {
                return `0x` + `00${item.toString(16)}`.slice(-2)
            })
            const group = _dateNow
            const listChunks = chunk(listBytesHex, logHexMaxCols)
            listChunks.map((item, index, all) => {
                entries.push({
                    group: group,
                    timestamp: _dateNow,
                    parts: item,
                    hex: item.map(a => `0x` + `00${a.toString(16)}`.slice(-2)),
                    index: index
                })
                return item
            }
            )
            return entries
        }
        const entries = prepareLogEntries(bytes)
        incomingLog._$AddLine(entries)
    }

    // Make the DIV element draggable:
    //dragElement(document.getElementById("mydiv"));

    function dragElement(elmnt) {
        const header = document.querySelector('.logHeader')
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (header
            //    document.getElementById(elmnt.id + "header")
        ) {
            // if present, the header is where you move the DIV from:
            //document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
            header.onmousedown = dragMouseDown;
        } else {
            // otherwise, move the DIV from anywhere inside the DIV:
            elmnt.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            // stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    dragElement(logContainer)


    logContainer._$Show = (show) => {
        if (!logContainer.hasOwnProperty('$_style_display')) {
            logContainer.$_style_display = logContainer.style.display
        }
        logContainer.style.display = show ? logContainer.$_style_display : 'none'
        return 'none' !== logContainer.$_style_display
    }

    logContainer._$Show(startVisible)

    logContainer._$Toggle = () => {
        if (!logContainer.hasOwnProperty('$_style_display')) {
            logContainer.$_style_display = logContainer.style.display
        }
        if (logContainer.style.display !== 'none') {
            logContainer.style.display = 'none'
        } else {
            logContainer.style.display = logContainer.$_style_display
        }
    }
    logHeaderClose.addEventListener('click', (event) => {
        event.bubbles = false
        event.preventDefault()
        logContainer._$Show(false)
    })

    startLog.click()


    if (autostart)
        await listen()

    return {
        stop: stop,
        listen: listen,
        logContainer: logContainer
    }
}


/*
const initLog = async () => {
    const logMIDIDevice = await findMIDIDevice()
    const log = await logUnit(logMIDIDevice, true, false)
    console.log('logUnit', logUnit)
}

initLog()
*/

const sendUnit = async (onSendCallback) => {
    const logSendControls = document.querySelector('.logSendControls')
    const sendButton = document.querySelector('.sendButton')
    const switchButton = document.querySelector('.switchButton')
    const syexContentMultiline = document.querySelector('.syexContentMultiline')
    const syexContentSingle = document.querySelector('.syexContentSingle')
    const showElement = (element, show) => {
        if (!element.$_style_display_sendUnit) {
            element.$_style_display_sendUnit = element.style.display

            if (element.$_style_display_sendUnit === 'none') {
                element.$_style_display_sendUnit_none = element.style.display
                element.$_style_display_sendUnit = ''
            }
        }
        element.style.display = show ? element.$_style_display_sendUnit : 'none'

    }
    syexContentMultiline.$_Show = (show) => showElement(syexContentMultiline, show)
    syexContentSingle.$_Show = (show) => showElement(syexContentSingle, show)

    const switchToTextArea = (switchTextArea) => {
        syexContentMultiline.$_Show(switchTextArea)
        syexContentSingle.$_Show(!switchTextArea)
        return switchTextArea
    }
    let currentSwitchState = switchToTextArea(false)
    switchButton.addEventListener('click', (event) => {
        currentSwitchState = switchToTextArea(!currentSwitchState)
    })
    sendButton.addEventListener('click', async (event) => {
        let value = (currentSwitchState ? syexContentMultiline : syexContentSingle).value
        if ((value || '').trim()) {
            if (onSendCallback) {
                const res = await onSendCallback(value)
                console.log(`Result from callback Res: `, res)
            }
        }
    })
    return this
}
