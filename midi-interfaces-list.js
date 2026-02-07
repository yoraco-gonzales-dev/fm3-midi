#!/usr/bin/env node

/*
List device interfaces
*/

const easymidi = require('easymidi')

const inputs = easymidi.getInputs()
console.log(`Input:`)
inputs?.forEach(element => {
    console.log(element)
})
console.log(`Output:`)
const outputs = easymidi.getOutputs()
outputs?.forEach(element => {
    console.log(element)
})