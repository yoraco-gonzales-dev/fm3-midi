# Fractal Audio FM3 Midi Console

Send MIDI Sysex to FM3.
Requires enabling "Send Realtime Sysex"


Run web interface 
```bash
http-server --port 8443 -S --cert ~/ssl/mydomain.com.crt --key ~/ssl/mydomain.com.key --tls
# or
http-server --port 8443 -S --cert ~/ssl-http-server/cert.pem --key ~/ssl-http-server/key.pem --tls
```


See also:
- https://www.fractalaudio.com/downloads/misc/Axe-Fx%20III%20MIDI%20for%203rd%20Party%20Devices.pdf
- https://archive.axefx.fr/Tools/
- https://ccrma.stanford.edu/~craig/articles/linuxmidi/misc/essenmidi.html (Midi Messages Specification)

Effect IDs are in file [./FractalMIDI.js](./src/FractalMIDI.js)

Examples 
```bash
$ ./sender.js FM3 TEST_SYSEX "0xF0,  0x00,  0x01,  0x74,  0x11,  0x64,  0x02,  0x05,  0x77,  0xF7"
```

```bash
$ ./sender.js AXEFXIII SYSEX "0xF0,  0x00,  0x01,  0x74,  0x11,  0x64,  0x02,  0x05,  0x77,  0xF7"
```

```bash
$ ./sender.js FM9 BYPASS ID_CAB1 true
```

```bash
$ ./sender.js TEMPO_TAP
```

```bash
$ ./sender.js TEMPO_TAP
```


Send bank-select and patch-change
```bash
$ ./sender.js FM3 BANK 1;
$ ./sender.js FM3 PATCH 0
```
This selects patch 128