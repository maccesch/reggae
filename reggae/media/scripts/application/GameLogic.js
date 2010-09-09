/**
 * @author maccesch
 */
 
import('base.InputManager');
import('core.Network');
import('core.MainLoop');
import('management.Controller');
import('management.Chat');
import('base.GeometricMath');

 
// export GameLogic
var GameLogic;
 
function package_application_GameLogic() {
 
/**
 * Creates a new instance of GameLogic. Don't use this directly, use GameLogic.instance instead which is initialized by Engine.init.
 * @classDescription Provides all game logic like response to user input and collision detection.
 * @constructor
 */
GameLogic = function() {
	this._inputManager = new InputManager(document);
	
	Network.instance.addProtocolCallback('ctrl', this._onControlReceive);
}

/**
 * Callback for network control data receive. Protocol prefix is "ctrl" for "ConTRoL".
 * @param {String} input The key or mouse button
 * @param {String} actionId The inputActions key. See this.inputActions
 * @param {Integer} clientId The id of the client the control belongs to (should be always this client)
 * @see Network#_onReceive
 */
GameLogic.prototype._onControlReceive = function(input, actionId, clientId) {
	
	var actionCallback = GameLogic.instance.inputActions[actionId];
	
	GameLogic.instance._inputManager.setKeyEventHandler(input, InputManager.DOWN, actionCallback);
	GameLogic.instance._inputManager.setKeyEventHandler(input, InputManager.UP, actionCallback);

	// TODO : this belongs in some world ready event
	MainLoop.instance.doObjectValidation = _doObjectValidation;
}

/**
 * Does the actual movement evaluation. GAME_LOGIC
 * @param {Object} deltaT
 */
var _doObjectValidation = function(deltaT) {
	var player = GameLogic.instance.getPlayer();

	if (player.nextX < 1300) {
		player.nextX = 1300;
		Controller.instance.changeVelocity(player, 0, player.vy, player.vz);
	}
	if (player.nextY < 1300) {
		player.nextY = 1300;
		Controller.instance.changeVelocity(player, player.vx, 0, player.vz);
	}
	if (player.nextX > 11500) {
		player.nextX = 11500;
		Controller.instance.changeVelocity(player, 0, player.vy, player.vz);
	}
	if (player.nextY > 11500) {
		player.nextY = 11500;
		Controller.instance.changeVelocity(player, player.vx, 0, player.vz);
	}
}


/**
 * Moves the player to the left. GAME_CODE
 */
var _onLeft = function(key, action) {
	var vx = action == InputManager.DOWN ? -0.1 : 0;
	var player = GameLogic.instance.getPlayer();
	var v = [vx, player.vy, player.vz].norm().times(0.1);
	Controller.instance.changeVelocity(player, v[0], v[1], v[2]);
}
            
/**
 * Moves the player to the right. GAME_CODE
 */
var _onRight = function(key, action) {
	var vx = action == InputManager.DOWN ? 0.1 : 0;
	var player = GameLogic.instance.getPlayer();
	var v = [vx, player.vy, player.vz].norm().times(0.1);
	Controller.instance.changeVelocity(player, v[0], v[1], v[2]);
}

/**
 * Moves the player to the top. GAME_CODE
 */
var _onTop = function(key, action) {
	var vy = action == InputManager.DOWN ? -0.1 : 0;
	var player = GameLogic.instance.getPlayer();
	var v = [player.vx, vy, player.vz].norm().times(0.1);
	Controller.instance.changeVelocity(player, v[0], v[1], v[2]);
}

/**
 * Moves the player to the bottom. GAME_CODE
 */
var _onBottom = function(key, action) {
	var vy = action == InputManager.DOWN ? 0.1 : 0;
	var player = GameLogic.instance.getPlayer();
	var v = [player.vx, vy, player.vz].norm().times(0.1);
	Controller.instance.changeVelocity(player, v[0], v[1], v[2]);
}

/**
 * Shows the chat enter line and deactivates the input manager.
 * @param {Object} key
 * @param {Object} action
 */
var _onChat = function(key, action) {
	if (action == InputManager.UP) {
		GameLogic.instance._inputManager.setActive(false);
		
		// create chat form
		var chatForm = document.createElement('form');
		chatForm.action = '#';
		chatForm.onsubmit = function(event){
			// stop form submit
			event = event || window.event;
			event.preventDefault();
			event.stopPropagation();
			
			// send message
			var playerId = GameLogic.instance.getPlayer().id;
			var message = chatInput.value;
			Chat.instance.sendMessage(playerId, message);
			
			// remove chat input
			document.body.removeChild(chatForm);
			
			// reactivate the input manager
			GameLogic.instance._inputManager.setActive(true);
		}
		
		// add and show chat input
		var chatInput = document.createElement('input');
		chatInput.type = "text";
		chatInput.value = "";
		chatInput.setAttribute('style', "position: fixed; bottom: 10px; left: 130px; width: 600px;");
		chatForm.appendChild(chatInput);
		document.body.appendChild(chatForm);
		chatInput.focus();
	}
}

/**
 * Maps an action id to a function that is executed when the proper input occurs.
 * The function receives two arguments key and action. GAME_CODE
 * @see InputManager.prototype.setKeyEventHandler 
 */
GameLogic.prototype.inputActions = {
	'left': _onLeft,
	'right': _onRight,
	'top': _onTop,
	'bottom': _onBottom,
	'chat': _onChat,
};

/**
 * Returns the player model element, that should be directly controlled by the player. GAME_CODE
 * @method
 */
GameLogic.prototype.getPlayer = function() {
	// TODO : this is not the right way to determine the player element
	if (!this._player) {
		var views = Controller.instance._idToView[Network.instance.getClientId()];
		for (key in views) {
			this._player = views[key].getModelElement();
			break; 
		}
	}
	return this._player;
}

/**
 * Returns all model elements currently known. GAME_CODE
 * @method
 */
GameLogic.prototype.getModelElements = function() {
	// TODO : make Controller method out of this
	var elements = [];
	for (key in Controller.instance._idToViews) {
		var views = Controller.instance._idToViews[key];
		for (var key2 in views) {
			elements.push(views[key2].getModelElement());
		}
	}
	return elements;
}

GameLogic.instance = new GameLogic();

}