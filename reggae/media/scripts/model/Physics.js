/**
 * @author maccesch
 * Basic Objects
 */

/**
 * Constructor of Point.
 * @classDescription This is the base class vor all physical object. Its just a point with
 * a set of coordinates.
 * @param {Number} [x] optional init coodinate.
 * @param {Number} [y] optional init coodinate.
 * @param {Number} [z] optional init coodinate.
 * @type {Object}
 * @constructor
 */
function Point(x, y, z) {
	this.x = x || 100;
	this.y = y || 100;
	this.z = z || 0;

	this.htmlObj = null;
	this.xOffset = 0;
	this.yOffset = 0;

	this.zIndex = 5;
	
	this.id = "0";
	
	this.persistent = false;
}

/**
 * Calculates the square of the distance from this point to the specified coordinates.
 * @param {Number} x X coordinate of the other point.
 * @param {Number} y Y coordinate of the other point.
 * @param {Number} z Z coordinate of the other point.
 * @return {Number} The square distance.
 * @method
 * @see #dist
 */
Point.prototype.distSqr = function(x, y, z) {
	var distX = this.x - x;
	var distY = this.y - y;
	var distZ = this.z - z;

	return this.lengthSqr(distX, distY, distZ);
};

/**
 * Calculates the distance from this point to the specified coordinates.
 * @param {Number} x X coordinate of the other point.
 * @param {Number} y Y coordinate of the other point.
 * @param {Number} z Z coordinate of the other point.
 * @return {Number} The distance.
 * @method
 * @see #distSqr
 */
Point.prototype.dist = function(x, y, z) {
	return Math.sqrt(this.distSqr(x, y, z));
};

/**
 * Calculates the square of the length of the vector with components x, y, z.
 * @param {Number} x First compontent of the vector.
 * @param {Number} y Second compontent of the vector.
 * @param {Number} z Third compontent of the vector.
 * @return {Number} The square of the length.
 * @see #length
 */
Point.prototype.lengthSqr = function(x, y, z) {
	return x * x + y * y + z * z;
};

/**
 * Calculates the length of the vector with components x, y, z.
 * @param {Number} x First compontent of the vector.
 * @param {Number} y Second compontent of the vector.
 * @param {Number} z Third compontent of the vector.
 * @return {Number} The length.
 * @see #length
 */
Point.prototype.length = function(x, y, z) {
	return Math.sqrt(this.lengthSqr(x, y, z));
};

/*******************************************************************************
 * MovingPoint extends Point
 ******************************************************************************/

// TODO : document
function MovingPoint() {
	Point.call(this);

	// velocity vector
	this.vx = 0;
	this.vy = 0;
	this.vz = 0;
	
	// acceleration vector
	this.ax = 0;
	this.ay = 0;
	this.az = 0;

	// calculated vector for the next coordinates. maybe modifyed by validation before they are commited.
	this.nextX = 0;
	this.nextY = 0;
	this.nextZ = 0;

	this.collisionRadius = 10;
}

MovingPoint.prototype = new Point();

// calculate the next step and store them in the suggestion variables next*
MovingPoint.prototype.update = function(deltaT) {
	this.vx += this.ax * deltaT;
	this.vy += this.ay * deltaT;
	this.vz += this.az * deltaT;
	
	this.nextX = this.x + this.vx * deltaT;
	this.nextY = this.y + this.vy * deltaT;
	this.nextZ = this.z + this.vz * deltaT;
};

// apply the next* values to the actual coordinates
MovingPoint.prototype.commit = function() {
	this.x = this.nextX;
	this.y = this.nextY;
	this.z = this.nextZ;
};

MovingPoint.prototype.collisionOcurred = function() {
};


/*******************************************************************************
 * Wall extends Point
 ******************************************************************************/

/**
 * Creates a new instance of Wall.
 * @constructor
 * @classDescription A Wall is an obstacle in the world which is a planar quad orthogonal to the ground.
 * It is described by its base line (the line where the quad hits the ground. That is
 * from (x, y, z) to (x2, y2, z)) and its height.
 * @param {Float} x X coordinate of the ground line's first point in world units
 * @param {Float} y Y coordinate of the ground line's first point in world units
 * @param {Float} x2 X coordinate of the ground line's second point in world units
 * @param {Float} y2 Y coordinate of the ground line's second point in world units
 * @param {Float} z Z coordinate of the ground line in world units
 * @param {Float} height Height of the wall in world units
 */
function Wall(x, y, x2, y2, z, height) {

	Point.call(this, x, y, z);

	this.x2 = x2 || 300;
	this.y2 = y2 || 300;

	this.height = height || 10;
}

Wall.prototype = new Point();
