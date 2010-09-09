/**
 * @author maccesch
 */

import('core.Network');
import('core.MainLoop');
import('core.Settings');
import('view.WorldView');
import('model.Physics');


// export Controller
var Controller;

function package_management_Controller() {

/**
 * Constructs a new instance of Controller. Don't use this directly.
 * Use Controller.instance instead, see end of this file.
 * @classDescription Facade for model manipulations. It Provides high level methods for
 * manipulating the simulation model and takes care of sending them to the network.
 * @type {Object}
 * @return {Controller} The new instance.
 * @constructor
 */
Controller = function() {
	Network.instance.addProtocolCallback('cv', this._onVelocityReceive);
//	Network.instance.addProtocolCallback('nc', this._onNewClientReceive);
	Network.instance.addProtocolCallback('dis', this._onDisconnectReceive);
	Network.instance.addProtocolCallback('nmp', this._onNewMovingPointReceive);
	Network.instance.addProtocolCallback('np', this._onNewPointReceive);
	Network.instance.addProtocolCallback('del', this._onDeleteElementReceive);
	Network.instance.addProtocolCallback('nsiv', this._onNewSimpleImageViewReceive);
	Network.instance.addProtocolCallback('nsibv', this._onNewSimpleImageBuildingViewReceive);
	Network.instance.addProtocolCallback('nvsd', this._onNewViewStringDecorationReceive);
	Network.instance.addProtocolCallback('nwv', this._onNewWorldViewReceive);
	Network.instance.addProtocolCallback('wvfm', this._onWorldViewFollowModelReceive);
	Network.instance.addProtocolCallback('nw', this._onNewWallReceive);
	
//	this._initBullets();
}

/**
 * Maps client ids to the views of the models controlled by them respectively. Actually
 * it is a map to a map: clientId -> (elementId -> view).
 */
Controller.prototype._idToView = {};

/**
 * Maps client ids to their names.
 */
Controller.prototype._idToName = {};

/**
 * Initialize the bullets and their views.
 * @deprecated
 * @method
 */
Controller.prototype._initBullets = function() {
	this.bulletViews = [];
	this.currentBulletIndex = 0;
	
	for (var i = 0; i < Controller.BULLET_NO; ++i) {
		var bullet = new MovingPoint();
		
		var img = document.createElement("img");
		img.src = "images/networkdemo/bullet.png";
		img.style.cssText = "position:absolute;user-select:none;";
		document.body.appendChild(img);
		
		var bulletView = new SimpleView(bullet, img);
		this.bulletViews.push(bulletView);
		
		MainLoop.instance.register(bulletView);
		MainLoop.instance.register(bullet);
		
		MainLoop.instance.deactivate(bulletView);
		MainLoop.instance.deactivate(bullet);
	}
};

/**
 * Size of the bulletViews array.
 */
Controller.BULLET_NO = 100;

/**
 * Changes the velocity of element.
 * @param {MovingPoint} element The model element, that is the new velocity assigned to
 * @param {Number} vx X component of the new velocity vector.
 * @param {Number} vy Y component of the new velocity vector.
 * @param {Number} vz Z component of the new velocity vector.
 */
Controller.prototype.changeVelocity = function(element, vx, vy, vz) {
	element.vx = vx;
	element.vy = vy;
	element.vz = vz;
	
	Network.instance.send("cv_" + element.id + "_" + element.x + "_" + element.y + "_" + element.z + "_" + vx + "_" + vy + "_" + vz);
};

/**
 * Called when an element has changed the grid cell
 * @param {MovingPoint} element The model element that changed cells
 */
Controller.prototype.gridCellChanged = function(element) {
	if (element.mine) {
		Network.instance.send("cv_" + element.id + "_" + element.x + "_" + element.y + "_" + element.z + "_" +
		element.vx +
		"_" +
		element.vy +
		"_" +
		element.vz);
	}
}

/**
 * Fires a bullet from position (x, y, z) in with velocity vector (vx, vy, vz).
 * @param {Number} x X component of the bullets start position.
 * @param {Number} y Y component of the bullets start position.
 * @param {Number} z Z component of the bullets start position.
 * @param {Number} vx X component of the velocity vector.
 * @param {Number} vy Y component of the velocity vector.
 * @param {Number} vz Z component of the velocity vector.
 */
Controller.prototype.fireBullet = function(x, y, z, vx, vy, vz) {
	var bulletView = this.bulletViews[this.currentBulletIndex];
	var bullet = bulletView.modelElement;
	bullet.x = x;
	bullet.y = y;
	bullet.z = z;
	bullet.vx = vx;
	bullet.vy = vy;
	bullet.vz = vz;
	
	MainLoop.instance.activate(bullet);
	MainLoop.instance.activate(bulletView);
	
	this.currentBulletIndex = (this.currentBulletIndex + 1) % Controller.BULLET_NO;
	
	Network.instance.send("bul_0_" + bullet.x + "_" + bullet.y + "_" + bullet.z + "_" + 
	bullet.vx + "_" + bullet.vy + "_" + bullet.vz);
};

/**
 * Callback for network velocity data receive. Protocol prefix is "cv" for "Change Velocity".
 * @param {Integer} elementId The id of the model element that should receive the velocity change
 * @param {Float} x X coordinate of the element
 * @param {Float} y Y coordinate of the element
 * @param {Float} z Z coordinate of the element
 * @param {Float} vx X velocity of the element
 * @param {Float} vy Y velocity of the element
 * @param {Float} vz Z velocity of the element
 * @param {Integer} clientId The id of the client the model element belongs to
 * @see Network#_onReceive
 */
Controller.prototype._onVelocityReceive = function(elementId, x, y, z, vx, vy, vz, clientId) {
	
	var element = Controller.instance._idToView[clientId][elementId].getModelElement();
	element.x = x.toFloat();
	element.y = y.toFloat();
	element.z = z.toFloat();
	element.vx = vx.toFloat();
	element.vy = vy.toFloat();
	element.vz = vz.toFloat();
};

/**
 * Callback for network delete element receive. Protocol prefix is "dm" for "Delete Model element".
 * @param {Integer} elementId The id of the model element that should be deleted
 * @param {Integer} clientId The id of the client the model element belongs to
 * @see Network#_onReceive
 */
Controller.prototype._onDeleteElementReceive = function(elementId, clientId) {

	Controller.instance._removeViewsAndElements(clientId, [elementId]);
};

/**
 * Callback for network disconnect receive (when another client has disconnected). Protocol prefix is "dis" for "DISconnect client".
 * @param {Integer} clientId The id of the disconnected client
 * @see Network#_onReceive
 */
Controller.prototype._onDisconnectReceive = function(clientId) {

	// TODO : what if I don't get a disconnect because I am in another region? see gameserver connectionLost()
	
	var views = Controller.instance._idToView[clientId];
	var removeViews = [];
	for (var key in views) {
		var view = views[key];
		if (!view.getModelElement().persistent) {
			removeViews.push(key);
		}
	}
	Controller.instance._removeViewsAndElements(clientId, removeViews);
//		Logger.instance.system('<b>' + Controller.instance.getName(clientId) + '</b> left.');
};

/**
 * Callback for network bullet fired receive. Protocol prefix is "bul" for "BULlet".
 * @param {Integer} type = '0' The type of bullet
 * @param {Float} x X coordinate of the bullet
 * @param {Float} y Y coordinate of the bullet
 * @param {Float} z Z coordinate of the bullet
 * @param {Float} vx X velocity of the bullet
 * @param {Float} vy Y velocity of the bullet
 * @param {Float} vz Z velocity of the bullet
 * @param {Integer} clientId The id of the client the bullet belongs to
 * @see Network#_onReceive
 */
Controller.prototype._onBulletReceive = function(type, x, y, z, vx, vy, vz, clientId) {
	
	// TODO : use type for something. currently there is only one type of bullets. see also fireBullet().

	var bulletView = Controller.instance.bulletViews[Controller.instance.currentBulletIndex];
	var bullet = bulletView.modelElement;
	bullet.x = x.toFloat();
	bullet.y = y.toFloat();
	bullet.z = z.toFloat();
	bullet.vx = vx.toFloat();
	bullet.vy = vy.toFloat();
	bullet.vz = vz.toFloat();
	
	MainLoop.instance.activate(bullet);
	MainLoop.instance.activate(bulletView);
	
	Controller.instance.currentBulletIndex = (Controller.instance.currentBulletIndex + 1) % Controller.BULLET_NO;
};

/**
 * Callback for network new MovingPoint receive. This has to be send before the view of this element is send.
 * Protocol prefix is "nmp" for "New MovingPoint".
 * @param {Integer} elementId The id of the model element that should be created
 * @param {Float} x X coordinate of the new element
 * @param {Float} y Y coordinate of the new element
 * @param {Float} z Z coordinate of the new element
 * @param {Float} vx X velocity of the new element
 * @param {Float} vy Y velocity of the new element
 * @param {Float} vz Z velocity of the new element
 * @param {Integer} persistent 0/1 Perstistence of the new element
 * @param {Integer} clientId The id of the client the model element belongs to
 * @see Network#_onReceive
 * @see MovingPoint
 */
Controller.prototype._onNewMovingPointReceive = function(elementId, x, y, z, vx, vy, vz, persistent, clientId) {
	
	var modelElement = new MovingPoint();
	modelElement.id = elementId;
	
	modelElement.x = x.toFloat();
	modelElement.y = y.toFloat();
	modelElement.z = z.toFloat();
	modelElement.vx = vx.toFloat();
	modelElement.vy = vy.toFloat();
	modelElement.vz = vz.toFloat();
	
	modelElement.persistent = persistent.toInt() ? true : false;
	
	if (clientId == Network.instance.getClientId()) {
		modelElement.mine = true;
	}
	
	if (!Controller.instance._idToView[clientId]) {
		Controller.instance._idToView[clientId] = {};
	}
	Controller.instance._idToView[clientId][elementId] = modelElement;
}

/**
 * Callback for network new Point receive. This has to be send before the view of this element is send.
 * Protocol prefix is "np" for "New Point".
 * @param {Integer} elementId The id of the model element that should be created
 * @param {Float} x X coordinate of the new element
 * @param {Float} y Y coordinate of the new element
 * @param {Float} z Z coordinate of the new element
 * @param {Integer} persistent 0/1 Perstistence of the new element
 * @param {Integer} clientId The id of the client the model element belongs to
 * @see Network#_onReceive
 * @see Point
 */
Controller.prototype._onNewPointReceive = function(elementId, x, y, z, persistent, clientId) {
	
	var modelElement = new Point();
	modelElement.id = elementId;
	
	modelElement.x = x.toFloat();
	modelElement.y = y.toFloat();
	modelElement.z = z.toFloat();
	
	modelElement.persistent = persistent.toInt() ? true : false;
	
	if (clientId == Network.instance.getClientId()) {
		modelElement.mine = true;
	}
	
	if (!Controller.instance._idToView[clientId]) {
		Controller.instance._idToView[clientId] = {};
	}
		Controller.instance._idToView[clientId][elementId] = modelElement;
}

/**
 * Callback for network new Wall receive. This has to be send before the view of this element is send.
 * Protocol prefix is "nw" for "New Wall".
 * @param {Integer} elementId The id of the model element that should be created
 * @param {Float} x X coordinate of the ground line's first point
 * @param {Float} y Y coordinate of the ground line's first point
 * @param {Float} x2 X coordinate of the ground line's second point
 * @param {Float} y2 Y coordinate of the ground line's second point
 * @param {Float} z Z coordinate of the ground line
 * @param {Float} height Height of the wall
 * @param {Integer} clientId The id of the client the model element belongs to
 * @see Network#_onReceive
 * @see Wall
 */
Controller.prototype._onNewWallReceive = function(elementId, x, y, x2, y2, z, height, clientId) {
	
	var modelElement = new Wall();
	modelElement.id = elementId;
	
	modelElement.x = x.toFloat();
	modelElement.y = y.toFloat();
	modelElement.z = z.toFloat();
	modelElement.x2 = x2.toFloat();
	modelElement.y2 = y2.toFloat();
	modelElement.height = height.toFloat();
	
	if (clientId == Network.instance.getClientId()) {
		modelElement.mine = true;
	}
	
	if (!Controller.instance._idToView[clientId]) {
		Controller.instance._idToView[clientId] = {};
	}
		Controller.instance._idToView[clientId][elementId] = modelElement;
}

/**
 * Callback for network new SimpleImageView receive. Before this can be sent the model element that is
 * represented by this view has to be sent. Protocol prefix is "nsiv" for "New SimpleImageView".
 * @param {Integer} elementId The id of the model element that should be viewed
 * @param {String} imagePath The path (relative to the image root. See settings.IMAGES_ROOT) of the image for the view
 * @param {String, Integer} biasLeft Horizontal part of the view bias
 * @param {String, Integer} biasTop Vertical part of the view bias
 * @param {Integer} clientId The id of the client the view belongs to
 * @see Network#_onReceive
 * @see SimpleImageView
 * @see SimpleView
 * @see settings.IMAGES_ROOT
 */
Controller.prototype._onNewSimpleImageViewReceive = function(elementId, imagePath, biasLeft, biasTop, clientId) {
	
	var modelElement = Controller.instance._idToView[clientId][elementId];
	var view = new SimpleImageView(modelElement, imagePath, biasLeft, biasTop);
	Controller.instance._idToView[clientId][elementId] = view;
	
	// Points need no update
	if (modelElement instanceof MovingPoint) {
		MainLoop.instance.register(modelElement);
		MainLoop.instance.register(view);
	}
	
	Controller.instance._worldView.addView(view);
}

/**
 * Callback for network new SimpleImageBuildingView receive. Before this can be sent the model element that is
 * represented by this view has to be sent. Protocol prefix is "nsibv" for "New SimpleImageBuildingView".
 * @param {Integer} elementId The id of the model element that should be viewed
 * @param {String} imagePath The path (relative to the images root. See settings.IMAGES_ROOT) of the image for the view
 * @param {Integer} left1 X coordinate of the left point of the line in pixels
 * @param {Integer} top1 Y coordinate of the left point of the line in pixels
 * @param {Integer} left2 X coordinate of the right point of the line in pixels
 * @param {Integer} top2 Y coordinate of the right point of the line in pixels
 * @param {Integer} clientId The id of the client the view belongs to
 * @see Network#_onReceive
 * @see SimpleImageBuildingView
 * @see SimpleView
 * @see settings.IMAGES_ROOT
 */
Controller.prototype._onNewSimpleImageBuildingViewReceive = function(elementId, imagePath, left1, top1, left2, top2, clientId) {
	
	var modelElement = Controller.instance._idToView[clientId][elementId];
	var view = new SimpleImageBuildingView(modelElement, imagePath, left1, top1, left2, top2);
	Controller.instance._idToView[clientId][elementId] = view;
	
	// Points need no update
	if (modelElement instanceof MovingPoint) {
		MainLoop.instance.register(modelElement);
		MainLoop.instance.register(view);
	}
	
	Controller.instance._worldView.addView(view);
}

/**
 * Callback for network new View string decoration receive. Before this can be sent the view 
 * of the model element that should be decorated has to be sent.
 * Protocol prefix is "nvsd" for "New View String Decoration".
 * @param {Object} elementId The id of the model element whose view should be decorated
 * @param {Object} decorationStr The decoration string
 * @param {Object} clientId The id of the client the decorated view belongs to
 * @see Network#_onReceive
 * @see SimpleView.decorate
 */
Controller.prototype._onNewViewStringDecorationReceive = function(elementId, decorationStr, clientId) {
	
	var view = Controller.instance._idToView[clientId][elementId];
	var decorationEl = Controller.instance._createStringDecorationElement(decorationStr);
	view.decorate(decorationEl);
}

/**
 * Callback for network new WorldView receive. This should be sent before any model elements
 * or views are sent. Protocol prefix is "nwv" for "New WorldView".
 * @param {Integer} centerX X coordinate of the center of the view in world units
 * @param {Integer} centerY Y coordinate of the center of the view in world units
 * @param {Integer} centerZ Z coordinate of the center of the view in world units
 * @param {Integer} clientId The id of the client the world view belongs to (always this client)
 * @see Network#_onReceive
 * @see SimpleView.decorate
 */
Controller.prototype._onNewWorldViewReceive = function(centerX, centerY, centerZ, clientId) {
	
	// TODO : configure canvas size of world view?
	Controller.instance._worldView = new WorldView(centerX, centerY, centerZ); 
	MainLoop.instance.register(Controller.instance._worldView);
}

/**
 * Callback for network WorldView follow model receive. This has to be sent after world view and after
 * the model which is followed and its view have been sent.
 * Protocol prefix is "wvfm" for "World View Follow Model".
 * @param {Integer} elementId The id of the model element that should be followed
 * @param {Integer} clientId The id of the client the followed model belongs to
 * @see Network#_onReceive
 * @see SimpleView.decorate
 */
Controller.prototype._onWorldViewFollowModelReceive = function(elementId, clientId) {
	
	Controller.instance._worldView.followModel(Controller.instance._idToView[clientId][elementId].getModelElement());
	
	// TODO : this is bad!
	GameLogic.instance._player = Controller.instance._idToView[clientId][elementId].getModelElement();
}

/**
 * Removes all given views and their models.
 * @param {Number} clientId Id of the owner of the models and views.
 * @param {Array} elementIds Array of ids of the models to be removed.
 */
Controller.prototype._removeViewsAndElements = function(clientId, elementIds) {
	for (var i = 0; i < elementIds.length; ++i) {
		var elementId = elementIds[i];
		var view = Controller.instance._idToView[clientId][elementId];
		MainLoop.instance.unregister(view);
		MainLoop.instance.unregister(view.getModelElement());
		Controller.instance._worldView.removeView(view);
		delete Controller.instance._idToView[clientId][elementId];
	}
}

/**
 * Returns the model element with the given id that belongs to this client.
 * @param {String} elementId The model element id.
 * @return {Point, MovingPoint, DynamicGameObject} The model element with the specified id.
 */
Controller.prototype.getModelElementById = function(elementId) {
	return this._idToView[Network.instance.getClientId()][elementId].getModelElement();
}

/**
 * Returns the view for the given arguments.
 * @param {Number, String} clientId The client id of the owner of the view
 * @param {Number, String} elementId The model element id of the view's model element
 * @return {View} The view object.
 */
Controller.prototype.getView = function(clientId, elementId) {
	return this._idToView[clientId][elementId];
}

/**
 * Returns the name of the client with the specified id.
 * @param {Number, String} clientId The id of the client.
 * @return {String} The name of the client (of the player profile).
 * @deprecated
 */
Controller.prototype.getName = function(clientId) {
	return this._idToName[clientId];
}

/**
 * Creates the html element that contains the text and is added to a view that should be decorated with the text. GAME_CODE
 * @param {String} decorationStr The decoration string.
 * @return {HTMLElement} The decoration element ready to be added to a view.
 */
Controller.prototype._createStringDecorationElement = function(decorationStr) {
	var decorationEl = document.createElement('div');
	decorationEl.innerHTML = decorationStr;
	decorationEl.setAttribute('style', 'position: absolute; left: -30px; top: -13px; width: 124px; text-align: center; font-size: 12px;');
	return decorationEl;
}

Controller.instance = new Controller();

}
