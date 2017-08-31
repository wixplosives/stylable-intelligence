const selectorTokenizer = require('css-selector-tokenizer');

export interface SelectorQuery {
    _type: string;
    text: string[];
}
export interface SelectorChunk extends SelectorQuery {
    type: string;
    classes: string[];
    states: string[];
}
export interface SelectorInternalChunk extends SelectorChunk {
    name: string;
}
export interface SelectorDescendent extends SelectorQuery { }
export interface SelectorDirectChild extends SelectorQuery { }

export interface CursorPosition {
    focusChunk: SelectorQuery | Array<SelectorChunk | SelectorInternalChunk>;
    index: number;
}

export function createSelectorChunk(value?: Partial<SelectorChunk>): SelectorChunk {
    return { type: '*', classes: [], states: [], text: [], ...value, _type: 'chunk' };
}

export function createSelectorInternalChunk(value?: Partial<SelectorInternalChunk>): SelectorInternalChunk {
    return { name: '', ...createSelectorChunk(value), _type: 'internal-chunk' };
}
export function createSelectorDescendent(): SelectorDescendent {
    return { _type: 'descendent', text:[] };
}
export function createSelectorDirectChild(): SelectorDirectChild {
    return { _type: 'direct-child', text:[] };
}

export function isSelectorChunk(chunk: SelectorQuery): chunk is SelectorInternalChunk {
    return chunk && chunk._type === 'chunk';
}
export function isSelectorInternalChunk(chunk: SelectorQuery): chunk is SelectorInternalChunk {
    return chunk && chunk._type === 'internal-chunk';
}
export function isSelectorDescendent(chunk: SelectorQuery): chunk is SelectorDescendent {
    return chunk && chunk._type === 'descendent';
}
export function isSelectorDirectChild(chunk: SelectorQuery): chunk is SelectorDirectChild {
    return chunk && chunk._type === 'direct-child';
}

export function parseSelector(inputSelector: string, cursorIndex: number = 0): { selector: SelectorQuery[], target: CursorPosition } {
    const res: SelectorQuery[] = [];
    const textArr:string[] = [];
    let cursorTarget = { focusChunk: {} as any, text: textArr, index: -1 };
    const tokenizedSelectors = selectorTokenizer.parse(inputSelector);

    if (tokenizedSelectors.type !== 'selectors') {
        throw new Error('not handled');
    }

    const firstSelector = tokenizedSelectors.nodes[0];
    const spaceBeforeSelector = inputSelector.match(/^(\s)*/);
    let selector = inputSelector.trim();
    let currentPosition = spaceBeforeSelector && spaceBeforeSelector[0].length || 0;
    let currentSourceQuery: string = '';
    res.push(createSelectorChunk());
    for (let i = 0; i < firstSelector.nodes.length; i++) {
        const selectorQueryItem = firstSelector.nodes[i];
        let currentTarget = res[res.length - 1];
        if (isSelectorChunk(currentTarget) || isSelectorInternalChunk(currentTarget)) {
            switch (selectorQueryItem.type) {
                case 'class':
                    currentSourceQuery = '.' + selectorQueryItem.name;
                    currentTarget.text.push(currentSourceQuery);
                    currentTarget.classes.push(selectorQueryItem.name);
                    selector = selector.slice(currentSourceQuery.length);
                    break;
                case 'spacing':
                    const startSpaceMatch = selector.match(/^(\s)*/);
                    currentSourceQuery = startSpaceMatch && startSpaceMatch[0] || ' ';
                    currentTarget = createSelectorDescendent();
                    currentTarget.text.push(currentSourceQuery);
                    res.push(currentTarget, createSelectorChunk());
                    selector = selector.slice(currentSourceQuery.length);
                    break;
                case 'operator':
                    if (selectorQueryItem.operator === '>') {
                        const startDirectChildMatch = selector.match(/^(\s*>\s*)?/);
                        currentSourceQuery = startDirectChildMatch && startDirectChildMatch[0] || 'no direct child found! - should not happen';
                        currentTarget = createSelectorDirectChild();
                        currentTarget.text.push(currentSourceQuery);
                        res.push(currentTarget, createSelectorChunk());
                        selector = selector.slice(currentSourceQuery.length);
                    }
                    break;
                case 'pseudo-class':
                    currentSourceQuery = ':' + selectorQueryItem.name;
                    currentTarget.text.push(currentSourceQuery);
                    currentTarget.states.push(selectorQueryItem.name);
                    selector = selector.slice(currentSourceQuery.length);
                    break;
                case 'pseudo-element':
                    currentSourceQuery = '::' + selectorQueryItem.name;
                    currentTarget.text.push(currentSourceQuery);
                    currentTarget = createSelectorInternalChunk({ name: selectorQueryItem.name });
                    res.push(currentTarget);
                    selector = selector.slice(currentSourceQuery.length);
                    break;
                case 'element':
                    currentSourceQuery = selectorQueryItem.name;
                    currentTarget.text.push(currentSourceQuery);
                    currentTarget.type = selectorQueryItem.name;
                    selector = selector.slice(currentSourceQuery.length);
                    break;
                case 'invalid':
                    currentSourceQuery = selectorQueryItem.value;
                    currentTarget.text.push(currentSourceQuery);
                    selector = selector.slice(currentSourceQuery.length).trim();
                    break;
            }
        } else {
            throw new Error(`found operator where it shouldn't be - should not happen`);
        }
        const queryLength = currentSourceQuery.length;
        const newPosition = currentPosition + queryLength;
        const isCursorInQuery = cursorIndex > currentPosition && cursorIndex <= newPosition;
        if (isCursorInQuery) {
            cursorTarget = {
                focusChunk: currentTarget,
                text: currentTarget.text,
                index: res.indexOf(currentTarget)
            }
        }
        currentPosition += queryLength;
    }

    // modify internal chunk to list from scope origin to target
    if (isSelectorInternalChunk(cursorTarget.focusChunk)) {
        let currentChunk: SelectorChunk = cursorTarget.focusChunk;
        let index = cursorTarget.index;
        const focusList: Array<SelectorChunk | SelectorInternalChunk> = [];
        while (isSelectorInternalChunk(currentChunk)) {
            focusList.unshift(currentChunk);
            currentChunk = res[--index] as SelectorChunk;
        }
        focusList.unshift(currentChunk);
        cursorTarget.focusChunk = focusList;
    }

    return {
        selector: res,
        target: cursorTarget
    };;
}

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
