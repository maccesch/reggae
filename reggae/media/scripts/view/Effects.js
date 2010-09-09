/**
 * @author maccesch
 */

/**
 * The Effects namespace. All effects are in here.
 */
var Effects = {};

/**
 * Constructs instances of Effects.NoEffect.
 * @classDescription This class does nothing to the view :-). Used as a dummy effect by View.
 * @return {Effects.NoEffect} The new instance.
 * @type {Object}
 * @constructor
 * @see View
 * @see View#update
 */
Effects.NoEffect = function() {
};

/**
 * Updates the effect. In this case it just sets the views viewElement to the
 * coordinates of the views modelElement. Called by MainLoop.
 * @param {Number} deltaT current frame time.
 * @param {Object} viewElement The html element to update
 * @param {Object} left X coordinate in pixels.
 * @param {Object} top Y coordinate in pixels.
 * @see MainLoop#updateAll
 */
Effects.NoEffect.prototype.update = function(deltaT, viewElement, left, top, zIndex) {
	viewElement.style.left = left + "px";
	viewElement.style.top = top + "px";
};

/**
 * Constructs instances of Effects.Vibrate.
 * @classDescription This class vibrates the given view.
 * @return {Effects.Vibrate} The new instance.
 * @type {Object}
 * @constructor
 * @see View
 */
Effects.Vibrate = function() {
	/**
	 * Vibration strength, that is by how many pixels the element can be awax from its
	 * supposed location.
	 */
	this.strength = 3;
};

/**
 * Updates the effect. Called by MainLoop.
 * @param {Number} deltaT current frame time.
 * @param {Object} viewElement The html element to update
 * @param {Object} left X coordinate in pixels.
 * @param {Object} top Y coordinate in pixels.
 * @see MainLoop#updateAll
 */
Effects.Vibrate.prototype.update = function(deltaT, viewElement, left, top) {
	var randX = (Math.random() * 2 - 1) * this.strength;
	var randY = (Math.random() * 2 - 1) * this.strength;
	viewElement.style.left = x + randX + "px";
	viewElement.style.top = y + randY + "px";
};

/**
 * Constructs instances of Effects.LockAxis.
 * @classDescription This class locks the given axis of the given view.
 * @param {Number} axis The axis to lock.
 * Can be one of Effects.LockAxis.X or Effects.LockAxis.Y
 * @param {Number} lockValue Specifies the value of the locked axis.
 * @return {Effects.LockAxis} The new instance.
 * @type {Object}
 * @constructor
 * @see View
 */
Effects.LockAxis = function(axis, lockValue) {

	// init the locked axis
	if (axis === Effects.LockAxis.X) {
		this.view.viewElement.style.left = lockValue + "px";
	} else {
		this.view.viewElement.style.top = lockValue + "px";
	}
	
	/**
	 * Updates the effect. Called by MainLoop.
	 * @param {Number} deltaT current frame time.
	 * @see MainLoop#updateAll
	 */
	this.update = this.updateLocks[axis];
};

// array of the lock functions
Effects.LockAxis.prototype.updateLocks = [
	function lockX(deltaT, viewElement, left, top) {
		viewElement.style.top = top + "px";
	},
	function lockY(deltaT, viewElement, left, top) {
		viewElement.style.left = left + "px";
	}
];

/**
 * Lock the x axis.
 */
Effects.LockAxis.X = 0;
/**
 * Lock the y axis.
 */
Effects.LockAxis.Y = 1;
