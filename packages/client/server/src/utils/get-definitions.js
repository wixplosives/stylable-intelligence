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
function getDefinition(stylesheet, symbolName, resolver) {
    if (stylesheet.typedClasses[symbolName]) {
        return getClassDefinition(stylesheet, symbolName, resolver);
    }
    return null;
}
exports.getDefinition = getDefinition;
function getClassDefinition(stylesheet, symbolName, resolver) {
    debugger;
    console.log('symbolname', symbolName);
    console.log('stylesheet', JSON.stringify(stylesheet));
    var states = [];
    if (stylesheet.typedClasses[symbolName]["-st-states"]) {
        stylesheet.typedClasses[symbolName]["-st-states"].map(function (state) {
            states.push({
                name: state,
                export: symbolName,
                from: stylesheet.source,
                type: 'state'
            });
        });
    }
    var type = stylesheet.typedClasses[symbolName]["-st-extends"];
    console.log('type', type);
    if (type) {
        console.log(JSON.stringify(stylesheet));
        var symbols = resolver.resolveSymbols(stylesheet);
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