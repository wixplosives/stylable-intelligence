import {darken as polishedDarken, lighten as polishedLighten} from 'polished';
import {stNumber, stColor} from "stylable";


/**
 * Lighten - lightens a color by a percentage.
*/
export function lighten({amount, color}: {amount: stNumber, color: stColor}): stColor {
    return polishedLighten(parseInt(amount,10), color);
}

lighten({amount: '5', color: 'f'})


