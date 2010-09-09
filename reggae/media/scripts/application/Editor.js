/**
 * @author maccesch
 * TODO : this is undocumented and unmature
 */

function Editor(worldView) {

	this.mode = this.MODE_IDLE;
	this.worldView = worldView;
	this.worldDescription = new WorldDescription();

	this.tiles = [];

	// copy world tiles
	for ( var i = 0; i < worldView.tiles.length; ++i) {
		this.tiles[i] = [];
		for ( var j = 0; j < worldView.tiles[i].length; ++j) {
			this.tiles[i][j] = worldView.tiles[i][j];
		}
	}

	this.x1 = 0;
	this.y1 = 0;

	this.x2 = 1;
	this.y2 = 0.5;

	this.index;

	this.firstCoordinatesSet = false;

	this.pointChecker = new DuplicatePointChecker();

	this.lastChangedTiles = [];
}

Editor.prototype.MODE_IDLE = 0;
Editor.prototype.MODE_FRONT_WALL_LINE = 1;

// calculates the correct enpoint in image-tile coordinates (can be halfs)
Editor.prototype.updateLineEndpoint = function(mouseX, mouseY) {

	var tileCoords = worldView.convertToImageTiles(mouseX, mouseY);

	if (tileCoords[0] < 0)
		tileCoords[0] = 0;
	if (tileCoords[1] < 0)
		tileCoords[1] = 0;

	var sign = tileCoords[1] > this.y1 ? 1 : -1;

	this.y2 = this.y1 + sign * Math.abs(tileCoords[0] - this.x1) * 0.5;

	this.x2 = tileCoords[0];
}

Editor.prototype.updateMousePos = function(mouseX, mouseY) {

	switch (this.mode) {
	case this.MODE_FRONT_WALL_LINE:

		consoleMessage(this.x1 + ", " + this.y1 + " - " + this.x2 + ", "
				+ this.y2);

		if (this.firstCoordinatesSet)
			this.updateLineEndpoint(mouseX, mouseY);
		else {
			var tileCoords = this.worldView.convertToImageTiles(mouseX, mouseY);
			this.x1 = tileCoords[0];
			this.y1 = tileCoords[1];
			this.x2 = tileCoords[0] + 1;
			this.y2 = tileCoords[1] + 0.5;
		}

		this.worldDescription.updateFrontWall(this.index, this.x1, this.y1,
				this.x2, this.y2);

		var changedTiles = this.worldDescription.genTilesForFrontWall(
				this.index, this.tiles);

		// wall line changed
		if (this.lastChangedTiles != changedTiles) {

			// when line goes "backwards"
			var x, y;
			if (this.x1 > this.x2) {
				for ( var i = 0; i < changedTiles.length / 2; ++i) {
					var temp = changedTiles[2 * i];
					changedTiles[2 * i] = changedTiles[2 * i + 1];
					changedTiles[2 * i + 1] = temp;
				}
				changedTiles.reverse();
			}
			// restore tiles that are no longer covered by the current wall line
			for ( var i = 0; i < this.lastChangedTiles.length / 2; ++i) {
				x = this.lastChangedTiles[2 * i];
				y = this.lastChangedTiles[2 * i + 1];
				if (2 * i >= changedTiles.length || x != changedTiles[2 * i]
						|| y != changedTiles[2 * i + 1]) {

					this.tiles[x][y] = this.worldView.tiles[x][y];
				}
			}

			this.worldView.updateTileImages(this.lastChangedTiles, this.tiles);

			this.lastChangedTiles = changedTiles;

			changedTiles = this.worldDescription.genFrontWallTiles(this.tiles);
			this.worldView.updateTileImages(changedTiles, this.tiles);
		}

	}
}

Editor.prototype.clicked = function(mouseX, mouseY) {

	this.updateMousePos(mouseX, mouseY);

	switch (this.mode) {
	case this.MODE_FRONT_WALL_LINE:

		var tileCoords;

		if (!this.firstCoordinatesSet) {
			this.firstCoordinatesSet = true;
			tileCoords = this.worldView.convertToImageTiles(mouseX, mouseY);
			this.x1 = tileCoords[0];
			this.y1 = tileCoords[1];
		} else {

			tileCoords = this.worldDescription.getFrontWallCoords(this.index);
			this.x1 = tileCoords[2];
			this.y1 = tileCoords[3];
			this.lastChangedTiles = [];
			this.index = this.worldDescription.addFrontWall(0, 0, 0, 0);
		}

		break;
	}

	this.updateMousePos(mouseX, mouseY);
}

Editor.prototype.setMode = function(mode) {

	this.mode = mode;

	switch (this.mode) {
	case this.MODE_FRONT_WALL_LINE:

		this.index = this.worldDescription.addFrontWall(0, 0, 0, 0);
		this.firstCoordinatesSet = false;
		break;
	}
}

Editor.prototype.commit = function(grid) {

	var changedTiles = this.worldDescription.generateTiles(this.worldView);
	this.worldView.updateTileImages(changedTiles);
	this.worldDescription.generateObstacles(grid, this.worldView.tileSize);
}