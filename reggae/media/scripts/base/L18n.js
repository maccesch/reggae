/**
 * @author maccesch
 */

/**
 * Internationalization object.
 */
var L18n = {
	DECIMAL_POINT: ",",
	DECIMAL_POINT_KEYCODE: null,
	DECIMAL_POINT_REGEXP: null
};

switch (L18n.DECIMAL_POINT) {
	case ",":
		L18n.DECIMAL_POINT_KEYCODE = 188;
		L18n.DECIMAL_POINT_REGEXP = /,/;
		break;
	case ".":
		L18n.DECIMAL_POINT_KEYCODE = 190;
		L18n.DECIMAL_POINT_REGEXP = /\./;
		break;
}
