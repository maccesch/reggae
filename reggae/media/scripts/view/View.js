/**
 * @author maccesch
 */
 
import('base.Lang');
import('view.Projections');
import('view.Effects');
import('core.Settings');


// exports
var SimpleView;
var SimpleImageView;
var SimpleImageBuildingView;


function package_view_View() {

/**
 * Constructs a new instance of SimpleView.
 * @classDescription This is a simple view of a Point. It places a html object at the
 * coordinates of the Point
 * @param {Point} modelElement The model element to be viewed. It doesn't have to be an instance
 * of Point, the only requirement is that is has the attributes x and y.
 * @param {HTMLElement} viewElement The html object which will be the visual representation
 * of the model element.
 * @param {Number, String} [biasLeft] The x bias of the pivot point in pixels. The x coordinate of the html
 * object is calculated as follows: modelEl.x - biasLeft. It is also possible to specify the
 * stings "left", "center", "right" which describes the position of the pivot point. The
 * default value is "center". You can also specify values in percent strings. For example "30%".
 * @param {Number, String} [biasTop] The y bias of the pivot point in pixels. The y coordinate of the html
 * object is calculated as follows: modelEl.y - biasTop. It is also possible to specify the
 * stings "top", "middle", "bottom" which describes the position of the pivot point. The
 * default value is "middle". You can also specify values in percent strings. For example "30%".
 * @return {SimpleView} The new instance of SimpleView
 * @type{Object}
 * @constructor
 * @see Point
 */
SimpleView = function(modelElement, viewElement, biasLeft, biasTop) {

	this._modelElement = modelElement;
	this._viewElement = viewElement;
	
	if (modelElement) {
		this._initBias(biasLeft, biasTop);
	}
}

/**
 * The model element that is viewed.
 */
SimpleView.prototype._modelElement = null;

/**
 * The html element, that represents the model element.
 */
SimpleView.prototype._viewElement = null;

/**
 * The effect that is applied to the viewElement in update. The default NoEffect
 * just sets the viewElements coordinates to the modelElements coordinates.
 */
SimpleView.prototype._effect = new Effects.NoEffect(this);

/**
 * The projection that transforms model coordinates to screen coordinates.
 * Defaults to SimpleProjection.
 */
SimpleView.prototype._projection = new SimpleProjection();

/**
 * View element horizontal bias in pixel
 */
SimpleView.prototype._biasLeft = 0;

/**
 * View element vertical bias in pixel
 */
SimpleView.prototype._biasTop = 0;

/**
 * Gets the model element that is viewed.
 * @method
 */
SimpleView.prototype.getModelElement = function() {
	return this._modelElement;
} 

/**
 * Gets the html element that represents the model element.
 * @method
 */
SimpleView.prototype.getElement = function() {
	return this._viewElement;
}

/**
 * Sets the projection that transforms model coordinates to screen coordinates.
 * @method
 * @param {Object} projection The new projection.
 */
SimpleView.prototype.setProjection = function(projection) {
	this._projection = projection;
}

/**
 * Sets the effect that is applied to the viewElement in update.
 * @method
 * @param {Object} effect The new effect.
 */
SimpleView.prototype.setEffect = function(effect) {
	this._effect = effect;
}

/**
 * Gets the effect.
 */
SimpleView.prototype.getEffect = function() {
	return this._effect;
}

/**
 * Initializes the bias values, that is turns them into numbers. See constructor.
 * @method
 * @param {Number, String} biasLeft left bias
 * @param {Number, String} biasTop top bias
 * @see SimpleView
 */ 
SimpleView.prototype._initBias = function(biasLeft, biasTop) {
	if (!biasLeft) {
		biasLeft = "center";
	}
	if (!biasTop) {
		biasTop = "middle";
	}
	
	var width = this._viewElement.width || this._viewElement.style.width.toInt();
	var height = this._viewElement.height || this._viewElement.style.height.toInt();
	
	if (biasLeft.charCodeAt) {
		if (!biasLeft.endsWith('%')) {
			switch (biasLeft) {
				case "left":
					biasLeft = 0;
					break;
				case "center":
					biasLeft = width / 2;
					break;
				case "right":
					biasLeft = width;
					break;
				default:
					biasLeft = biasLeft.toInt();
					break;
			}
		} else {
			biasLeft = biasLeft.toRatio() * width;
		}
	}
	if (biasTop.charCodeAt) {
		if (!biasTop.endsWith('%')) {
			switch (biasTop) {
				case "top":
					biasTop = 0;
					break;
				case "middle":
					biasTop = height / 2;
					break;
				case "bottom":
					biasTop = height;
					break;
				default:
					biasTop = biasTop.toInt();
					break;
			}
		} else {
			biasTop = biasTop.toRatio() * height;
		}
	}
	
	this._viewElement.style.marginLeft = (-biasLeft) + "px";
	this._viewElement.style.marginTop = (-biasTop) + "px";
	
	this._biasLeft = biasLeft;
	this._biasTop = biasTop;
};

/**
 * Updates the view element to the projected coordinates of the model element. Also sets the
 * viewElement.x and viewElement.y attributes to these coordinates
 * @method
 */
SimpleView.prototype.update = function(deltaT) {
	var projectedCoords = this._projection.project(this._modelElement.x, this._modelElement.y, this._modelElement.z);
	this._effect.update(deltaT, this._viewElement, projectedCoords[0], projectedCoords[1]);
};

/**
 * Decorates the view with a html element
 * @param {HTMLElement} element The html element to add to the view
 */
SimpleView.prototype.decorate = function(element) {
	this._viewElement.appendChild(element);
}

/**
 * Says whether this view is in front of the given coordinates.
 * @param {Number} left X coordinate in pixel
 * @param {Number} top Y coordinate in pixel
 * @return {Boolean} true if this view is in front of the given coordinates. 
 */
SimpleView.prototype.isInFrontOf = function(left, top) {
	var thisTop = this._viewElement.style.top.toInt();
	return thisTop > top;
}



/*-----------------------------------------------------------------------------------------*/



/**
 * Creates a new instance of SimpleImageView.
 * @classDescription A view that shows an image at the model element's position.
 * @param {Point, MovingPoint, DynamicGameObject, Player} modelElement The modelElement to represent.
 * @param {String} imagePath The path (relative to the images root. See settings.IMAGES_ROOT) of the image to use.
 * @param {Number, String} biasLeft Horizontal part of the bias. See SimpleView.
 * @param {Number, String} biasTop Vertical part of the bias. See SimpleView.
 * @constructor
 * @see SimpleView
 * @see settings.IMAGES_ROOT
 */
SimpleImageView = function(modelElement, imagePath, biasLeft, biasTop) {
	
	var div = document.createElement('div');
	var image = document.createElement('img');
	image.src = settings.getImagesPath() + imagePath;
	image.setAttribute("style", "position: absolute;");

	div.appendChild(image);
	div.setAttribute("style", "position: absolute;");
	
	SimpleView.call(this, modelElement, div, biasLeft, biasTop);
}

SimpleImageView.prototype = new SimpleView();



/*-----------------------------------------------------------------------------------------*/



/**
 * Creates a new instance of SimpleImageBuildingView.
 * @classDescription A view of a building which uses a line to determine if a point is in front of it.
 * @constructor
 * @param {Point, MovingPoint} modelElement The modelElement to represent.
 * @param {String} imagePath The path (relative to the images root. See settings.IMAGES_ROOT) of the image to use.
 * @param {Integer} left1 X coordinate of the left point of the line in pixels
 * @param {Integer} top1 Y coordinate of the left point of the line in pixels
 * @param {Integer} left2 X coordinate of the right point of the line in pixels
 * @param {Integer} top2 Y coordinate of the right point of the line in pixels
 * @see settings.IMAGES_ROOT
 */
SimpleImageBuildingView = function(modelElement, imagePath, left1, top1, left2, top2) {
	
	SimpleImageView.call(this, modelElement, imagePath, 0, 0);
	
	this._left = left1;
	this._top = top1;
	
	// calculate normal of the line through (left1, top1) and (left2, top2)
	this._normWidth = top2 - top1;
	this._normHeight = left1 - left2;
}

SimpleImageBuildingView.prototype = new SimpleView();

/**
 * Says whether this view is in front of the given coordinates.
 * @param {Number} left X coordinate in pixel
 * @param {Number} top Y coordinate in pixel
 * @return {Boolean} true if this view is in front of the given coordinates. 
 */
SimpleImageBuildingView.prototype.isInFrontOf = function(left, top) {
	// sign of the dot product of the vectors (left1, top1) to (left, top) and this.norm
	// indicates whether (left, top) is below oder above the line through (left1, top1) and (left2, top2)
	var thisTop = this._viewElement.style.top.toInt();
	var thisLeft = this._viewElement.style.left.toInt();
	
	var width2 = left - this._left - thisLeft;
	var height2 = top - this._top - thisTop;
	
	return this._normWidth * width2 + this._normHeight * height2 > 0;
}

}