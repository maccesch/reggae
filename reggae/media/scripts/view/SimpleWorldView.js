/**
 * @author maccesch
 */

import('view.View');

/**
 * Creates a new instance of WorldView
 * @classDescription Represents a simple static game world and handles all other views.
 * @constructor
 * @param {Number} left X coordinate of the top left corner of the view in pixel.
 * @param {Number} top Y coordinate of the top left corner of the view in pixel.
 * @param {Number} width Width in pixel.
 * @param {Number} height Height in pixel.
 */
WorldView = function(left, top, width, height) {
	
	this._element = document.createElement("div");
	this._element.setAttribute("style", "position: absolute; left: " + left + "px; top: " + 
										top + "px; width: " + width + "px; height: " + 
										height + "px; border: 2px solid silver; background: #eeeeff");
										
	document.body.appendChild(this._element);
}

/**
 * Adds a view which should be placed on the world
 * @param {Object} view
 */
WorldView.prototype.addView = function(view) {
	this._element.appendChild(view.getElement());
}

/**
 * Removes a view from the world
 * @param {Object} view
 */
WorldView.prototype.removeView = function(view) {
	this._element.removeChild(view.getElement());
}
