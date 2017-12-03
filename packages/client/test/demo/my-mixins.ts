import {stNumber, stString as lalaString} from 'stylable';
import * as styl from 'stylable';

export function expandOnHover(durationMS: stNumber<0,200>, animationCurve: lalaString, gaga: 'a'|'b'): styl.stCssFrag    {
    return "transition:\"all \"+durationMS+\"ms \"+animationCurve";
}
