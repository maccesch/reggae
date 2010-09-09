/**
 * @author maccesch
 */

import('base.Logger');
import('core.Network');
import('management.Controller');

// export Chat
var Chat;

function package_management_Chat() {

/**
 * Creates a new instance of Chat. Don't use this directly,
 * use Chat.instance instead, see end of this file
 * @classDescription Takes care of instant messaging.
 * @constructor
 */
Chat = function() {
	Network.instance.addProtocolCallback('msg', this._onMessageReceive);
}

/**
 * Horizontal bias of the speech bubble relative to the left of the view element in pixel. 
 */
Chat.BUBBLE_BIAS_LEFT = 15;

/**
 * Vertical bias of the speech bubble relative to the bottom of the view element in pixel. 
 */
Chat.BUBBLE_BIAS_BOTTOM = 30;

/**
 * Path to the speech bubble tip image path relative to the base image path.
 */
Chat.BUBBLE_TIP_PATH = 'bubble-tip.png';

/**
 * Height of the bubble tip
 */
Chat.BUBBLE_TIP_HEIGHT = 14;

/**
 * Total height of the speech bubble in pixel.
 */
Chat.BUBBLE_OPACITY = 0.8;

/**
 * Padding of the speech bubble in pixel. Padding isn't added to width or height like in html!
 */
Chat.BUBBLE_PADDING = 10;

/**
 * Font family of the text in the speech bubble
 */
Chat.BUBBLE_FONT_FAMILY = 'Helvetica, Arial, sans-serif';

/**
 * Font size in pixel of the text in the speech bubble
 */
Chat.BUBBLE_FONT_SIZE = 12;

/**
 * Maximum number of characters allowed per message
 */
Chat.MAX_MESSAGE_LENGTH = 128;


/**
 * Returns the bubble element for the given arguments.
 * @param {Number, String} elementId The model element id of the model element that says the message
 * @return {HTMLElement} The html element that contains the message text.
 */
Chat.prototype.getBubble = function(clientId, elementId) {
	
	var key = "_bubble_" + elementId;
	var bubbleEl = document.getElementById(key);
	if (!bubbleEl) {
		bubbleEl = this._createBubble(clientId, elementId);
	}
	
	return bubbleEl;
}

/**
 * Creates the bubble html element and decorates the players view with it
 * @param {Number, String} clientId The client id of the sender of messages to be shown in the bubble
 * @param {Number, String} elementId The model element id of the model element that will be saying the messages in the bubble
 * @return {HTMLElement} The bubble html element
 */
Chat.prototype._createBubble = function(clientId, elementId) {
		var view = Controller.instance.getView(clientId, elementId);
		if (!view) {
			return null;
		}

		var pad2 = Chat.BUBBLE_PADDING * 2;
		var bubble = document.createElement('div');
		bubble.id = "_bubble_" + elementId;
		bubble.setAttribute('style', 'position: absolute; padding: ' + Chat.BUBBLE_PADDING + 'px; width: ' + 
				'0px; opacity: ' + Chat.BUBBLE_OPACITY + '; background: ' +
				'#ffffff; border: 2px solid #000000; -moz-border-radius: 10px; -webkit-border-radius: 10px; border-radius: 10px; left: ' + 
				Chat.BUBBLE_BIAS_LEFT + 'px; bottom: ' + Chat.BUBBLE_BIAS_BOTTOM + 'px; font-family: ' + 
				Chat.BUBBLE_FONT_FAMILY + '; font-size: ' + Chat.BUBBLE_FONT_SIZE + 'px; ' + // TODO : alignment configurable?
				'text-align: center; visibility: hidden;');

		var bubbleContent = document.createElement('span');
		bubble.appendChild(bubbleContent);
				
		var bubbleTip = document.createElement('img');
		bubbleTip.src = settings.getImagesPath() + Chat.BUBBLE_TIP_PATH;
		bubbleTip.setAttribute('style', 'position: absolute; bottom: -' + (Chat.BUBBLE_TIP_HEIGHT) + 'px; ' +
			'left: 20px; ');
		bubble.appendChild(bubbleTip);
		
		// put the bubble element into the view element so it moves along
		view.decorate(bubble);

		return bubble;
}

/**
 * Returns the width of the speech bubble dependent on the length of its text.
 * @param {Number} charNo Number of characters in the text to be diplayed in the bubble.
 * @return {Number} Width in pixel.
 */
Chat.prototype._calcBubbleWidth = function(charNo) {
		return Math.log(charNo + 3) * 25;
}
	

/**
 * Shows the given message in a bubble from the model element specified by the arguments
 * @param {Number, String} clientId Client id of the owner of the model element speaking
 * @param {Number, String} elementId Id of the element speaking
 * @param {String} message The cleaned message text
 */
Chat.prototype.showMessageInBubble = function(clientId, elementId, message) {
	var bubble = this.getBubble(clientId, elementId);
	bubble.firstChild.innerHTML = message;
	bubble.style.visibility = 'visible';
	bubble.style.width = Chat.instance._calcBubbleWidth(message.length) + 'px';
	
	// TODO : fade out
	if (bubble._timer) {
		window.clearTimeout(bubble._timer);
	}
	bubble._timer = window.setTimeout(function() {
		var _bubble = Chat.instance.getBubble(clientId, elementId);
		if (_bubble) {
			_bubble.style.visibility = 'hidden';
		}
	}, 5000 + message.length*100);
}

/**
 * Removes potential harmful html from the given message by rendering html tags useless
 * @param {String} message The message to be cleaned.
 * @return {String} The cleaned message.
 */
Chat.prototype._cleanMessage = function(message) {
	var maxWordLength = 10;
	message = message.replace('<', '&lt;').replace('>', '&gt;');
	var words = message.split(' ');
	for (var i = 0; i < words.length; ++i) {
		var word = words[i];
		if (word.length > maxWordLength) {
			words[i] = "";
			for (var j = 1; j <= word.length / maxWordLength; ++j) {
				words[i] += word.slice(maxWordLength * (j - 1), maxWordLength * j) + '&shy;';
			}
			words[i] += word.slice(maxWordLength * (j - 1));
		}
	}
	return words.join(' ');
}

/**
 * Callback for network instant message receive. Protocol prefix is "msg" for "MeSsaGe". 
 * @param {Integer} elementId The id of the model element that sends the message
 * @param {String} message The message itself
 * @param {String} senderName The name of the sender
 * @param {Integer} clientId The id of the client who sends the message
 * @see Network#_onReceive
 * @see Chat#sendMessage
 */
Chat.prototype._onMessageReceive = function(elementId, message, senderName, clientId) {

	message = Chat.instance._cleanMessage(unescape(message));
	senderName = Chat.instance._cleanMessage(unescape(senderName));
	
	Chat.instance.showMessageInBubble(clientId, elementId, message);
	
	// log the message
	Logger.instance.chat(message, senderName, false);
}

/**
 * Sends an instant message to the server for distribution
 * @param {Number, String} elementId The id of the model element speaking
 * @param {String} message The message
 */
Chat.prototype.sendMessage = function(elementId, message) {
	var myName = Network.instance.getClientName();
	// TODO : private messages
	Network.instance.sendChunks(['msg', elementId, escape(message), escape(myName)]);

	message = Chat.instance._cleanMessage(message);
	myName = Chat.instance._cleanMessage(myName);

	// show your own bubble			
	Chat.instance.showMessageInBubble(Network.instance.getClientId(), elementId, message);

	// log the message
	Logger.instance.chat(message, myName, true);
}

Chat.instance = new Chat();

}