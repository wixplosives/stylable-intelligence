"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const selectorTokenizer = require('css-selector-tokenizer');
function createSelectorChunk(value) {
    return Object.assign({ type: '*', classes: [], states: [] }, value, { _type: 'chunk' });
}
exports.createSelectorChunk = createSelectorChunk;
function createSelectorInternalChunk(value) {
    return Object.assign({ name: '' }, createSelectorChunk(value), { _type: 'internal-chunk' });
}
exports.createSelectorInternalChunk = createSelectorInternalChunk;
function createSelectorDescendent() {
    return { _type: 'descendent' };
}
exports.createSelectorDescendent = createSelectorDescendent;
function createSelectorDirectChild() {
    return { _type: 'direct-child' };
}
exports.createSelectorDirectChild = createSelectorDirectChild;
function isSelectorChunk(chunk) {
    return chunk && chunk._type === 'chunk';
}
exports.isSelectorChunk = isSelectorChunk;
function isSelectorInternalChunk(chunk) {
    return chunk && chunk._type === 'internal-chunk';
}
exports.isSelectorInternalChunk = isSelectorInternalChunk;
function isSelectorDescendent(chunk) {
    return chunk && chunk._type === 'descendent';
}
exports.isSelectorDescendent = isSelectorDescendent;
function isSelectorDirectChild(chunk) {
    return chunk && chunk._type === 'direct-child';
}
exports.isSelectorDirectChild = isSelectorDirectChild;
function parseSelector(inputSelector, cursorIndex = 0) {
    const res = [];
    let cursorTarget = { focusChunk: {}, simpleSelector: '', index: -1 };
    const tokenizedSelectors = selectorTokenizer.parse(inputSelector);
    if (tokenizedSelectors.type !== 'selectors') {
        throw new Error('not handled');
    }
    const firstSelector = tokenizedSelectors.nodes[0];
    const spaceBeforeSelector = inputSelector.match(/^(\s)*/);
    let selector = inputSelector.trim();
    let currentPosition = spaceBeforeSelector && spaceBeforeSelector[0].length || 0;
    let currentSourceQuery = '';
    res.push(createSelectorChunk());
    for (let i = 0; i < firstSelector.nodes.length; i++) {
        const selectorQueryItem = firstSelector.nodes[i];
        let currentTarget = res[res.length - 1];
        if (isSelectorChunk(currentTarget) || isSelectorInternalChunk(currentTarget)) {
            switch (selectorQueryItem.type) {
                case 'class':
                    currentTarget.classes.push(selectorQueryItem.name);
                    currentSourceQuery = '.' + selectorQueryItem.name;
                    selector = selector.slice(currentSourceQuery.length);
                    break;
                case 'spacing':
                    currentTarget = createSelectorDescendent();
                    res.push(currentTarget, createSelectorChunk());
                    const startSpaceMatch = selector.match(/^(\s)*/);
                    currentSourceQuery = startSpaceMatch && startSpaceMatch[0] || ' ';
                    selector = selector.slice(currentSourceQuery.length);
                    break;
                case 'operator':
                    if (selectorQueryItem.operator === '>') {
                        currentTarget = createSelectorDirectChild();
                        res.push(currentTarget, createSelectorChunk());
                        const startDirectChildMatch = selector.match(/^(\s*>\s*)?/);
                        currentSourceQuery = startDirectChildMatch && startDirectChildMatch[0] || 'no direct child found! - should not happen';
                        selector = selector.slice(currentSourceQuery.length);
                    }
                    break;
                case 'pseudo-class':
                    currentTarget.states.push(selectorQueryItem.name);
                    currentSourceQuery = ':' + selectorQueryItem.name;
                    selector = selector.slice(currentSourceQuery.length);
                    break;
                case 'pseudo-element':
                    currentTarget = createSelectorInternalChunk({ name: selectorQueryItem.name });
                    res.push(currentTarget);
                    currentSourceQuery = '::' + selectorQueryItem.name;
                    selector = selector.slice(currentSourceQuery.length);
                    break;
                case 'element':
                    currentTarget.type = selectorQueryItem.name;
                    currentSourceQuery = selectorQueryItem.name;
                    selector = selector.slice(currentSourceQuery.length);
                    break;
                case 'invalid':
                    currentSourceQuery = selectorQueryItem.value;
                    selector = selector.slice(currentSourceQuery.length).trim();
                    break;
            }
        }
        else {
            throw new Error(`found operator where it shouldn't be - should not happen`);
        }
        const queryLength = currentSourceQuery.length;
        const newPosition = currentPosition + queryLength;
        const isCursorInQuery = cursorIndex > currentPosition && cursorIndex <= newPosition;
        if (isCursorInQuery) {
            cursorTarget = {
                focusChunk: currentTarget,
                simpleSelector: currentSourceQuery,
                index: res.indexOf(currentTarget)
            };
        }
        currentPosition += queryLength;
    }
    // modify internal chunk to list from scope origin to target
    if (isSelectorInternalChunk(cursorTarget.focusChunk)) {
        let currentChunk = cursorTarget.focusChunk;
        let index = cursorTarget.index;
        const focusList = [];
        while (isSelectorInternalChunk(currentChunk)) {
            focusList.unshift(currentChunk);
            currentChunk = res[--index];
        }
        focusList.unshift(currentChunk);
        cursorTarget.focusChunk = focusList;
    }
    return {
        selector: res,
        target: cursorTarget
    };
    ;
}
exports.parseSelector = parseSelector;
// const selectorSpliter = /(?= )|(?=\.)|(?=#)|(?=\[)|(?=:)|(?=@)/;
// const selectorSpliter = /(?= )|(?=\.)|(?=>)|(?=:)/;
// export function parseSelector(selector:string, cursorIndex:number=0):{selector:SelectorQuery[], target:CursorPosition}{
//     const res:SelectorQuery[] = [];
//     const queryUnits = selector.split(selectorSpliter);
//     let currentTarget = createSelectorChunk();
//     let currentPosition = 0;
//     let cursorTarget = { focusChunk:{} as any, simpleSelector: '', index:-1 };
//     let focusPseudoElementChain:SelectorQuery[] = [];
//     let skipNext = false;
//     queryUnits.forEach((queryUnit, index) => {
//         if(skipNext){
//             skipNext = false;
//             return;
//         }
//         const prevRes = res[res.length-1] || currentTarget;
//         const typeChar = queryUnit[0];
//         switch(typeChar){
//             case '.':
//                 currentTarget.classes.push(queryUnit.slice(1));
//                 break;
//             case ' ':
//                 if(!isSelectorDescendent(prevRes) && !isSelectorDirectChild(prevRes)){
//                     res.push(currentTarget, createSelectorDescendent());
//                     currentTarget = createSelectorChunk();
//                 }
//                 break;
//             case '>':
//                 if(isSelectorDescendent(res[res.length-1])){
//                     res[res.length-1] = createSelectorDirectChild();
//                 } else {
//                     res.push(currentTarget, createSelectorDirectChild());
//                 }
//                 currentTarget = createSelectorChunk();
//                 break;
//             case ':':
//                 const nextQueryUnit = queryUnits[index+1];
//                 if(nextQueryUnit && nextQueryUnit[0] === ':'){ // pseudo-element
//                     res.push(currentTarget);
//                     queryUnit = ':' + nextQueryUnit;
//                     currentTarget = createSelectorInternalChunk({name:queryUnit.slice(2)});
//                     skipNext = true;
//                 } else { // pseudo-state
//                     currentTarget.states.push(queryUnit.slice(1));
//                 }
//                 break;
//             default:
//                 currentTarget.type = queryUnit;
//                 break;
//         }
//         const newPosition = currentPosition + queryUnit.length;
//         const isCursorInQuery = cursorIndex > currentPosition && cursorIndex <= newPosition;
//         if(isCursorInQuery){
//             cursorTarget = {
//                 focusChunk:currentTarget,
//                 simpleSelector: queryUnit,
//                 index:res.length
//             }
//         }
//         currentPosition += queryUnit.length;
//     });
//     res.push(currentTarget);
//     // modify internal chunk to list from scope origin to target
//     if(isSelectorInternalChunk(cursorTarget.focusChunk)){
//         let currentChunk:SelectorChunk = cursorTarget.focusChunk;
//         let index = cursorTarget.index;
//         const focusList:Array<SelectorChunk|SelectorInternalChunk> = [];
//         while(isSelectorInternalChunk(currentChunk)){
//             focusList.unshift(currentChunk);
//             currentChunk = res[--index] as SelectorChunk;
//         }
//         focusList.unshift(currentChunk);
//         cursorTarget.focusChunk = focusList;
//     }
//     return {
//         selector:res,
//         target:cursorTarget
//     };
// }
//# sourceMappingURL=selector-analyzer.js.map