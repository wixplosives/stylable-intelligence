import {darken as polishedDarken, lighten as polishedLighten} from 'polished';
import {stNumber, stColor} from "stylable";


/**
 * Lighten - lightens a color by a percentage.
*/
export default function lighten(amount: stNumber, color: stColor): stColor {
    return polishedLighten(parseInt(amount,10), color);
}


