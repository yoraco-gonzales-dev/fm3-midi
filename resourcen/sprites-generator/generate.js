#!/usr/bin/env node

const path = require('path')
const currendDir = path.dirname(process.argv[1])

const effects = {
    "ID_CONTROL": 2,
    "ID_TUNER": 35,
    "ID_IRCAPTURE": 36,
    "ID_INPUT1": 37,
    "ID_INPUT2": 38,
    "ID_INPUT3": 39,
    "ID_INPUT4": 40,
    "ID_INPUT5": 41,
    "ID_OUTPUT1": 42,
    "ID_OUTPUT2": 43,
    "ID_OUTPUT3": 44,
    "ID_OUTPUT4": 45,
    "ID_COMP1": 46,
    "ID_COMP2": 47,
    "ID_COMP3": 48,
    "ID_COMP4": 49,
    "ID_GRAPHEQ1": 50,
    "ID_GRAPHEQ2": 51,
    "ID_GRAPHEQ3": 52,
    "ID_GRAPHEQ4": 53,
    "ID_PARAEQ1": 54,
    "ID_PARAEQ2": 55,
    "ID_PARAEQ3": 56,
    "ID_PARAEQ4": 57,
    "ID_DISTORT1": 58,
    "ID_DISTORT2": 59,
    "ID_DISTORT3": 60,
    "ID_DISTORT4": 61,
    "ID_CAB1": 62,
    "ID_CAB2": 63,
    "ID_CAB3": 64,
    "ID_CAB4": 65,
    "ID_REVERB1": 66,
    "ID_REVERB2": 67,
    "ID_REVERB3": 68,
    "ID_REVERB4": 69,
    "ID_DELAY1": 70,
    "ID_DELAY2": 71,
    "ID_DELAY3": 72,
    "ID_DELAY4": 73,
    "ID_MULTITAP1": 74,
    "ID_MULTITAP2": 75,
    "ID_MULTITAP3": 76,
    "ID_MULTITAP4": 77,
    "ID_CHORUS1": 78,
    "ID_CHORUS2": 79,
    "ID_CHORUS3": 80,
    "ID_CHORUS4": 81,
    "ID_FLANGER1": 82,
    "ID_FLANGER2": 83,
    "ID_FLANGER3": 84,
    "ID_FLANGER4": 85,
    "ID_ROTARY1": 86,
    "ID_ROTARY2": 87,
    "ID_ROTARY3": 88,
    "ID_ROTARY4": 89,
    "ID_PHASER1": 90,
    "ID_PHASER2": 91,
    "ID_PHASER3": 92,
    "ID_PHASER4": 93,
    "ID_WAH1": 94,
    "ID_WAH2": 95,
    "ID_WAH3": 96,
    "ID_WAH4": 97,
    "ID_FORMANT1": 98,
    "ID_FORMANT2": 99,
    "ID_FORMANT3": 100,
    "ID_FORMANT4": 101,
    "ID_VOLUME1": 102,
    "ID_VOLUME2": 103,
    "ID_VOLUME3": 104,
    "ID_VOLUME4": 105,
    "ID_TREMOLO1": 106,
    "ID_TREMOLO2": 107,
    "ID_TREMOLO3": 108,
    "ID_TREMOLO4": 109,
    "ID_PITCH1": 110,
    "ID_PITCH2": 111,
    "ID_PITCH3": 112,
    "ID_PITCH4": 113,
    "ID_FILTER1": 114,
    "ID_FILTER2": 115,
    "ID_FILTER3": 116,
    "ID_FILTER4": 117,
    "ID_FUZZ1": 118,
    "ID_FUZZ2": 119,
    "ID_FUZZ3": 120,
    "ID_FUZZ4": 121,
    "ID_ENHANCER1": 122,
    "ID_ENHANCER2": 123,
    "ID_ENHANCER3": 124,
    "ID_ENHANCER4": 125,
    "ID_MIXER1": 126,
    "ID_MIXER2": 127,
    "ID_MIXER3": 128,
    "ID_MIXER4": 129,
    "ID_SYNTH1": 130,
    "ID_SYNTH2": 131,
    "ID_SYNTH3": 132,
    "ID_SYNTH4": 133,
    "ID_VOCODER1": 134,
    "ID_VOCODER2": 135,
    "ID_VOCODER3": 136,
    "ID_VOCODER4": 137,
    "ID_MEGATAP1": 138,
    "ID_MEGATAP2": 139,
    "ID_MEGATAP3": 140,
    "ID_MEGATAP4": 141,
    "ID_CROSSOVER1": 142,
    "ID_CROSSOVER2": 143,
    "ID_CROSSOVER3": 144,
    "ID_CROSSOVER4": 145,
    "ID_GATE1": 146,
    "ID_GATE2": 147,
    "ID_GATE3": 148,
    "ID_GATE4": 149,
    "ID_RINGMOD1": 150,
    "ID_RINGMOD2": 151,
    "ID_RINGMOD3": 152,
    "ID_RINGMOD4": 153,
    "ID_MULTICOMP1": 154,
    "ID_MULTICOMP2": 155,
    "ID_MULTICOMP3": 156,
    "ID_MULTICOMP4": 157,
    "ID_TENTAP1": 158,
    "ID_TENTAP2": 159,
    "ID_TENTAP3": 160,
    "ID_TENTAP4": 161,
    "ID_RESONATOR1": 162,
    "ID_RESONATOR2": 163,
    "ID_RESONATOR3": 164,
    "ID_RESONATOR4": 165,
    "ID_LOOPER1": 166,
    "ID_LOOPER2": 167,
    "ID_LOOPER3": 168,
    "ID_LOOPER4": 169,
    "ID_TONEMATCH1": 170,
    "ID_TONEMATCH2": 171,
    "ID_TONEMATCH3": 172,
    "ID_TONEMATCH4": 173,
    "ID_RTA1": 174,
    "ID_RTA2": 175,
    "ID_RTA3": 176,
    "ID_RTA4": 177,
    "ID_PLEX1": 178,
    "ID_PLEX2": 179,
    "ID_PLEX3": 180,
    "ID_PLEX4": 181,
    "ID_FBSEND1": 182,
    "ID_FBSEND2": 183,
    "ID_FBSEND3": 184,
    "ID_FBSEND4": 185,
    "ID_FBRETURN1": 186,
    "ID_FBRETURN2": 187,
    "ID_FBRETURN3": 188,
    "ID_FBRETURN4": 189,
    "ID_MIDIBLOCK": 190,
    "ID_MULTIPLEXER1": 191,
    "ID_MULTIPLEXER2": 192,
    "ID_MULTIPLEXER3": 193,
    "ID_MULTIPLEXER4": 194,
    "ID_IRPLAYER1": 195,
    "ID_IRPLAYER2": 196,
    "ID_IRPLAYER3": 197,
    "ID_IRPLAYER4": 198,
    "ID_FOOTCONTROLLER": 199,
    "ID_PRESET_FC": 200,
    "ID__LAST_EFFECT_ID": 201
}
const effectIDs = Object.keys(effects).sort()
const existing = [
    'ID_INPUT1',
    'ID_INPUT2',
    'ID_INPUT3',
    'ID_INPUT4',
    'ID_INPUT5', // USB Input
    'ID_OUTPUT1',
    'ID_OUTPUT2',
    'ID_OUTPUT3',
    'ID_OUTPUT4',

    'ID_DISTORT1', // AMP Block
    'ID_DISTORT2',
    //    'ID_DISTORT3',
    //    'ID_DISTORT4',

    'ID_CAB1',
    'ID_CAB2',
    //    'ID_CAB3',
    //    'ID_CAB4',
    'ID_CHORUS1',
    'ID_CHORUS2',
    //    'ID_CHORUS3',
    //    'ID_CHORUS4',
    'ID_COMP1',
    'ID_COMP2',
    'ID_COMP3',
    'ID_COMP4',

    //    'ID_CONTROL',
    'ID_CROSSOVER1',
    'ID_CROSSOVER2',
    //    'ID_CROSSOVER3',
    //    'ID_CROSSOVER4',
    'ID_DELAY1',
    'ID_DELAY2',
    'ID_DELAY3',
    'ID_DELAY4',
    'ID_FUZZ1', // Fuzz seems to be the DRIVE block
    'ID_FUZZ2',
    'ID_FUZZ3',
    'ID_FUZZ4',

    'MISSING_DYNDST1',
    'MISSING_DYNDST2',

    'ID_ENHANCER1',
    'ID_ENHANCER2',
    //    'ID_ENHANCER3',
    //    'ID_ENHANCER4',
    'ID_FBRETURN1',
    'ID_FBRETURN2',
    //    'ID_FBRETURN3',
    //    'ID_FBRETURN4',

    'ID_FBSEND1',
    'ID_FBSEND2',
    //    'ID_FBSEND3',
    //    'ID_FBSEND4',
    'ID_FILTER1',
    'ID_FILTER2',
    'ID_FILTER3',
    'ID_FILTER4',
    'ID_FLANGER1',
    'ID_FLANGER2',
    //    'ID_FLANGER3',
    //    'ID_FLANGER4',
    //    'ID_FOOTCONTROLLER',
    'ID_FORMANT1',
    'ID_FORMANT2',
    //    'ID_FORMANT3',
    //    'ID_FORMANT4',

    'ID_GATE1',
    'ID_GATE2',
    'ID_GATE3',
    'ID_GATE4',
    'ID_GRAPHEQ1',
    'ID_GRAPHEQ2',
    'ID_GRAPHEQ3',
    'ID_GRAPHEQ4',

    //    'ID_IRCAPTURE',
    'ID_IRPLAYER1',
    'ID_IRPLAYER2',
    //    'ID_IRPLAYER3',
    //    'ID_IRPLAYER4',
    'ID_LOOPER1',
    //    'ID_LOOPER2',
    //    'ID_LOOPER3',
    //    'ID_LOOPER4',
    'ID_MIDIBLOCK',

    'ID_MEGATAP1',
    'ID_MEGATAP2',
    //    'ID_MEGATAP3',
    //    'ID_MEGATAP4',

    'ID_MIXER1',
    'ID_MIXER2',
    'ID_MIXER3',
    'ID_MIXER4',
    'ID_MULTICOMP1',
    'ID_MULTICOMP2',
    //    'ID_MULTICOMP3',
    //    'ID_MULTICOMP4',
    'ID_MULTIPLEXER1',
    'ID_MULTIPLEXER2',
    //    'ID_MULTIPLEXER3',
    //    'ID_MULTIPLEXER4',
    'ID_MULTITAP1',
    'ID_MULTITAP2',
    //    'ID_MULTITAP3',
    //    'ID_MULTITAP4',

    'ID_PARAEQ1',
    'ID_PARAEQ2',
    'ID_PARAEQ3',
    'ID_PARAEQ4',
    'ID_PHASER1',
    'ID_PHASER2',
    //    'ID_PHASER3',
    //    'ID_PHASER4',
    'ID_PITCH1',
    'ID_PITCH2',
    //    'ID_PITCH3',
    //    'ID_PITCH4',
    'ID_PLEX1',
    'ID_PLEX2',
    //    'ID_PLEX3',
    //    'ID_PLEX4',
    //    'ID_PRESET_FC',

    'ID_RTA1',
    //    'ID_RTA2',
    //    'ID_RTA3',
    //    'ID_RTA4',
    'ID_RESONATOR1',
    'ID_RESONATOR2',
    //    'ID_RESONATOR3',
    //    'ID_RESONATOR4',
    'ID_REVERB1',
    'ID_REVERB2',
    //    'ID_REVERB3',
    //    'ID_REVERB4',
    'ID_RINGMOD1',
    //    'ID_RINGMOD2',
    //    'ID_RINGMOD3',
    //    'ID_RINGMOD4',
    'ID_ROTARY1',
    'ID_ROTARY2',
    //    'ID_ROTARY3',
    //    'ID_ROTARY4',

    'ID_SYNTH1',
    'ID_SYNTH2',
    //    'ID_SYNTH3',
    //    'ID_SYNTH4',
    'ID_TENTAP1',
    'ID_TENTAP2',
    //    'ID_TENTAP3',
    //    'ID_TENTAP4',
    'ID_TONEMATCH1',
    //    'ID_TONEMATCH2',
    //    'ID_TONEMATCH3',
    //    'ID_TONEMATCH4',
    'ID_TREMOLO1',
    'ID_TREMOLO2',
    //    'ID_TREMOLO3',
    //    'ID_TREMOLO4',
    //    'ID_TUNER',
    'ID_VOCODER1',
    //    'ID_VOCODER2',
    //    'ID_VOCODER3',
    //    'ID_VOCODER4',
    'ID_VOLUME1',
    'ID_VOLUME2',
    'ID_VOLUME3',
    'ID_VOLUME4',
    'ID_WAH1',
    'ID_WAH2',
    //    'ID_WAH3',
    //    'ID_WAH4',
    //    'ID__LAST_EFFECT_ID'
]



/**
 * 
- DYNDST1
- DYNDST2
- TMA
- PANTRM1
- PANTRM2
 */
const blockBorderWidth = -2
const imageSrc = './sprites.jpeg'
const top = 101
const left = 27
const blockHeight = 67 + blockBorderWidth
const blockWidth = 89 + blockBorderWidth
const marginRight = 25
const marginBottom = 20
/*
    height: 65px !important;
    width: 87px !important;
    ->
    height: 66px !important;    
    width: 89px !important;
*/

const chunks = function (array, size) {
    const results = []
    while (array.length) {
        results.push(array.splice(0, size))
    }
    return results
}
const columns = 18
const blockChunks = chunks(existing, columns)

// console.log(blockChunks)

const createBlock = (row, col) => {
    const y = row > 0 ? (row * (blockHeight + marginBottom)) + top : top
    const x = col > 0 ? (col * (blockWidth + marginRight)) + left : left
    const style = `
.${blockChunks[row][col]} {
    background-position: -${x}px -${y}px;
}`

    const html = `
    <button 
    id="${blockChunks[row][col]}" 
    data-effect-block="${blockChunks[row][col]}"
    title="${blockChunks[row][col]}"
    class="effect ${blockChunks[row][col]}"
    onclick="toggleStatus(this)"
    >
    </button>
    `
    return {
        style, html
    }
}



const stylesAndHtml = []
blockChunks.forEach((row, rowiIndex) => {
    row.forEach((col, colIndex) => {
        const blockDefinition = createBlock(rowiIndex, colIndex)
        stylesAndHtml.push(blockDefinition)
    })
})


const css = []
css.push(`
    /*<style>*/
    .effect {
        height: ${blockHeight}px !important;
        width: ${blockWidth}px !important;
        border: solid 1px transparent;
        cursor:pointer;
        background-color: black;
        background-image: url(${imageSrc});
        background-repeat: no-repeat;
        border-radius: 4px;
    }
    .effect.effectON, .effect.effectOFF {
        color: gray;
        background-color: transparent;
        x-width: 10rem;
        -xmargin: 0.4rem;
        -xpadding: 1rem;
    }
    .effect.effectON, .effectON:hover {
        opacity: 1;
    }
    .effectOFF:hover {
        opacity: 0.7;
    }
    .effectOFF {
        opacity: 0.5;
    }
    ${stylesAndHtml.map(item => item.style).join('\n\t')}
    /*</style>*/
    `)
css.push(stylesAndHtml.map(item => item.style).join('\n\t'))


const html = []
html.push('<!DOCTYPE html>')
html.push('<html>')
html.push('<head>')
html.push(` <link rel="stylesheet" href="./sprites.css"> `)
html.push('</head>')
html.push('<body>')
html.push(stylesAndHtml.map(item => item.html).join('\n\t'))
html.push(`
    <script>
    const toggleStatus=(el)=>{
        if(el.classList.contains('effectOFF')){
            el.classList.add('effectON')
            el.classList.remove('effectOFF')
        }else{
            el.classList.add('effectOFF')
            el.classList.remove('effectON')
        }
    }
    </script>
    `)
html.push('</body>')
html.push('</html>')


const fs = require('fs')
const fileDemoHtml = path.join(currendDir, 'sprites.html')
const fileDemoCSS = path.join(currendDir, 'sprites.css')
fs.writeFileSync(fileDemoHtml, html.join('\n'))
fs.writeFileSync(fileDemoCSS, css.join('\n'))

console.log(`File generated: ${fileDemoHtml}`)
console.log(`File generated: ${fileDemoCSS}`)