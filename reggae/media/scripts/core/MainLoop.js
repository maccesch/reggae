/**
 * @author maccesch
 */
 
import('core.Commands');


// exports
var MainLoop;


function package_core_MainLoop() {

/**
 * Constructor of MainLoop. Do not call this directly. Use MainLoop.instance instead.
 * @classDescription This is the main loop where all the objects update(deltaT) methods are called.
 * Its the master class where all starts :-)
 * @return {MainLoop} Returns a new MainLoop
 * @type {Object}
 * @constructor
 */
MainLoop = function() {

	this.objectsToUpdate = [];
	this.objectsToValidate = [];
	
	// TODO : MainLoop is in core layer and therefore doesn't know about views.
	this.viewsToUpdate = [];
	this.constraintsToUpdate = [];
	
	this.lastTimestamp = 0;
	this.deltaT = 0;
	
	this.timer = null;
	
	this.intervalSleep = 30;
	
	this._commandQueue = new CommandQueue();
	
	/**
	 * Does the simulation logic. It is called by updateAll before any object is updated.
	 * @param {Object} deltaT current frametime in milliseconds.
	 */
	this.doLogic = function(deltaT) {
	};
}

/**
 * A command queue whose command are run before every update.
 */
MainLoop.prototype._commandQueue = null;

/**
 * Adds a command to the command queue.
 * @param {Command} command The command to add.
 */
MainLoop.prototype.addCommand = function(command) {
	this._commandQueue.add(command);
}

// TODO : move this to constructor
/**
 * Does the validation of objects after the call to their update() method. It is called
 * by updateAll().
 * You have to assign a function to this. The default function is the empty function.
 * @param {Number} deltaT Frametime in milliseconds.
 * @method
 */
MainLoop.prototype.doObjectValidation = function(deltaT) {
	// do nothing
};

/**
 * Registers an object which will be updated and validated, too,
 * if it is or a subclass of MovingPoint. Registered object are active.
 * @param {Object} object The object to be updated. It must provide a update(deltaT) method.
 * @see #activate
 * @see #deactivate
 * @see #freeze
 * @method
 */
MainLoop.prototype.register = function(object) {
	if (!object.update || !(object.update instanceof Function)) {
		console.debug("Warning: The registered object doesn't have an update method!");
	}
	
	object.active = true;
	
	// TODO : enclose this in try catch block?
	
	// physical objects have to be updated before views
	
	// is object a View?
	if (object.getViewElement) {
		this.viewsToUpdate.push(object);
	}
	// constraints
	else if (object.object) {
		this.constraintsToUpdate.push(object);
	}
	else {
		this.objectsToUpdate.unshift(object);
	}
	// is object a MovingPoint ?
	if (object.dist) {
		this.objectsToValidate.push(object);
	}
};

/**
 * Unregisters a registered object. If the object wasn't registered this method does nothing.
 * @param {Object} object The object to unregister.
 * @see #register
 * @method
 */
MainLoop.prototype.unregister = function(object) {
	var index = 0;
	
	// object instance of View ?
	if (object.getElement && object.getViewElement) {
		index = this.viewsToUpdate.indexOf(object);
		if (index) {
			this.viewsToUpdate.splice(index, 1);
		}
	}
	// constraints
	else if (object.object) {
		index = this.constraintsToUpdate.indexOf(object);
		if (index >= 0) {
			this.constraintsToUpdate.splice(index, 1);
		}
	}
	else {
		index = this.objectsToUpdate.indexOf(object);
		if (index >= 0) {
			this.objectsToUpdate.splice(index, 1);
			if (object instanceof MovingPoint) {
				index = this.objectsToValidate.indexOf(object);
				this.objectsToValidate.splice(index, 1);
			}
		}
	}
};

/**
 * Deactivates the given object. That is this object won't be updated any more.
 * If the object is a view it will also be hidden.
 * @param {Object} object The object to deactivate.
 * @method
 */
MainLoop.prototype.deactivate = function(object) {
	object.active = false;
	
	// TODO : enclose this in try catch block?
	
	if (object instanceof Views.SimpleView) {
		object.getElement().style.visibility = "hidden";
	}
};

/**
 * Freezes the given object. That is this object won't be updated any more.
 * This is the same as deactivate except for views. When calling freeze on a view
 * it won't be hidden as opposed to deactivate.
 * @param {Object} object The object to freeze.
 * @method
 */
MainLoop.prototype.freeze = function(object) {
	object.active = false;
};

/**
 * Activates the given object. That is this object will be updated every frame.
 * If the object is a view it will also be set visible.
 * @param {Object} object The object to deactivate.
 * @method
 */

MainLoop.prototype.activate = function(object) {
	object.active = true;
	if (object instanceof SimpleView) {
		object.viewElement.style.visibility = "visible";
	}
};

// calculates the current frame time. called by updateAll
MainLoop.prototype.calcDeltaT = function() {
	var date = new Date();
	var curTime = date.getTime();
	this.deltaT = curTime - this.lastTimestamp;
	this.lastTimestamp = curTime;
};

/**
 * This is the main method which is called by an interval timer.
 * @see #start
 * @see #stop
 * @method
 */
MainLoop.prototype.updateAll = function() {
	this._commandQueue.runAll();

	this.calcDeltaT();
	
	this.doLogic(this.deltaT);
	
	var curO = null;
	
	this.updateList(this.objectsToUpdate);
	this.updateList(this.constraintsToUpdate);
	this.updateList(this.viewsToUpdate);
	
	this.doObjectValidation(this.deltaT);
	
	for (var i = 0; i < this.objectsToValidate.length; ++i) {
		this.objectsToValidate[i].commit();
	}
};

// calls update on all active elements of the given list.
MainLoop.prototype.updateList = function(list) {
	for (var i = 0; i < list.length; ++i) {
		var curO = list[i];
		if (curO.active) {
			curO.update(this.deltaT);
		}
	}
};

/**
 * Starts the loop by setting up the method updateAll() as interval.
 * @method
 * @see #updateAll
 */
MainLoop.prototype.start = function() {
	var self = this;
	this.timer = window.setInterval(function() {
		self.updateAll();
	}, this.intervalSleep);
};

/**
 * Stops the loop by clearing the interval.
 * @method
 */
MainLoop.prototype.stop = function() {
	window.clearTimeout(this.timer);
};

/**
 * The only instance of MainLoop.
 */
MainLoop.instance = new MainLoop();

}