# FM3, FM9 and AXE-FX III MIDI Client

## Install
```bash
$ cd <Into-Project-Dir>
$ npm install -g ./
```

## List MIDI devices

```bash
$ midi-interfaces-list
```

## Send MIDI commands

```bash
$ fas-midi-sender.js --midiIn "USB MIDI Interface" --fasDevice FM3 --command QUERY_SCENE_NAME
```

more examples in programm help
```bash
$ fas-midi-sender.js -h
```


Program help:

```log
Send MIDI commands to FAS device FM3, FM9 or AXE-FX III

Usage:
        fas-midi-sender.js <options>
Options:
        --midiIn   : Name of the midi in device
        --midiOut   : Name of the midi out device. Leave empty if same as --midiIn
        --fasDevice   : Set to "FM3", "FM9" or "AXEFXIII"
        --command   : Set to a MIDI command to send.
                List of available FAS MIDI commands: 
                SYSEX
                TEST_SYSEX
                GET_FIRMWARE_VERSION
                TUNER_ON
                TUNER_OFF
                BYPASS
                QUERY_PATCH_NAME
                QUERY_SCENE_NAME
                CHANNEL
                SCENE
                TEMPO
                TEMPO_TAP
                TEMPO_MIDI
                STATUS_DUMP
                TUNER_STATE
                PATCH
                BANK
                PROGRAM
                G_BLOCK_PARAMETER_VALUE

                Note: Command is called "BYPASS" but handled as "ENGAGE"
        --value   : Set the MIDI value Sysex message
        --verbose   : Verbose logging to console

Examples:
           
        Set bank to number
            fas-midi-sender.js --midiIn "USB MIDI Interface" --fasDevice FM3 --command BANK --value 1

        Set patch to number
            fas-midi-sender.js --midiIn "USB MIDI Interface" --fasDevice FM3 --command PATCH --value 0

        Bypass CAB block:
            fas-midi-sender.js --midiIn "USB MIDI Interface" --fasDevice FM3 --command BYPASS --value "ID_CAB1 false"
        

        Engabe CAB block:
            fas-midi-sender.js --midiIn "USB MIDI Interface" --fasDevice FM3 --command BYPASS --value "ID_CAB1 true"
            Exmaple output:
                {
                    "id": "ID_CAB1",
                    "engaged": true
                }
        

        Query patch name:
            fas-midi-sender.js --midiIn "USB MIDI Interface" --fasDevice FM3 --command QUERY_PATCH_NAME
            Example output:
                {
                    "number": 475,
                    "name": "Plexi 100W"
                }        
        

        Query scene name:
            fas-midi-sender.js --midiIn "USB MIDI Interface" --fasDevice FM3 --command QUERY_SCENE_NAME
            Example output:
                {
                    "number": 3,
                    "name": "1959SLP Treble"
                }
        

        Query scene name:
            fas-midi-sender.js --midiIn "USB MIDI Interface" --fasDevice FM3 --command GET_FIRMWARE_VERSION
            Example output:
                "12.0"
```