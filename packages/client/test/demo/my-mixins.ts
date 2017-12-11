import {stNumber, stString as lalaString} from 'stylable';
import * as styl from 'stylable';


export function paramfulMixin(
    numParam: stNumber<0,200> = '50',
    strParam: styl.stString,
    aliasedParam: lalaString,
    enumParam: 'a'|'b'
): styl.stCssFrag    {
    return "color: red";
}

export function paramlessMixin(): styl.stCssFrag {
    return "color: goldenrod"
}

