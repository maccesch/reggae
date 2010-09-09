/**
 * @author maccesch
 * TODO : this is undocumented and unmature
 */

function Grid(worldSizeX, worldSizeY, objectNumber) {

	var cellNo = Math.sqrt(objectNumber);
	var worldRatio = worldSizeY / worldSizeX;

	this.cellNoX = Math.floor(cellNo / worldRatio) + 1;
	this.cellNoY = Math.floor(cellNo * worldRatio) + 1;

	this.cells = initCells(this.cellNoX, this.cellNoY);

	this.worldSizeX = worldSizeX;
	this.worldSizeY = worldSizeY;
}

Grid.prototype.MIN_OBSTACLE_DIST = 1;

Grid.prototype.addItem = function(item) {

	var cellCoords = this.getCellCoords(item.x, item.y);

	this.cells[cellCoords[0]][cellCoords[1]].items.push(item);
};

//returns all items that are in the same cell as (worldX, worldY) is.
Grid.prototype.getItems = function(worldX, worldY) {

	var cellCoords = this.getCellCoords(worldX, worldY);
	return this.cells[cellCoords[0]][cellCoords[1]].items;
};

// returns all obstacles that are in the same cell as (worldX, worldY) is.
Grid.prototype.getObstacles = function(worldX, worldY) {

	var cellCoords = this.getCellCoords(worldX, worldY);
	return this.cells[cellCoords[0]][cellCoords[1]].obstacles;
};

Grid.prototype.addObstacle = function(obstacle) {

	// TODO : make cells bigger for adding obstacles

	var cellCoords1 = this.getCellCoords(obstacle.x1, obstacle.y1);
	var cellCoords2 = this.getCellCoords(obstacle.x2, obstacle.y2);

	var x1 = cellCoords1[0];
	var y1 = cellCoords1[1];

	var x2 = cellCoords2[0];
	var y2 = cellCoords2[1];

	if (x1 == x2 && y1 == y2) {
		this.cells[x1][y1].obstacles.push(obstacle);

	} else {
		
		// if the obstacle ground line spans multiple cells
		// put it in all of them
		var xFac = 1;
		var yFac = 1;
		
		if (x1 > x2) {
			xFac = -1;
			x1 = x2;
			x2 = cellCoords1[0];
		}
		
		if (y1 > y2) {
			yFac = -1;
			y1 = y2;
			y2 = cellCoords1[1];
		}
		
		var xDiff = x2 - x1;
		var yDiff = y2 - y1;
		
		var yFirst = false;
		if (yDiff > xDiff) {
			yFist = true;
			yDiff = xDiff;
			xDiff = y2 - y1;
		}
		
		var yPart = 0;
		var yIncrement = (yDiff) / (xDiff);
		
		var j = 0;
		
		for (var i = 0; i <= xDiff; ++i) {
		
			if (yFirst) {
				this.cells[x1 + xFac * j][y1 + yFac * i].obstacles.push(obstacle);
			}
			else {
				this.cells[x1 + xFac * i][y1 + yFac * j].obstacles.push(obstacle);
			}
			
			yPart += yIncrement;
			if (yPart >= 1) {
				--yPart;
				++j;
			}
		}
	}
};

// returns the coordinates of a grid cell that contains the specified
// coordinates.
Grid.prototype.getCellCoords = function(worldX, worldY) {
	return [ Math.floor(worldX / this.worldSizeX * this.cellNoX),
			Math.floor(worldY / this.worldSizeY * this.cellNoY) ];
};

// initializes the 2-dim-array of lists
function initCells(x, y) {
	var cells = [];

	for ( var i = 0; i < x; ++i) {
		cells[i] = [];

		for ( var j = 0; j < y; ++j) {
			cells[i][j] = new Cell();
		}
	}

	return cells;
}

Grid.prototype.checkItemCollections = function(gameObj, inventory) {
	 var items = this.getItems(gameObj.x, gameObj.y);
	 var collectionOccurred = false;

	 for (var i = 0; i < items.length; ++i) {
		 
		 var collDistSqr = gameObj.collisionRadius + items[i].radius;
		 collDistSqr *= collDistSqr;
		 
		 if (gameObj.distSqr(items[i].x, items[i].y, gameObj.z) < collDistSqr) {
			 collectionOccurred = true;
			 inventory.addItem(items[i]);
		 }
	 }
	 
	 if (collectionOccurred) {
	 	inventory.redraw();
	 }
};

// If the given gameobject collided with any obstacle if it continued to move
// in its current direction, the next* Values are ajusted accordingly.
// movP has to be an MovingPoint
Grid.prototype.resolveCollisions = function(movP, deltaT) {

	var obstacles = this.getObstacles(movP.x, movP.y);
	// obstacles.concat(this.getObstacles(movP.nextX, movP.nextY));
	for ( var i = 0; i < obstacles.length; ++i) {

		if (obstacles[i].checkCollision(movP)) {
			var factor = 0; // deltaT * lambda * (-this.MIN_OBSTACLE_DIST /
			// movP.length(movP.vx, movP.vy, movP.vz));

			movP.nextX = movP.x + movP.vx * factor;
			movP.nextY = movP.y + movP.vy * factor;
			movP.nextZ = movP.z + movP.vz * factor;

			movP.collisionOcurred();
			return;
		}
	}
};

/**
 * Returns the obstacle that intersects with the line from (xp, yp) to (xq, yq)
 * and is nearest to (xp, yp).
 * 
 * @param xp
 *            x-coordinate of the first point p.
 * @param yp
 *            y-coordinate of the first point p.
 * @param xq
 *            x-coordinate of the second point q.
 * @param yq
 *            y-coordinate of the second point q.
 * @param collisionRadius
 *            Radius of collision
 * @returns The obstacle and the position of the cut point (lambda) if found,
 *          otherwise undefined.
 */
Grid.prototype.getIntersectingObstacle = function(xp, yp, xq, yq,
		collisionRadius) {
	var obsts = this.getObstaclesForLine(xp, yp, xq, yq);
	var line = [ xp, yp, xq, yq ];
	var lineVec = [ xq - xp, yq - yp ];
	var lambdas;
	var minLambda1 = 2;
	var index = -1;
	var lambda2 = 10;

	for ( var i = 0; i < obsts.length; ++i) {
		lambdas = Math.intersectLines2D(line, [ obsts[i].x1, obsts[i].y1,
				obsts[i].x2, obsts[i].y2 ]);

		// check if the lines come too close
		if (lambdas[1] < 0 || lambdas[1] > 1) {
			var obstPt;
			if (lambdas[1] < 0) {
				obstPt = [obsts[i].x1, obsts[i].y1];
			}
			else if (lambdas[1] > 1) {
				obstPt = [obsts[i].x2, obsts[i].y2];
			}

			var gamma = Math.dropPerpendicular2D(obstPt, line);
			if (gamma > 0
					&& gamma < 1
					&& Math.pointDist( [ line[0] + lineVec[0] * gamma,
							line[1] + lineVec[1] * gamma ], obstPt) <= collisionRadius
					&& gamma < minLambda1) {

				minLambda1 = gamma;
				index = i;
				lambda2 = lambdas[1];
			}
		} else if (lambdas[0] > 0 && lambdas[0] < 1 && lambdas[0] < minLambda1) {

			minLambda1 = lambdas[0];
			index = i;
			lambda2 = lambdas[1];
		}
	}

	if (index >= 0) {
		return [obsts[index], lambda2];
	}
};

/**
 * Gets all obstacles that could intersect the given line.
 * 
 * @param x1
 *            x-coordinate of the first point of the line
 * @param y1
 *            y-coordinate of the first point of the line
 * @param x2
 *            x-coordinate of the second point of the line
 * @param y2
 *            y-coordinate of the second point of the line
 * @returns Found obstacles.
 */
Grid.prototype.getObstaclesForLine = function(x1, y1, x2, y2) {
	// TODO :
	return this.getObstacles(x1, y1).concat(this.getObstacles(x2, y2));
};

Grid.prototype.calcPath = function(from, to, collisionRadius) {

	function getNextPt(curObst, curPt) {
		if (curPt[0] == curObst.x1 && curPt[1] == curObst.y1) {
			return [curObst.x2, curObst.y2];
		}
		else {
			return [curObst.x1, curObst.y1];
		}
	}

	function getNextNeighbour(curObst, curPt) {
		if (curPt[0] == curObst.x1 && curPt[1] == curObst.y1) {
			return curObst.neighbour1;
		}
		else {
			return curObst.neighbour2;
		}
	}

	var paths = [];
	var i;

	var intersectionResult = this.getIntersectingObstacle(from[0], from[1],
			to[0], to[1], collisionRadius);

	if (!intersectionResult) {
		paths[0] = new Path();
		paths[0].pushPoint(from, [ 0, 0 ]);
		paths[0].pushPoint(to, [ 0, 0 ]);
		return paths[0];
	}

	var lambda = intersectionResult[1];
	var curPt = undefined;

	// try to pass the obstacle in both directions
	for (i = 0; i < 2; ++i) {
		paths[i] = new Path();
		paths[i].pushPoint(from, [ 0, 0 ]);

		var curObst = intersectionResult[0];
		var curObstVec;

		var curFromPt = [ from[0], from[1] ];

		// the other direction was already checked
		if (curPt) {
			lambda = 1 - lambda;
		}

		if (lambda < 0.5) {
			curPt = [ curObst.x1, curObst.y1 ];
			curObstVec = [ curObst.x1 - curObst.x2, curObst.y1 - curObst.y2 ];
		} else {
			curPt = [ curObst.x2, curObst.y2 ];
			curObstVec = [ curObst.x2 - curObst.x1, curObst.y2 - curObst.y1 ];
		}

		// theres no intersection point, but the object comes too close to
		// an obstacle
		if (lambda < 0 || lambda > 1) {
			paths[i].pushPoint(curPt, curObstVec);
			curFromPt = curPt;
			break;
		}

		var curDir = Math.getDirection2D(curPt, curFromPt, to);

		var nextPt;

		// check how far the obstacle extends in the current direction
		while (true) {
			curObst = getNextNeighbour(curObst, curPt);

			if (!curObst) {
				paths[i].pushPoint(curPt, curObstVec);
				curFromPt = curPt;
				break;
			}
			nextPt = getNextPt(curObst, curPt);

			var tempDir = Math.getDirection2D(nextPt, curFromPt, curPt);
			if (tempDir == curDir || Math.abs(tempDir) == 2) {

				curObstVec = nextPt.minus(curPt);
				curPt = nextPt;
				if (paths[i].length() > 0 &&
				Math.getDirection2D(curPt, curFromPt, paths[i].lastPoint()) ==
				curDir) {
					paths[i].popPoint();
				}
			} else {
				paths[i].pushPoint(curPt, curObstVec);
				if (Math.getDirection2D(nextPt, curPt, to) != curDir) {
					curFromPt = curPt;
					break;
				} else {
					curObstVec = nextPt.minus(curPt);
					curPt = nextPt;
				}
			}
		}
	}

	for (i = 0; i < paths.length; ++i) {
		var tempPath = this.calcPath(paths[i].lastPoint(), to, collisionRadius);
		tempPath.popFirstPoint();
		paths[i].append(tempPath);
	}

	// find shortest path
	var index = -1;
	var minLength = Infinity;
	for (i = 0; i < paths.length; ++i) {
		var curLength = paths[i].pathLength();
		if (curLength < minLength) {
			minLength = curLength;
			index = i;
		}
	}
	return paths[index];
};

/*******************************************************************************
 * Cell
 ******************************************************************************/

function Cell() {

	this.obstacles = [];
	this.items = [];
	this.gameObjects = [];
}


/**
 * Checks if a collision of this obstacle and an object ocurrs.
 * 
 * @param {MovingPoint}
 *            movP The object to check collision for.
 * @return Lambda, if the given game object collided with this obstacle if it
 *         continued to move in its current direction, else false. Lambda is a
 *         number between 0 and 1 and movP->pos * movP->velocity * deltaT *
 *         lambda equals the collision coordinates.
 */
Obstacle.prototype.checkCollision = function(movP) {

	if (movP.z != this.z) {
		return false;
	}

	// TODO : handle big vx1 and vy1

	var x1 = movP.nextX;
	var y1 = movP.nextY;

	var vx1 = x1 - movP.x;
	var vy1 = y1 - movP.y;

	if (vx1 == 0 && vy1 == 0) {
		return false;
	}

	var lambda2 = Math.dropPerpendicular2D( [ x1, y1 ], [ this.x1, this.y1,
			this.x2, this.y2 ]);

	if (lambda2 == NaN || lambda2 < -0.2 || lambda2 > 1.2) {
		return false;
	}

	var tempX;
	var tempY;

	if (lambda2 < 0) {
		tempX = this.x1;
		tempY = this.y1;
	} else if (lambda2 > 1) {
		tempX = this.x2;
		tempY = this.y2;
	} else {
		tempX = this.x1 + lambda2 * (this.x2 - this.x1);
		tempY = this.y1 + lambda2 * (this.y2 - this.y1);
	}

	var diffX = tempX - x1;
	var diffY = tempY - y1;

	var distSqr = diffX * diffX + diffY * diffY;

	// ensure correctness of the z-index of the game object
/*	if (distSqr < 4000 && this.zIndex > 0) {
		if (diffY < 0) {
			movP.zIndex = this.zIndex + 3;
		} else {
			movP.zIndex = this.zIndex - 3;
		}
	}
*/
	return distSqr < movP.collisionRadius * movP.collisionRadius;
};
