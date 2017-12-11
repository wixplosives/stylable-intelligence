import {darken, lighten as polishedLighten} from 'polished';
/**
* Lighten - lightens a color by a percentage.
* @param {stylable.percentage} [amount=50] - How much to lighten.
* @param {stylable.color} color - The color to lighten
* @returns {stylable.color}
*/
export function lighten(amount,color){
    return polishedLighten(amount,color);
}

/**
* Darken - darkens a color by a percentage.
* @param {stylable.percentage} [amount=50] - How much to darken.
* @param {stylable.color} color - The color to darken
* @returns {stylable.color}
*/
export default function darken(amount,color){
    return darken(amount,color);
}
