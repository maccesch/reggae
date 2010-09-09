/**
 * @author maccesch
 */

import('view.Projections');
import('view.View');
import('base.Loader');
import('core.Settings');

// exports
var WorldView;

function package_view_GridWorldView() {

/**
 * Creates a new instance of WorldView
 * @classDescription Manages the html elements representing the world.
 * @constructor
 * @param {Number} viewCenterX X Coordinate of the center of the view window in world units.
 * @param {Number} viewCenterY Y Coordinate of the center of the view window in world units.
 * @param {Number} viewCenterZ Z Coordinate of the center of the view window in world units.
 */
WorldView = function(viewCenterX, viewCenterY, viewCenterZ) {
	// calc the grid coordinates where the center is in
	var gridX = Math.floor(viewCenterX/WorldPartView.WORLD_PART_SIZE);
	var gridY = Math.floor(viewCenterY/WorldPartView.WORLD_PART_SIZE);
	
	this._fieldSize = settings.FIELD_SIZE;
	
	this._gridMinX = this._gridMaxX = gridX;
	this._gridMinY = this._gridMaxY = gridY;
	
	this._elementIdToViewPart = {};
	this._viewParts = {};
	this._viewsInZOrder = [];
	
	this._overlayLayers = [];
	
	this._projection = new IsometricProjection();
	
	var viewBias = this._projection.project(gridX * WorldPartView.WORLD_PART_SIZE, 
			gridY * WorldPartView.WORLD_PART_SIZE, 0);
	
	this._biasLeft = viewBias[0];
	this._biasTop = viewBias[1];
	
	// create view window
	var canvasEl = document.getElementById(settings.REGGAE_CANVAS_ID);
	canvasEl.setAttribute('style', 'overflow: hidden;');
	
	this._canvasWidth = canvasEl.clientWidth;
	this._canvasHeight = canvasEl.clientHeight;
	
	// create actual word container
	this._element = document.createElement('div');
	this._element.setAttribute('style', 'position: absolute;');
	canvasEl.appendChild(this._element);
}

/**
 * How many world parts should be loaded at the same time per dimension (x and y).
 * That means the MAX_PARTS_PER_DIM^2 world parts are maximally kept.
 */
WorldView.MAX_PARTS_PER_DIM = 4;

/**
 * Array of Array of views ordered by their layer no and z-index. lowest first.
 */
WorldView.prototype._viewsInZOrder = null;

/**
 * Size of the edges of a world field in pixels.
 */
WorldView.prototype._fieldSize = 0;

/**
 * Width of the view window in pixels.
 */
WorldView.prototype._canvasWidth = 0;

/**
 * Height of the view window in pixels.
 */
WorldView.prototype._canvasHeight = 0;

/**
 * Horizontal bias of the world view origin to the projected world origin in pixels.
 */
WorldView.prototype._biasLeft = 0;

/**
 * Vertical bias of the world view origin to the projected world origin in pixels.
 */
WorldView.prototype._biasTop = 0;

/**
 * The coordinates projection. This will project the model coordinates to view 
 * coordinates for all word fields and model elemenet views.
 */
WorldView.prototype._projection = null;

/**
 * The map of grid coordinates to WorldPartViews: x -> (y -> WorldPartView)
 */
WorldView.prototype._viewParts = null;

/**
 * Minimum x coordinate of available world parts in grid units.
 */
WorldView.prototype._gridMinX = 0;

/**
 * Maximum x coordinate of available world parts (exclusive) in grid units.
 */
WorldView.prototype._gridMaxX = 0;

/**
 * Minimum y coordinate of available world parts in grid units.
 */
WorldView.prototype._gridMinY = 0;

/**
 * Maximum y coordinate of available world parts (exclusive) in grid units.
 */
WorldView.prototype._gridMaxY = 0;

/**
 * Model element this view follows.
 */
WorldView.prototype._followEl = null;

/**
 * Maps model element ids to the proper WorldPartView the view of the model element is in.
 */
WorldView.prototype._elementIdToViewPart = null;

/**
 * Array of html elements that contain the elements on (exactly above) the ground. One element per ground level.
 */
WorldView.prototype._overlayLayers = null;

/**
 * Sets the center of the view window.
 * @param {Number} viewCenterX X Coordinate of the center of the view window in world units.
 * @param {Number} viewCenterY Y Coordinate of the center of the view window in world units.
 * @param {Number} viewCenterZ Z Coordinate of the center of the view window in world units.
 */
WorldView.prototype.setViewCenter = function(x, y, z) {
	var viewCenter = this._projection.project(x, y, z);
	this._element.style.left = (this._biasLeft - viewCenter[0] + this._canvasWidth / 2) + 'px';
	this._element.style.top = (this._biasTop - viewCenter[1] + this._canvasHeight / 2) + 'px';

	// ensure that at least the world part that is viewed is loaded and all its
	// eight neighbours. Also ensure that the loaded views form a rectangle without holes.			
	var gridX = Math.floor(x/WorldPartView.WORLD_PART_SIZE);
	var gridY = Math.floor(y/WorldPartView.WORLD_PART_SIZE);

	this._gridMinX = Math.min(this._gridMinX, Math.max(0, gridX-1));
	this._gridMaxX = Math.max(this._gridMaxX, gridX + 2);
	this._gridMinY = Math.min(this._gridMinY, Math.max(0, gridY-1));
	this._gridMaxY = Math.max(this._gridMaxY, gridY + 2);
	
	// TODO : when do we remove parts?
	// check if world parts should be deactivated
	if (this._gridMaxX - this._gridMinX > WorldView.MAX_PARTS_PER_DIM) {
		if ((this._gridMaxX - gridX - 1) > (gridX - this._gridMinX)) {
			this._deactivatePartsInColumn(this._gridMaxX - 1);
			--(this._gridMaxX);
		} else {
			this._deactivatePartsInColumn(this._gridMinX);
			++(this._gridMinX);
		}
	}
	if (this._gridMaxY - this._gridMinY > WorldView.MAX_PARTS_PER_DIM) {
		if ((this._gridMaxY - gridY - 1) > (gridY - this._gridMinY)) {
			this._deactivatePartsInRow(this._gridMaxY - 1);
			--(this._gridMaxY);
		} else {
			this._deactivatePartsInRow(this._gridMinY);
			++(this._gridMinY);
		}
	}
}

/**
 * Removes all world part views that are in the specified column.
 * @param {Number} col The column number
 */
WorldView.prototype._removePartsInColumn = function(col) {
	for (var i = this._gridMinY; i < this._gridMaxY; ++i) {
		var part = this._viewParts[col][i];
		this._element.removeChild(part.getElement());
		part.destroy();
		delete this._viewParts[col][i];
	}
	delete this._viewParts[col];
}

/**
 * Removes all world part views that are in the specified row.
 * @param {Number} row The row number
 */
WorldView.prototype._removePartsInRow = function(row) {
	for (var i = this._gridMinX; i < this._gridMaxX; ++i) {
		var part = this._viewParts[i][row];
		this._element.removeChild(part.getElement());
		part.destroy();
		delete this._viewParts[i][row];
	}
}

/**
 * Deactivates all world part views that are in the specified column.
 * This means the part views are no longer in the html dom.
 * @param {Number} col The column number
 */
WorldView.prototype._deactivatePartsInColumn = function(col) {
	for (var i = this._gridMinY; i < this._gridMaxY; ++i) {
		var part = this._viewParts[col][i];
		part.setActive(false);
	}
}

/**
 * Deactivates all world part views that are in the specified row.
 * This means the part views are no longer in the html dom.
 * @param {Number} row The row number
 */
WorldView.prototype._deactivatePartsInRow = function(row) {
	for (var i = this._gridMinX; i < this._gridMaxX; ++i) {
		var part = this._viewParts[i][row];
		part.setActive(false);
	}
}

/**
 * Start following a model element. That means the view center is at the model element's coordinates.
 * @param {Point} modelElement The element to follow.
 */
WorldView.prototype.followModel = function(modelElement) {
	this._followEl = modelElement;
}

/**
 * Updates the view.
 * @param {Object} deltaT Time since last update in milliseconds.
 */
WorldView.prototype.update = function(deltaT) {
	
	if (this._followEl) {
		this.setViewCenter(this._followEl.x, this._followEl.y, this._followEl.z);
	}
	
	for (var i = this._gridMinX; i < this._gridMaxX; ++i) {
		for (var j = this._gridMinY; j < this._gridMaxY; ++j) {
			var part = this._getPart(i, j);
			var viewsOutside = part.updateViews();
			for (var k = 0; k < viewsOutside.length; ++k) {
				var view = viewsOutside[k];
				part.removeView(view);
				this.addView(view);
				Controller.instance.gridCellChanged(view.getModelElement());
			}
		}
	}
	
}

/**
 * Gets the world part view for the given arguments. Creates the part if it doesn't exist yet.
 * @param {Object} x X coordinate for the part in grid units
 * @param {Object} y Y coordinate for the part in grid units
 * @return {WorldPartView} The proper world part view
 */
WorldView.prototype._getPart = function(x, y) {
	if (!this._viewParts[x]) {
		this._viewParts[x] = {};
	}
	if (!this._viewParts[x][y]) {
		var viewPart = new WorldPartView(this._element, x * WorldPartView.WORLD_PART_SIZE, 
							y * WorldPartView.WORLD_PART_SIZE, this._projection, 
							this._biasLeft, this._biasTop, this._fieldSize, this._overlayLayers, this._viewsInZOrder);
		
		this._viewParts[x][y] = viewPart;
		
		this._gridMinX = Math.min(this._gridMinX, x);
		this._gridMaxX = Math.max(this._gridMaxX, x + 1);
		this._gridMinY = Math.min(this._gridMinY, y);
		this._gridMaxY = Math.max(this._gridMaxY, y + 1);
	}
	else {
		viewPart = this._viewParts[x][y];
	}

	if (!viewPart.isActive() && x >= this._gridMinX && x < this._gridMaxX && y >= this._gridMinY && y < this._gridMaxY) {
		viewPart.setActive(true);
	}
	
	return viewPart;
}

/**
 * Returns the world part view, that the view belongs in.
 * @param {View} view A model view
 * @return {WorldPartView} The proper world part view
 */
WorldView.prototype._getPartForView = function(view) {
	var model = view.getModelElement()
	return this._getPart(Math.floor(model.x / WorldPartView.WORLD_PART_SIZE), 
			Math.floor(model.y / WorldPartView.WORLD_PART_SIZE));
}

/**
 * Adds a view which should be placed on the world
 * @param {Object} view
 */
WorldView.prototype.addView = function(view) {
	var part = this._getPartForView(view);
	part.addView(view);
	this._elementIdToViewPart[view.getModelElement().id] = part;
}

/**
 * Removes a view from the world
 * @param {Object} view
 */
WorldView.prototype.removeView = function(view) {
	var elementId = view.getModelElement().id;
	var part = this._elementIdToViewPart[elementId];
	part.removeView(view);
	delete this._elementIdToViewPart[elementId];
}


/*------------------------------------------------------------------------------------------------*
 * WorldPardView
 *------------------------------------------------------------------------------------------------*/


/**
 * Creates a new instance of WorldPartView.
 * @classDescription Represents a rectangle part (grid cell) of the world. The world view consists of several world part views
 * that are dynamically loaded or dismissed, dependent on the position of the player
 * @param {HTMLElement} worldElement html element of the world view
 * @param {Number} x1 X coordinate of the top left corner of the world in world units
 * @param {Number} y1 Y coordinate of the top left corner of the world in world units
 * @param {Projection} projection The world view part projection used to transform world coordinates into pixels.
 * @param {Number} biasLeft Horizontal bias of the world view in pixels. See WorldView._biasLeft.
 * @param {Number} biasTop Vertical bias of the world view in pixels. See WorldView._biasTop.
 * @param {Number} fieldSize Length of the edges of a world field in pixels.
 * @param {Array} overlayLayers Array of html elements that contain the elements on (exactly above) the ground. One element per ground level.
 * @param {Array} viewsInZOrder Array of Array of views ordered by their layer no and z-index. lowest first.
 */
WorldPartView = function(worldElement, x1, y1, projection, biasLeft, biasTop, fieldSize, overlayLayers, viewsInZOrder) {
	this._x1 = x1;
	this._y1 = y1;
	this._x2 = x1 + WorldPartView.WORLD_PART_SIZE;
	this._y2 = y1 + WorldPartView.WORLD_PART_SIZE;
	
	this._fieldSize = fieldSize;
	
	this._overlayLayers = overlayLayers;
	this._groundLayers = [];
	
	this._viewsInZOrder = viewsInZOrder;
	this._idToViewsThatChangeZOrder = {};
	
	this._idToViews = {};
	this._idToLayerNo = {};
	
	var bias = projection.project(x1, y1, 0);
	this._groundLayersLeft = bias[0] - biasLeft;
	this._groundLayersTop = bias[1] - biasTop;
	
	this._groundProjection = new BiasedProjection(projection);
	this._groundProjection.setBias(-bias[0], -bias[1]);
	
	// TODO : howto reuse this in other world part views? necessary though??
	this._overlayProjection = new BiasedProjection(projection);
	this._overlayProjection.setBias(-biasLeft, -biasTop);
	
	this._element = worldElement;

	var self = this;
	window.setTimeout(function() {
		self._requestRect();
	}, 200);

	this._active = false;
}

// TODO : get this from server. should be the same as the grid size of the server!
/**
 * Size of a world part in world units.
 */
WorldPartView.WORLD_PART_SIZE = 512;

// TODO : get this from server.
/**
 * Distance from one ground layer to the next in world units.
 */
WorldPartView.LAYER_HEIGHT = 64;

/**
 * Array of Array of views ordered by their layer no and z-index. lowest first.
 */
WorldPartView.prototype._viewsInZOrder = null;

/**
 * Maps model element ids to views, that can change the z ordering. For example views of moving points.
 */
WorldPartView.prototype._idToViewsThatChangeZOrder = null;

/**
 * True if this part is rendered
 */
WorldPartView.prototype._active = true;

/**
 * Size of the edges of a world field in pixels.
 */
WorldPartView.prototype._fieldSize = 0;

/**
 * X coordinate of the top left corner of the world in world units
 */
WorldPartView.prototype._x1 = 0;

/**
 * Y coordinate of the top left corner of the world in world units
 */
WorldPartView.prototype._y1 = 0;

/**
 * X coordinate of the bottom right corner of the world in world units
 */
WorldPartView.prototype._x2 = 0;

/**
 * Y coordinate of the bottom right corner of the world in world units
 */
WorldPartView.prototype._y2 = 0;

/**
 * Array of html elements that contain the elements on (exactly above) the ground. One element per ground level.
 */
WorldPartView.prototype._overlayLayers = null;

/**
 * Array of html elements that contain the ground fields. One element per ground level.
 */
WorldPartView.prototype._groundLayers = null;

/**
 * Map of model element ids to their views.
 */
WorldPartView.prototype._idToViews = null;

/**
 * Map of model element ids to their layer number
 */
WorldPartView.prototype._idToLayerNo = null;

/**
 * The projection used for the ground tiles.
 */
WorldPartView.prototype._groundProjection = null;

/**
 * The projection used for the overlay objects. That is for all objects on (above) the ground.
 */
WorldPartView.prototype._overlayProjection = null;

/**
 * Left value of all ground layer html elements in pixels.
 */
WorldPartView.prototype._groundLayersLeft = 0;

/**
 * Top value of all ground layer html elements in pixels.
 */
WorldPartView.prototype._groundLayersTop = 0;

/**
 * Returns true, if this part is rendered.
 * @return {Boolean} rendered?
 */
WorldPartView.prototype.isActive = function() {
	return this._active;
}

/**
 * Sets if this part is currently rendered.
 * @param {Boolean} active The new rendering state
 */
WorldPartView.prototype.setActive = function(active) {
	if (active != this._active) {
		this._active = active;
		if (active) {
			for (elementId in this._idToViews) {
				this._activateView(elementId);
			}
			for (var i = 0; i < this._groundLayers.length; ++i) {
				this._element.appendChild(this._groundLayers[i]);
			}
		}
		else {
			for (elementId in this._idToViews) {
				this._deactivateView(elementId);
			}
			for (var i = 0; i < this._groundLayers.length; ++i) {
				this._element.removeChild(this._groundLayers[i]);
			}
		}
	}
}

/**
 * Adds a view to this world part.
 * @param {View} view The view to be added
 */
WorldPartView.prototype.addView = function(view) {
	view.setProjection(this._overlayProjection);
	// TODO : is this good? currently done to set the html position before displayed in the new part
	// otherwise a short flickering can be seen when passing from one world part to the next
	view.update(0);
	var modelEl = view.getModelElement();
	this._idToViews[modelEl.id] = view;

	if (this._active) {
		this._activateView(modelEl.id);
	}
}

/**
 * Adds the view html element to the world which makes the view visible.
 * @param {Number} elementId The model element id the view belongs to.
 */
WorldPartView.prototype._activateView = function(elementId) {
	var view = this._idToViews[elementId];
	var modelEl = view.getModelElement();

	var layerNo = this._getLayerNoForModel(modelEl);
	this._idToLayerNo[modelEl.id] = layerNo;
	this._addToOverlayLayer(view.getElement(), layerNo);
	
	if (modelEl instanceof MovingPoint) {
		this._idToViewsThatChangeZOrder[modelEl.id] = view;
	}
	
	// take care of the z-index of the views
	if (!this._viewsInZOrder[layerNo]) {
		this._viewsInZOrder[layerNo] = [view];
	}
	else {
		var projC = this._overlayProjection.project(modelEl.x, modelEl.y, modelEl.z);
		for (var i = 0; i < this._viewsInZOrder[layerNo].length; ++i) {
			if (this._viewsInZOrder[layerNo][i].isInFrontOf(projC[0], projC[1])) {
				break;
			}
		}
		this._viewsInZOrder[layerNo].splice(i, 0, view);
	}
	for (i = 0; i < this._viewsInZOrder[layerNo].length; ++i) {
		this._viewsInZOrder[layerNo][i].getElement().style.zIndex = i;
	}
} 

/**
 * Removes the view html element to the world which makes the view invisible.
 * @param {Number} elementId The model element id the view belongs to.
 */
WorldPartView.prototype._deactivateView = function(elementId) {
	var view = this._idToViews[elementId];
	var modelEl = view.getModelElement();

	var layerNo = this._getLayerNoForModel(modelEl);
	this._removeFromOverlayLayer(view.getElement(), layerNo);
}

/**
 * Returns the layer number for the given model element
 * @param {Point} modelEl The model element.
 * @return {Number} The layer number.
 */
WorldPartView.prototype._getLayerNoForModel = function(modelEl) {
	return Math.floor(modelEl.z / WorldPartView.LAYER_HEIGHT) * 
			WorldPartView.LAYER_HEIGHT;
}

/**
 * Remove a view to this world part.
 * @param {View} view The view to be removed
 */
WorldPartView.prototype.removeView = function(view) {
	var modelEl = view.getModelElement();
	delete this._idToViews[modelEl.id];
	
	var layerNo = this._getLayerNoForModel(modelEl);
	delete this._idToLayerNo[modelEl.id];
	this._removeFromOverlayLayer(view.getElement(), layerNo);
	
	// reevaluate z-indices
	var index = view.getElement().style.zIndex.toInt();
	var views = this._viewsInZOrder[layerNo];
	views.splice(index, 1);
	for (var i = index; i < views.length; ++i) {
		views[i].getElement().style.zIndex = i;
	}
} 

/**
 * Returns the html element of this view.
 * @return {HTMLElement} The element.
 */
/*WorldPartView.prototype.getElement = function() {
	return this._element;
}*/

/**
 * Sends a request to the server to get the world view objects that are in our rect.
 */
WorldPartView.prototype._requestRect = function() {
	var self = this;
	Loader.instance.loadXml('/world/rect/' + this._x1 + '/' + this._y1 + 
			'/' + this._x2 + '/' + this._y2 + '/',
			function(responseXml) { 
				self._onRectReceive(responseXml); 
			});
}

/**
 * Callback when world view objects have been sent by the server.
 * Creates the necessary html elements and puts them into their
 * respective layers.
 * @param {Document} responseXml XML DOM document of the world objects
 * @see _overlayLayers
 * @see _groundLayers
 */
WorldPartView.prototype._onRectReceive = function(responseXml) {
	
	var fields = responseXml.getElementsByTagName('field');
//	var walls = responseXml.getElementsByTagName('wall');
	// TODO : overlays
	
	this._addFields(fields);
//	this._addWalls(walls)
}

// TODO : stretch this over time to prevent jerking!
/**
 * Creates html elements for the given fields and sorts them into their ground layer.
 * @param {Array} fields xml field elements to add into the world part view 
 */
WorldPartView.prototype._addFields = function(fields) {
	for (var i = 0; i < fields.length; ++i) {
		var field = fields[i];
		
		var fieldZ = field.getAttribute('z').toInt();
		
		var fieldCoords = this._groundProjection.project(field.getAttribute('x').toInt(),
				field.getAttribute('y').toInt(), fieldZ);
		
		// create the html element for the field
		var fieldEl = document.createElement('div');
		fieldEl.setAttribute('style', 'position: absolute; background: url(' + field.getAttribute('image') + 
				') repeat; left: ' + fieldCoords[0] + 'px; top: ' + fieldCoords[1] +
				'px; width: ' + this._fieldSize + 'px; height: ' + 
				this._fieldSize + 'px;');
/*		var fieldEl = document.createElement('img');
		fieldEl.src = field.getAttribute('image');
		fieldEl.alt = "groundtile";
		fieldEl.setAttribute('style', 'position: absolute; left: ' + fieldCoords[0] + 'px; top: ' + fieldCoords[1] +
				'px; width: ' + this._fieldSize + 'px; height: ' + this._fieldSize + 'px;'); */
				
		this._addToGroundLayer(fieldEl, fieldZ);
	}
}

/**
 * Adds an html element to a ground layer
 * @param {HTMLElement} element The element to be added.
 * @param {Number} layerNo The number of the layer to add the element to.
 */
WorldPartView.prototype._addToGroundLayer = function(element, layerNo) {
	// lazily create the layer html elements
	if (!this._groundLayers[layerNo])  {
		var layerEl = document.createElement('div');
		layerEl.setAttribute('style', 'position: absolute; left: ' + 
				this._groundLayersLeft + 'px; top: ' + 
				this._groundLayersTop + 'px; z-index:' + 
				layerNo + ';');
				
		this._groundLayers[layerNo] = layerEl;
		if (this._active) {
			this._element.appendChild(layerEl);
		}
	}
	
	this._groundLayers[layerNo].appendChild(element);
}

/**
 * Adds an html element to an overlay layer
 * @param {HTMLElement} element The element to add.
 * @param {Number} layerNo The number of the layer to add the element to.
 * @see _removeFromOverlayLayer
 */
WorldPartView.prototype._addToOverlayLayer = function(element, layerNo) {
	// lazily create the layer html elements
	if (!this._overlayLayers[layerNo])  {
		var layerEl = document.createElement('div');
		layerEl.setAttribute('style', 'position: absolute; left: 0px; top: 0px; z-index:' +
				(layerNo + 1) + ';');
		this._element.appendChild(layerEl);
		this._overlayLayers[layerNo] = layerEl;
	}
	
	this._overlayLayers[layerNo].appendChild(element);
}

/**
 * Removes an html element from an overlay layer.
 * @param {HTMLElement} element The html element to remove
 * @param {Number} layerNo The nomber of the layer to remove the element from.
 * @see _addToOverlayLayer
 */
WorldPartView.prototype._removeFromOverlayLayer = function(element, layerNo) {
	this._overlayLayers[layerNo].removeChild(element);
}

/**
 * Updates this part view. Takes care that all z-indices are set correctly
 * and all subviews are on the proper layer.
 * @param {Object} deltaT Time since last update in milliseconds
 * @return {Array} A list of views, that have moved out of this part of the world.
 */
WorldPartView.prototype.updateViews = function(deltaT) {
	// TODO : implement	z-index and layer management
	
	// check the views if they have left
	var outsideViews = [];
	
	for (id in this._idToViews) {
		var view = this._idToViews[id];
		var model = view.getModelElement();
		if (model.x >= this._x2 || model.x < this._x1 || 
			model.y >= this._y2 || model.y < this._y1) {
				outsideViews.push(view);
		}
	}
	
	// how many views before and after a changing view have to be checked.
	// higher number is required when scene is more crowded.
	const viewsToCheck = 5;
	
	// check for views that have changed z-ordering
	for (var id in this._idToViewsThatChangeZOrder) {
		view = this._idToViewsThatChangeZOrder[id];
		model = view.getModelElement();
		var layerNo = this._getLayerNoForModel(model);
		var views = this._viewsInZOrder[layerNo];

		var index = view.getElement().style.zIndex.toInt();
		// TODO : is there a better way to prevent double projection (here and in views.update() )?
		var projC = this._overlayProjection.project(model.x, model.y, model.z);
		for (var i = Math.max(0, index - viewsToCheck); i < index; ++i) {
			if (views[i].isInFrontOf(projC[0], projC[1])) {
				this._swapViewsZ(views, i, index);
			}
		}
		const index2 = Math.min(views.length - 1, index + viewsToCheck);
		for (i = index + 1; i <= index2; ++i) {
			if (!views[i].isInFrontOf(projC[0], projC[1])) {
				this._swapViewsZ(views, index, i);
			}
		}
	}
	
	return outsideViews;
}

/**
 * Swaps the z-indices of layerViews[index1] and layerViews[index2]
 * @param {Array} layerViews The array of views of a layer
 * @param {Number} index1 The first index in layerViews that should be swapped.
 * @param {Number} index2 The first index in layerViews that should be swapped.
 */
WorldPartView.prototype._swapViewsZ = function(layerViews, index1, index2) {
	var temp = layerViews[index1];
	for (var i = index1; i < index2; ++i) {
		layerViews[i] = layerViews[i + 1];
		layerViews[i].getElement().style.zIndex = i;
	}
	layerViews[index2] = temp;
	layerViews[index2].getElement().style.zIndex = index2;
}

/**
 * Destroys this world part view.
 */
WorldPartView.prototype.destroy = function() {
	// TODO : implement right
}

}