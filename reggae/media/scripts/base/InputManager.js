/**
 * @author maccesch
 */
/**
 * Creates a new instance of InputManager.
 * @classDescription This manages alle keyboard and mouse inputs inside the root element
 * by registering its methods as callbacks to the rootElement.
 * It provides an abstraction of the input model.
 * @param {HTMLElement} rootElement The html element to catch to events from.
 * @type {Object}
 * @return {InputManager} The new instance.
 * @constructor
 */
function InputManager(rootElement) {

	this.rootElement = rootElement;
	
	this.onMouseDown = [
	   function() {},
	   function() {},
	   function() {}
	];
	this.onMouseUp = [
	   function() {},
	   function() {},
	   function() {}
	];
	this.lastMouseX = 0;
	this.lastMouseY = 0;
	
	this.onKeyDown = [];
	this.onKeyUp = [];
	
	/**
	 * An array of boolean values which indicate if the corresponding key is current being pressed.
	 * The indices are the character codes of the uppercase characters.
	 * @example if (keyIsDown["A".charCodeAt(0)]) { alert("AKEY is being pressed"); }
	 */
	this.keyIsDown = [];
	
	/**
	 * An array of boolean values which indicate if the corresponding mouse butten
	 * is current being pressed.
	 * The indices can be one of InputManager.LMB, InputManager.MMB or InputManager.RMB.
	 */
	this.mouseButtonIsDown = [];
	
	var self = this;
	this.rootElement.onkeydown = function(event) {
		self.keyDownCallback(event);
	};
	this.rootElement.onkeyup = function(event) {
		self.keyUpCallback(event);
	};
	
	this._active = true;
}

// TODO : replace set with add
/**
 * Registers an event handler callback function.
 * @param {Number} mouseButton Specifies the mouse button. Can be one of
 * InputManager.LMB, InputManager.MMB or InputManager.RMB.
 * @param {Number} action Specifies whether the mouse button is pressed or released.
 * Can be InputManager.DOWN or InputManager.UP.
 * @param {Function} callback The callback function that should be called when the specified
 * event is fired. The callback will be passed these arguments: x, y, mouseButton, action.
 * x and y are the coordinates of the mouse pointer, mouseButton and action will have the same
 * values, that where specified here.
 * @method
 */
InputManager.prototype.setMouseButtonEventHandler = function(mouseButton, action, callback) {
	var self = this;
	switch (action) {
		case InputManager.UP:
			this.onMouseUp[mouseButton] = callback;
			this.rootElement.onmouseup = function(event) {
				self.mouseUpCallback(event);
			};
			break;
		case InputManager.DOWN:
			this.onMouseDown[mouseButton] = callback;
			this.rootElement.onmousedown = function(event) {
				self.mouseDownCallback(event);
			};
			break;
	}
};

/**
 * Registers an event handler callback function.
 * @param {Function} callback The callback function that should be called when the mouse is moved.
 * The callback will be passed these arguments: x, y, deltaX, deltaY.
 * x and y are the coordinates of the mouse pointer, deltaX and deltaY are the differences
 * between the coordinates of the last mousemove event and this'.
 * @method
 */
InputManager.prototype.setMouseMoveEventHandler = function(callback) {
	var self = this;
	
	this.onMouseMove = callback;
	this.rootElement.onmousemove = function(event) {
		self.mouseMoveCallback(event);
	};
};

/**
 * Registers an event handler callback function.
 * @param {String} key Specifies the key. For example "a" for the A-key.
 * @param {Number} action Specifies whether the key is pressed or released.
 * Can be InputManager.DOWN or InputManager.UP. Note that the callpack for an DOWN event
 * will be called once when the key is pressed and will not be called again until the
 * key was released.
 * @param {Function} callback The callback function that should be called when the specified
 * event is fired. The callback will be passed these arguments: key, action.
 * key and action will have the same values, that where specified here.
 * @method
 */
InputManager.prototype.setKeyEventHandler = function(key, action, callback) {
	var keyCode = key.toUpperCase().charCodeAt(0);
	// TODO : special keys
	
	switch (action) {
		case InputManager.DOWN:
			this.onKeyDown[keyCode] = callback;
			break;
		case InputManager.UP:
			this.onKeyUp[keyCode] = callback;
			break;
	}
};

/**
 * Left Mouse Button.
 * @see #addMouseButtonEventHandler
 */
InputManager.LMB = 0;
/**
 * Middle Mouse Button.
 * @see #addMouseButtonEventHandler
 */
InputManager.MMB = 1;
/**
 * Right Mouse Button.
 * @see #addMouseButtonEventHandler
 */
InputManager.RMB = 2;

/**
 * Button pressed.
 * @see #addMouseButtonEventHandler
 * @see #addKeyboardEventHandler
 */
InputManager.DOWN = 0;
/**
 * Button released.
 * @see #addMouseButtonEventHandler
 * @see #addKeyboardEventHandler
 */
InputManager.UP = 1;

// this is registered with document.body
InputManager.prototype.mouseDownCallback = function(event) {
	if (!this._active) {
		return;
	}
	
	var x = (document.all) ? window.event.x + document.body.scrollLeft : event.pageX;
	var y = (document.all) ? window.event.y + document.body.scrollTop : event.pageY;
	
	var mbutton = this.getMouseButton(event);
	this.mouseButtonIsDown[mbutton] = true;
	
	this.onMouseDown[mbutton](x, y, mbutton, InputManager.DOWN);
	
	return false;
};

// this is registered with document.body
InputManager.prototype.mouseUpCallback = function(event) {
	if (!this._active) {
		return;
	}

	var x = (document.all) ? window.event.x + document.body.scrollLeft : event.pageX;
	var y = (document.all) ? window.event.y + document.body.scrollTop : event.pageY;
	
	var mbutton = this.getMouseButton(event);
	this.mouseButtonIsDown[mbutton] = false;
	
	this.onMouseUp[mbutton](x, y, mbutton, InputManager.UP);
	
	return false;
};

// gets the mouse button from the event
InputManager.prototype.getMouseButton = function(event) {
	var mbutton;
	event = event || window.event;
	if (event.button) {
		if (document.all) {
			switch (event.button) {
				case 1:
					mbutton = InputManager.LMB;
					break;
				case 2:
					mbutton = InputManager.RMB;
					break;
				case 4:
					mbutton = InputManager.MMB;
					break;
			}
		}
		else {
			mbutton = event.button;
		}
	}
	else if (event.which) {
		mbutton = event.which - 1;
	}
	return mbutton;
};

/**
 * Gets the key code from an event.
 * @param {Object} event The event from the event handler function.
 * @return {Number} The key code
 */
InputManager.getKeyCode = function(event) {
	var code;
	event = event || window.event;
	if (event.keyCode) {
		code = event.keyCode;
	}
	else if (event.which) {
		code = event.which;
	}
	return code;
};

// this is registered with document.body
InputManager.prototype.keyDownCallback = function(event) {
	if (!this._active) {
		return;
	}

	var code = InputManager.getKeyCode(event);
	
	if (!this.keyIsDown[code]) {
		this.keyIsDown[code] = true;
		if (this.onKeyDown[code]) {
			this.onKeyDown[code](code, InputManager.DOWN);
		}
	}
	
	return false;
};

// this is registered with document.body
InputManager.prototype.keyUpCallback = function(event) {
	if (!this._active) {
		return;
	}

	var code = InputManager.getKeyCode(event);
	
	this.keyIsDown[code] = false;
	if (this.onKeyUp[code]) {
		this.onKeyUp[code](code, InputManager.UP);
	}
	
	return false;
};

// this is registered with document.body
InputManager.prototype.mouseMoveCallback = function(event) {
	if (!this._active) {
		return;
	}

	// TODO : how to do this nowadays? see also the other mouse callbacks.
	var x = (document.all) ? window.event.x + document.body.scrollLeft : event.pageX;
	var y = (document.all) ? window.event.y + document.body.scrollTop : event.pageY;
	
	this.onMouseMove(x, y, this.lastMouseX - x, this.lastMouseY - y);
	this.lastMouseX = x;
	this.lastMouseY = y;
	
	return false;
};

/**
 * Activates or deactivates the input manager. If deactivated it won't respond to any events.
 * @param {Boolean} active True if input manager should be active.
 */
InputManager.prototype.setActive = function(active) {
	this._active = active;
}
