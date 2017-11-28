/**
* Expand
* @param {stylable.number} [durationMS=200] {min:0,max:3000} - total animation time MS
* @param {stylable.percentage} [increaseBy=1.5] - how much to increase size;
* @param {stylable.bezierCurves} [animationCurve=cubicEaseIn] - animation change over time curve
* @returns {stylable.CssFragment}
*/
export function expandOnHover(durationMS,increaseBy,animationCurve){
    return {
        transition:"all "+durationMS+"ms "+animationCurve
    }
}
