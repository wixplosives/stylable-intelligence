/**
 * A mixin with some params
 * @summary twoParamMixin
 * @param {stString} strParam A string param
 * @param {stNumber<0,200>} numParam A num param
 * @param {'a'|'b'} enumParam An enum param
 * @returns {stCssFrag}
 */
exports.aMixin = function (strParam, numParam, enumParam) {

}


/**
 * @description A mixin with no params
 * @summary noParamMixin
 * baga bgaa
 * @returns {stCssFrag} lalala
 * lalala lalala
 * {@link OOF}
 */

exports.aBareMixin = function () {

}

/**
 * @description A formatter with no params
 * @summary bareFormatter
 * baga bgaa
 * @returns {stColor} lalala
 */

exports.aFormatter = function () {

}

/**
 * A formatter with several params
 * @summary paramfulFormatter
 * @param {stString} strParam A string param
 * @param {stNumber<0,200>} numParam A num param
 * @param {'a'|'b'} enumParam An enum param
 * @returns {stString}
 */
exports.aFormatterWithParams = function (strParam, numParam, enumParam) {
    return 'a';
}
