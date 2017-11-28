import * as stype from './stylable-types'

export function expandOnHover(durationMS: stype.snumber, animationCurve: stype.sstring): string {
    return "transition:\"all \"+durationMS+\"ms \"+animationCurve";
}
