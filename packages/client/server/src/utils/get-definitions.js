"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isDefinition(definition) {
    return definition && !!definition.type;
}
exports.isDefinition = isDefinition;
function isClassDefinition(definition) {
    return definition && definition.type === 'class';
}
exports.isClassDefinition = isClassDefinition;
function isStateDefinition(definition) {
    return definition && definition.type === 'state';
}
exports.isStateDefinition = isStateDefinition;
function getDefinition(meta, symbolName, resolver) {
    if (meta.classes[symbolName]) {
        return getClassDefinition(meta, symbolName, resolver);
    }
    return null;
}
exports.getDefinition = getDefinition;
function getClassDefinition(meta, symbolName, resolver) {
    debugger;
    console.log('symbolname', symbolName);
    console.log('stylesheet', JSON.stringify(meta));
    var states = [];
    if (meta.classes[symbolName]["-st-states"]) {
        meta.classes[symbolName]["-st-states"].map(function (state) {
            states.push({
                name: state,
                export: symbolName,
                from: meta.source,
                type: 'state'
            });
        });
    }
    var type = meta.classes[symbolName]["-st-extends"] ? meta.classes[symbolName]["-st-extends"].name : undefined;
    console.log('type', type);
    if (type) {
        console.log(JSON.stringify(meta));
        var symbols = resolver.resolveSymbols(meta);
        console.log('symbols', JSON.stringify(symbols));
        if (symbols[type]) {
            console.log('calling internal');
            var internalClassDef = getClassDefinition(symbols[type], 'root', resolver);
            states = states.concat(internalClassDef.states);
        }
    }
    return {
        export: symbolName,
        type: "class",
        states: states
    };
}
//# sourceMappingURL=get-definitions.js.map