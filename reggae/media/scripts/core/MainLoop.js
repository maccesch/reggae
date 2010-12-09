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

	this.objectsToUpdate = [[], [], []];
	this.objectsToValidate = [];
		
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
 * @param {Integer} order Ordering in updates. Must be from 0 to 2 inclusively. 0 means these objects are updated first, 2 means last.
 * @param {Boolean} [validate] If true the object will be added to this.objectsToValidate. During the update
 * process first update is called on everyone then this.doObjectValidation is called and then commit is called on everyone.
 * @see #activate
 * @see #deactivate
 * @see #freeze
 * @method
 */
MainLoop.prototype.register = function(object, order, validate) {
	if (!object.update || !(object.update instanceof Function)) {
		console.debug("Warning: The registered object doesn't have an update method!");
	}
		
	object.active = true;
	
	this.objectsToUpdate[order].push(object);
	
	if (validate) {
		this.objectsToValidate.push(object);
	}
};

/**
 * Unregisters a registered object. If the object wasn't registered this method does nothing.
 * @param {Object} object The object to unregister.
 * @param {Integer} order Same as order at #register.
 * @param {Boolean} [validate] Same as validate at #register.
 * @see #register
 * @method
 */
MainLoop.prototype.unregister = function(object, order, validate) {
	
	var index = this.objectsToUpdate[order].indexOf(object);
	if (index >= 0) {
		this.objectsToUpdate.splice(index, 1);
		if (validate) {
			index = this.objectsToValidate.indexOf(object);
			this.objectsToValidate.splice(index, 1);
		}
	}
};

/**
 * Deactivates the given object. That is this object won't be updated any more.

 * @param {Object} object The object to deactivate.
 * @method
 */
MainLoop.prototype.deactivate = function(object) {
	object.active = false;
	
//	if (object instanceof Views.SimpleView) {
//		object.getElement().style.visibility = "hidden";
//	}
};


/**
 * Activates the given object. That is this object will be updated every frame.
 * @param {Object} object The object to deactivate.
 * @method
 */

MainLoop.prototype.activate = function(object) {
    
	object.active = true;
//	if (object instanceof SimpleView) {
//		object.viewElement.style.visibility = "visible";
//	}
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
	
	this.updateList(this.objectsToUpdate[0]);
    this.updateList(this.objectsToUpdate[1]);
    this.updateList(this.objectsToUpdate[2]);
	
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