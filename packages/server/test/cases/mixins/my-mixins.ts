export type scssfrag = string;
export type sstring = string;
export type snumber<
    min extends number | null = null,
    max extends number | null = null,
    mults extends number | null = null> = string;



export function expandOnHover(durationMS: snumber<0,200>, animationCurve: sstring, gaga: 'a'|'b'): scssfrag    {
    return "transition:\"all \"+durationMS+\"ms \"+animationCurve";
}
