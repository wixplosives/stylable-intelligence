import * as stype from './stylable-types';

export function expandOnHover(durationMS: stype.snumber<0,200>, animationCurve: stype.sstring, gaga: 'a'|'b'): string {
    return "transition:\"all \"+durationMS+\"ms \"+animationCurve";
}
