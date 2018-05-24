import {darken as polishedDarken, lighten as polishedLighten} from 'polished';

/**
 * Lighten - lightens a color by a percentage.
*/
export default function lighten(amount: string, color: string): string {
    return polishedLighten(parseInt(amount,10), color);
}


