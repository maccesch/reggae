/**
 * @author maccesch
 */
/**
 * Utility object.
 */
var Util = {};

/**
 * Object for simple cookie management.
 */
Util.Cookie = {};

/**
 * Puts a new key value pair into the cookie
 * @param {String} key The key name of the pair
 * @param {String} value The value of the pair
 * @param {Number} [days] How many days this pair should be stored. If omitted the pair won't expire at all.
 * @method
 */
Util.Cookie.put = function(key, value, days) {
	var expires;
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		expires = "; expires=" + date.toGMTString();
	}
	else {
		expires = "";
	}
	document.cookie = key + "=" + value + expires + "; path=/";
}

/**
 * Gets the value for a given key.
 * @param {String} key The key name.
 * @return {String} The value for the given key. If the key isn't in the cookie null is returned.
 * @method
 */
Util.Cookie.get = function(key) {
	var nameEQ = key + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; ++i) {
		
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1, c.length);
		}
		
		if (c.indexOf(nameEQ) == 0) {
			return c.substring(nameEQ.length, c.length);
		}
	}
	return null;
}

/**
 * Deletes the key value pair from the cookie.
 * @param {Object} key The key name of the pair to be deleted.
 */
Util.Cookie.remove = function(key) {
	Util.Cookie.put(key,"",-1);
}
