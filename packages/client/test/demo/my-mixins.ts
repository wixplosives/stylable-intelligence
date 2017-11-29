import * as stype from './stylable-types';

export function expandOnHover(durationMS: stype.snumber<0,200>, animationCurve: stype.sstring, gaga: 'a'|'b'): stype.scssfrag    {
    return "transition:\"all \"+durationMS+\"ms \"+animationCurve";
}


let a = expandOnHover()
