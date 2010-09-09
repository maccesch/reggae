/**
 * @author maccesch
 */

/*************************************************************
 * SimpleProjection
 *************************************************************/

/**
 * Creates a new instance of SimpleProjection.
 * @classDescription Simply projects (x, y, z) to (x, y)
 * @constructor
 * @see SimpleView
 */
SimpleProjection = function() {
	// do nothing
}

/**
 * Does the projection.
 * @param {Object} x Original x coordinate.
 * @param {Object} y Original y coordinate.
 * @param {Object} z Original z coordinate.
 * @return {Array} The projected coordinates [x, y]
 * @method
 */
SimpleProjection.prototype.project = function(x, y, z) {
	return [x, y];
}

/*************************************************************
 * IsometricProjection
 *************************************************************/

/**
 * Creates a new instance of IsometricProjection.
 * @classDescription An isometric projection.
 * @constructor
 */
IsometricProjection = function() {
	// do nothing
}

/**
 * Does the isometric projection.
 * @param {Object} x Original x coordinate.
 * @param {Object} y Original y coordinate.
 * @param {Object} z Original z coordinate.
 * @return {Array} The projected coordinates [x, y]
 * @method
 */
IsometricProjection.prototype.project = function(x, y, z) {
	return [x, y + z];
}

/*************************************************************
 * BiasedProjection
 *************************************************************/

/**
 * Creates a new instance of BiasedProjection
 * @classDescription A projection that adds a bias to another projection
 * @param {Object} projection The projection to add the bias to
 * @constructor
 */
BiasedProjection = function(projection) {
	this._projection = projection;
}

/**
 * The projection that a bias is added to.
 */
BiasedProjection.prototype._projection = null;

/**
 * X part of the bias in pixels.
 */
BiasedProjection.prototype._biasLeft = 0;

/**
 * Y part of the bias in pixels.
 */
BiasedProjection.prototype._biasTop = 0;

/**
 * Returns the inner (unbiased) projection.
 */
BiasedProjection.prototype.getProjection = function() {
	return this._projection;
}

/**
 * Sets the bias, that should be added to the projected coordinates.
 * @param {Object} left X part of the bias in pixels.
 * @param {Object} top Y part of the bias in pixels.
 * @method
 */
BiasedProjection.prototype.setBias = function(left, top) {
	this._biasLeft = left;
	this._biasTop = top;
}

/**
 * Does the projection.
 * @param {Object} x Original x coordinate.
 * @param {Object} y Original y coordinate.
 * @param {Object} z Original z coordinate.
 * @return {Array} The projected coordinates [x, y]
 * @method
 */
BiasedProjection.prototype.project = function(x, y, z) {
	var projCoords = this._projection.project(x, y, z);
	projCoords[0] += this._biasLeft;
	projCoords[1] += this._biasTop;
	return projCoords;
}
