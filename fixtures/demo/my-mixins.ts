export function paramfulMixin(
    numParam: string,
    strParam: string,
    aliasedParam: string,
    enumParam: 'a' | 'b'
): object {
    return {color: "red"};
}

export function paramlessMixin(): object {
    return {color: "goldenrod"}
}

export default function defaultMixin(pct: string): object {
    return {"max-width": pct + "%"}
}

export function paramlessFormatter(): string {
    return "goldenrod"
}

export function formatterWithParams(
    numParam: string,
    strParam: string,
    aliasedParam: string,
    enumParam: 'a' | 'b'): string {
        
    return "4";
}

