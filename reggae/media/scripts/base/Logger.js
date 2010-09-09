// export Logger
var Logger;

function package_base_Logger() {

/**
 * Creates a new instance of Logger. Don't use this directly but Logger.instance, see end of this file.
 * @classDescription Provides a logging service.
 * @constructor
 */
Logger = function() {
	this._element = this._createLogElement();
}

/**
 * Creates the html where the log is diplayed in and puts it into the site. GAME_CODE
 * @return {HTMLElement} The element that should be logged into.
 */
Logger.prototype._createLogElement = function() {
	var width = 270;
	var logEl = document.createElement('div');
	logEl.setAttribute('style', 'position: absolute; left: 704px; top: 114px; width: ' + width + 'px; ' +  
			'height: 396px; background: #eeeeee; border: 2px solid silver; overflow: hidden;' + 
			'font-size: 14px; padding: 0 10px 0 43px;');
	var content = document.createElement('div');
	content.setAttribute('style', 'position: absolute; bottom: 0px; width: ' + width + 'px');

	logEl.appendChild(content);	
	document.body.appendChild(logEl);

	return content;
}

/**
 * Formats a number to have two digits.
 * @param {Number} number 0 <= number <= 99
 * @return {String} The formatted string.
 */
Logger.prototype._twoDigits = function(number) {
	return number < 10 ? '0' + number : '' + number
}

/**
 * Adds a message to the log
 * @param {String} message The new message. Has to be safe, because html tags are evaluated!
 * @param {String} color The color of the message as hex string
 */
Logger.prototype._log = function(message, color) {
	var element = document.createElement('div');
	element.setAttribute('style', 'color: ' + color);
	
	var now = new Date();
//	now.getYear() + '-' + (now.getMonth()+1) + '-' + now.getDate()
	var timePrefix = "<span style='font-family: monospace; font-size: 10px; color: #444444; margin: 0 6px 0 -37px;'>" + 
			this._twoDigits(now.getHours()) + ':' + this._twoDigits(now.getMinutes()) + "</span>";
	
	element.innerHTML = timePrefix + message;
	this._element.appendChild(element);
}

/**
 * Adds a chat message to the log.
 * @param {String} message The message
 * @param {String} userName Name of the sender of the message
 * @param {Boolean} isMyself True if I sent the message
 */
Logger.prototype.chat = function(message, userName, isMyself) {
	this._log('<b>' + userName + ':</b> ' + message, isMyself ? '#0000dd' : '#000066');
}

/**
 * Adds a system message to the log.
 * @param {Object} message The system message
 */
Logger.prototype.system = function(message) {
	this._log('<i>' + message + '</i>', '#990000');
}

Logger.instance = new Logger();

}