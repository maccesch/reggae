
Array.prototype.vecLengthSqr = function() {
	var sum = 0;
	for (var i = 0; i < this.length; ++i) {
		sum += this[i] * this[i];
	}
	return sum;
};

Array.prototype.vecLength = function() {
	return Math.sqrt(this.vecLengthSqr());
};

Array.prototype.dot = function(vec) {
	var sum = 0;
	for (var i = 0; i < this.length; ++i) {
		sum += this[i] * vec[i];
	}
	return sum;
};

Array.prototype.norm = function() {
	var result = [];
	var len = this.vecLength();
	if (len > 0) {
		for (var i = 0; i < this.length; ++i) {
			result[i] = this[i] / len;
		}
		return result;
	}
	else {
		return [0, 0, 0];
	}
};

Array.prototype.plus = function(vec) {
	var result = [];
	for (var i = 0; i < this.length; ++i) {
		result.push(this[i] + vec[i]);
	}
	return result;
};

Array.prototype.minus = function(vec) {
	var result = [];
	for (var i = 0; i < this.length; ++i) {
		result.push(this[i] - vec[i]);
	}
	return result;
};

Array.prototype.times = function(scalar) {
	var result = [];
	for (var i = 0; i < this.length; ++i) {
		result.push(this[i] * scalar);
	}
	return result;
};

Math.intersectLines2D = function(lineCoords1, lineCoords2) {
	var px = lineCoords2[0] - lineCoords1[0];
	var py = lineCoords2[1] - lineCoords1[1];
	
	var x1 = lineCoords1[2] - lineCoords1[0];
	var y1 = lineCoords1[3] - lineCoords1[1];
	
	var x2 = lineCoords2[2] - lineCoords2[0];
	var y2 = lineCoords2[3] - lineCoords2[1];
	
	var detA = x2 * y1 - x1 * y2;
	
	var lambda1 = (x2 * py - y2 * px) / detA;
	var lambda2 = (x1 * py - y1 * px) / detA;
	
	return [lambda1, lambda2];
};

/**
 * When standing on the pivotPt and looking at the lookAtPt this
 * function tells if the queryPt is to the left or to the right.
 * The Points are alle Arrays with 2 elements.
 * @returns 1 if queryPt is to the left, -1 if to the right, 0 if straight on
 * and +2 / -2 if behind pivotPt.
 */
Math.getDirection2D = function(queryPt, pivotPt, lookAtPt) {

	var viewVec = lookAtPt.minus(pivotPt);
	var ortho = [-viewVec[1], viewVec[0]];
	var factor = 1;
	if (queryPt.minus(pivotPt).dot(viewVec) < 0) {
		factor = 2;
	}
	var dir = ortho.dot(queryPt.minus(lookAtPt));
	if (dir > 0) {
		return 1 * factor;
	}
	else if (dir < 0) {
		return -1 * factor;
	}
	else {
		return 0;
	}
};

Math.dropPerpendicular2D = function(queryPt, line) {

	var x1 = queryPt[0];
	var y1 = queryPt[1];
	
	var x2 = line[0];
	var y2 = line[1];
	
	var vx2 = line[2] - x2;
	var vy2 = line[3] - y2;
	
	var lambda = (x1 * vx2 + y1 * vy2 - vx2 * x2 - vy2 * y2) /
	(vx2 * vx2 + vy2 * vy2);
	
	return lambda;
};

Math.pointDist = function(vec1, vec2) {
	var result = [];
	for (var i = 0; i < vec1.length; ++i) {
		result.push(vec1[i] - vec2[i]);
	}
	
	return result.vecLength();
};
