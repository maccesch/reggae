/**
 * @author maccesch
 * This file contains extensions to the basic JavaScript types.
 */

/**
 * Converts this string to an int by parsing it with the given radix or 10.
 * @param {Number} [radix] The radix of the number representation. 10 by default.
 * @return {Number} The parsed int.
 */
String.prototype.toInt = function(radix) {
	return parseInt(this, radix || 10);
};

/**
 * Converts this string to a float by parsing it with the given radix or 10.
 * @param {Number} [radix] The radix of the number representation. 10 by default.
 * @return {Number} The parsed float.
 */
String.prototype.toFloat = function(radix) {
	return parseFloat(this, radix || 10);
};

/**
 * Converts this string to a ratio. Used for converting "50%" to 0.5
 * @param {Object} [max] The "100%" value. Defaults to 100.
 * @return {Number} The ratio. If the value represented by this string
 * is less than max then the return value is less than 1.
 */
String.prototype.toRatio = function(max) {
	return this.toInt() / (max || 100);
};

/**
 * Cuts all leading and trailing white spaces.
 */
if (!"d".trim) {
	String.prototype.trim = function() {
		return (this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, ""));
	};
}

/**
 * Checks if the specified string is a prefix of this string.
 * @param {String} str Prefix to check.
 * @return {Boolean} True if str is a prefix.
 * @see #endsWith
 */
String.prototype.startsWith = function(str) {
	return (this.match("^" + str) == str);
};

/**
 * Checks if the specified string is a postfix of this string.
 * @param {String} str Postfix to check.
 * @return {Boolean} True if str is a postfix.
 * @see #startsWith
 */
String.prototype.endsWith = function(str) {
	return (this.match(str + "$") == str);
};
