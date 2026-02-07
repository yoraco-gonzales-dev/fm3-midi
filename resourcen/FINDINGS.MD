
### Current state for request the bypass state of an effect block


### send

Function `BYPASS` state for effect `ID_REVERB1`
```log
0xF0, 0x00, 0x01, 0x74, 0x11, 0x0A, 0x42, 0x00, 0x7F, 0x23, 0xF7
```


### receive
`ID_REVERB1` (on)
```log
0xF0, 0x00, 0x00, 0x60, 0x00, 0x0A, 0x00, 0x00, 0x01
```

`ID_REVERB1` (off)
```log
0xF0, 0x00, 0x00, 0x60, 0x00, 0x0A, 0x00, 0x00, 0x00
```

### should be
```log
Sets and/or gets the bypass state of an effect.
Message format:
F0 00 01 74 10 0A id id dd cs F7.
id id is the effect ID as two 7-bit MIDI bytes, LS first.
dd is the bypass state (0 = engaged, 1 = bypassed).
To query set dd = 7F.
Returns:
F0 00 01 74 10 0A id id dd cs F7
where dd is the current bypass state: 0 = engaged, 1 = bypassed.
```

### runtime
After a while, the unit (FM3) stops answering at all.
I have to go to MIDI settings and switch the settings "Send Reaktime Sysex"
`ON` and `OFF` again for beeing able to receive sysex messages again.

