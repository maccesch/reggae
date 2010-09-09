/**
 * Creates a new instance of Command.
 * @classDescription A Command which when run executes a callback function with provided arguments.
 * @constructor
 * @param {Function} callback The callback function to execute.
 * @param {Object} thisArg  The this argument for the call function.
 * @param {Object} ... Further arguments or one array of arguments that should be passed to callback when executed
 */
function Command(callback, thisArg) {
	this._callback = callback;
	this._thisArg = thisArg;
	
	if (arguments.length == 3 && arguments[2] instanceof Array) {
		this._arguments = arguments[2];
	} else {
		this._arguments = Array.prototype.slice.call(arguments, 2);
	}
}

/**
 * The callback function to execute.
 */
Command.prototype._callback = function() {}

/**
 * The array of arguments to pass to callback.
 */
Command.prototype._arguments = [];

/**
 * The this argument to pass to callback.
 */
Command.prototype._thisArg = null;

/**
 * Executes the command by calling the callback with the provided arguments.
 */
Command.prototype.run = function() {
	this._callback.apply(this._thisArg, this._arguments);
}




/*--------------------------------------------------------------------------------------------------*/




/**
 * Creates a new instance of CommandQueue.
 * @classDescription A command queue for queing command and executing them in order.
 * @constructor
 */
function CommandQueue() {
	this._queue = [];
}

/**
 * The actual queue where the commands are stored in.
 */
CommandQueue.prototype._queue = null;

/**
 * Adds a command to the queue.
 * @param {Command} command The command to add.
 */
CommandQueue.prototype.add = function(command) {
	// TODO : command priorities?
	this._queue.push(command);
}

/**
 * Executes all queued commands in the order they where added and clears the queue.
 */
CommandQueue.prototype.runAll = function() {
	while (this._queue.length > 0) {
		var command = this._queue.shift();
		command.run();
	}
}
