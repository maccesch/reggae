/**
 * @author maccesch
 */
/**
 * This holds all constraints. Constraints are registered at the main loop.
 */
var Constraints = {};

/**
 * Constructs a new Constraints.VelocityLimiter instance.
 * @classDescription Limits the maximum velocity to a specific value.
 * @param {MovingPoint} object The constrainee.
 * @param {Number} maxV The maximum velocity, that the given MovingPoint cannot overcome.
 * @type {Object}
 * @return {Constraints.VelocityLimiter} The new instance.
 * @constructor
 */
Constraints.VelocityLimiter = function(object, maxV) {
	
	this.object = object;
	this.setMaxV(maxV);

};

/**
 * Updates the constraint.
 * @param {Object} deltaT Current frame time in milliseconds.
 * @method
 */
Constraints.VelocityLimiter.prototype.update = function(deltaT) {
	var curVSqr = this.object.vx * this.object.vx +
	this.object.vy * this.object.vy +
	this.object.vz * this.object.vz;
	
	if (curVSqr > this.maxVSqr) {
		this.object.nextX -= this.object.vx;
		this.object.nextY -= this.object.vy;
		this.object.nextZ -= this.object.vz;
		
		var f = Math.sqrt(this.maxVSqr / curVSqr);
		this.object.vx *= f;
		this.object.vy *= f;
		this.object.vz *= f;

		this.object.nextX += this.object.vx;
		this.object.nextY += this.object.vy;
		this.object.nextZ += this.object.vz;
	}
};

/**
 * Sets the maximum velocity.
 * @param {Object} maxV The max velocity.
 * @method
 */
Constraints.VelocityLimiter.prototype.setMaxV = function(maxV) {
	this.maxVSqr = maxV * maxV;
};
