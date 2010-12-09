/**
 * @author maccesch
 * @date 2009-03-23
 */

import('base.Util');
import('base.BasicNetwork');
import('core.Commands');
import('core.MainLoop');
import('core.Settings');

// export Network
var Network;

function package_core_Network() {

/**
 * Creates a new Network instance. Don't call this directly.
 * Use Network.instance instead, see end of this file.
 * @classDescription Class for communicating with the server
 * @type {Object}
 * @return {Network} The new instance
 * @extends BasicNetwork
 * @constructor
 *
 * The protocol for sending data is:
 * Only the url is used to transmit data. The http method is GET. The chunks of data
 * are separated by underlines ("_"). The first chunk determines the type of data. The
 * last chunk is always the client id. Except for the id request of course.
 * For example: cv_3.453_23.33_34_6.5_89_43.9
 *
 * The protocol for receiving data is:
 * Data is sent in plain text and one data chunk per line. The first line determines the
 * type of data. The last line is the client id of the sender.
 * For example: cv\n3.453\n23.33\n34\n6.5\n89\n43.9
 */
Network = function() {

	this._clientId = 0;
	this._sessionId = Util.Cookie.get(Settings.SESSION_COOKIE_NAME);
	
	this._receiveRequest = this.createRequest();
	this._responseIndex = 0;
	
	this._sendRequest = this.createRequest();
	
	this._openReceiveConnection();
}

Network.prototype = new BasicNetwork();


/**
 * Associative array of functions that are called when data is received.
 * The function that has the same key as the first line of the data is called.
 * For example if "xy\n3.2\n32.34" is received _onReceive['xy'] is called which 
 * takes two arguments because two lines following the data type line have to be read.
 * @see Network#addProtocolCallback
 */
Network.prototype._onReceive = {
	'id':	function(clientName, clientId) {
				Network.instance._clientName = clientName;
				Network.instance._clientId = clientId;
				// TODO : get welcome message from server
				Logger.instance.system('Welcome <b>' + Network.instance._clientName + '</b>.');
				Logger.instance.system('Use <b>w</b>, <b>a</b>, <b>s</b>, <b>d</b> to move, <b>c</b> to chat.');
			},
	'li':	function(xyzabc) {
				// TODO : implement: ask user to log in
			}
};

/**
 * Adds a callback function to the _onReceive array which is
 * called when the server sends a data push which starts with idPrefix.
 * The callback isn't called right away but a command is created with it and
 * registered with the main loop.
 * @param {String} idPrefix The prefix of the data push the callback should be associated with.
 * @param {Function} callback The callback function. For its signature see Network#_onReceive.
 * @method
 * @see Network#_onReceive
 * @see Network#_openReceiveConnection
 */
Network.prototype.addProtocolCallback = function(idPrefix, callback) {
	this._onReceive[idPrefix] = callback;
}

/**
 * Sends a list of strings to the server.
 * @param {Array} chunks The data to be sent.
 */
Network.prototype.sendChunks = function(chunks) {
	this.send(chunks.join('_'));
}

/**
 * Sends data :-D. Don't use this directly. Use sendChunks instead.
 * @param {String} data The data to send. See class description for protocol details.
 * @method
 */
Network.prototype.send = function(data) {

	this._sendRequest.open("GET", "/_" + data + "_" + this._sessionId, true);
	this._sendRequest.send(null);
};

/**
 * sends the recieve request, which will be kept open by the server and will be used to
 * push data to the client.
 * @method
 * @see Network#_receiveCallback
 */
Network.prototype._openReceiveConnection = function() {
	var self = this;
	this._receiveRequest.open("GET", "/_id_" + this._sessionId, true);
	this._receiveRequest.onreadystatechange = function() {
		self._receiveCallback();
	};
	this._receiveRequest.send(null);
};

/**
 * Is called when the server pushes data. It calls the appropriate function
 * stored in _onReceive
 * @method
 * @see Network#addProtocolCallback
 * @see Network#_onReceive
 */
Network.prototype._receiveCallback = function() {
	if (this._receiveRequest.readyState >= 3 && typeof(this._receiveRequest.responseText) != "unknown" && this._receiveRequest.responseText) {
		// TODO : if responseText gets too long dis- and reconnect

		var newText = this._receiveRequest.responseText.substr(this._responseIndex);
//		console.debug(newText);
		
		var responses = newText.split('\n');
		var i = 0;
		while (i < responses.length - 1) {
			// create commands with the data received an register them with main loop
			var callback = this._onReceive[responses[i]];
			
			// make sure that all data has been sent that is needed to create the command.
			// otherwise wait until the server sends again. see below.
			var linesNeeded = callback.length;
			if (i + linesNeeded < responses.length) {
				++i;
				var command = new Command(callback, this, responses.slice(i,  i + linesNeeded));
				MainLoop.instance.addCommand(command);
				i += linesNeeded;
			} else {
				break;
			}
		}
		
		// if not all data was used to create commands because some data is missing
		// set the _responseIndex to the beginning of the data that is incomplete
		var tailLen = 0;
		while (i < responses.length) {
			tailLen += responses[i].length + 1;
			++i;
		}
		if (tailLen)
			this._responseIndex += newText.length - tailLen + 1;
		else
			this._responseIndex += newText.length
	}
};

/**
 * Returns the client id.
 * @return {String} The client id.
 */
Network.prototype.getClientId = function() {
	return this._clientId;
}

/**
 * Returns the client name.
 * @return {String} The client name (name in the PlayerProfile).
 */
Network.prototype.getClientName = function() {
	return this._clientName;
}

Network.instance = new Network();

}