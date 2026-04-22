/** requirejs & module shim */
window.module = {}
var moduleStorage = []
Object.defineProperty(window.module, "exports", {
    get: function () {
        return 'LOL';
    },
    set: function (moduleFunction) {
        moduleStorage.push(moduleFunction)
    }
});
window.require = function (moduleName) {
    //console.log(`***called require:`, arguments)

    const name = moduleName.split('/').slice(-1).join('/').split('.')[0]
    if ('FractalMIDI' === name) {
        return FractalMIDI
    } else if ('api' === name) {
        return API
    } else if ('client' === name) {
        return FAMidiClient
    }
}