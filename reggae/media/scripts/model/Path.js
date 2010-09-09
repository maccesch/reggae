/**
 * @author maccesch
 * TODO : this is undocumented and unmature
 */

function Path() {
	this.points = [];
	this.vecs = [];
}

Path.ANGLE_STEP = Math.PI / 5;

Path.prototype.pushPoint = function(pt, vec) {
	this.points.push(pt[0]);
	this.points.push(pt[1]);
	this.vecs.push(vec[0]);
	this.vecs.push(vec[1]);
}

Path.prototype.popPoint = function() {
	this.points.pop();
	this.points.pop();
	this.vecs.pop();
	this.vecs.pop();
}

Path.prototype.popFirstPoint = function() {
	this.points.shift();
	this.points.shift();
	this.vecs.shift();
	this.vecs.shift();
}

Path.prototype.lastPoint = function() {
	return this.points.slice(this.points.length - 2, this.points.length);
}

Path.prototype.getPoint = function(index) {
	var i = index * 2;
	return this.points.slice(i, i + 2);
}

Path.prototype.roundCorners = function(radius) {

	var newPoints = [ this.points[0], this.points[1] ];
	for ( var i = 1; i < this.points.length / 2 - 1; ++i) {

		var prevPt = newPoints.slice(newPoints.length - 2, newPoints.length);
		var curPt = this.points.slice(i * 2, i * 2 + 2);
		var nextPt = this.points.slice(i * 2 + 2, i * 2 + 4);

		var curVec = this.vecs.slice(i * 2, i * 2 + 2);

		var prevDiff = prevPt.minus(curPt);
		var prevAlpha = Math.atan2(prevDiff[1], prevDiff[0]);
		var prevDist = prevDiff.vecLength();
		var prevBeta = Math.acos(radius / prevDist);
		var prevAngle1 = prevAlpha + prevBeta;
		var prevAngle2 = prevAlpha - prevBeta;
		var prevAngle;
		var tempPt1 = [ Math.cos(prevAngle1) * radius,
				Math.sin(prevAngle1) * radius ];
		var tempPt2 = [ Math.cos(prevAngle2) * radius,
				Math.sin(prevAngle2) * radius ];
		var tempVec1 = curPt.plus(tempPt1).minus(prevPt);
		var tempVec2 = curPt.plus(tempPt2).minus(prevPt);
		if (tempVec1.dot(curVec) > tempVec2.dot(curVec)
				&& tempPt1.dot(curVec) >= 0)
			prevAngle = prevAngle1;
		else
			prevAngle = prevAngle2;
		while (prevAngle > 2 * Math.PI)
			prevAngle -= 2 * Math.PI;
		while (prevAngle < 0)
			prevAngle += 2 * Math.PI;

		var nextDiff = nextPt.minus(curPt);
		var nextAlpha = Math.atan2(nextDiff[1], nextDiff[0]);
		var nextDist = nextDiff.vecLength();
		var nextBeta = Math.acos(radius / nextDist);
		var nextAngle1 = nextAlpha + nextBeta;
		var nextAngle2 = nextAlpha - nextBeta;
		var nextAngle;
		tempPt1 = [ Math.cos(nextAngle1) * radius,
				Math.sin(nextAngle1) * radius ];
		tempPt2 = [ Math.cos(nextAngle2) * radius,
				Math.sin(nextAngle2) * radius ];
		tempVec1 = curPt.plus(tempPt1).minus(nextPt);
		tempVec2 = curPt.plus(tempPt2).minus(nextPt);
		if (tempVec1.dot(curVec) > tempVec2.dot(curVec)
				&& tempPt1.dot(curVec) >= 0)
			nextAngle = nextAngle1;
		else
			nextAngle = nextAngle2;
		while (nextAngle > 2 * Math.PI)
			nextAngle -= 2 * Math.PI;
		while (nextAngle < 0)
			nextAngle += 2 * Math.PI;

		var angleDiff;
		do {
			angleDiff = nextAngle - prevAngle;
			if (angleDiff > Math.PI) {
				angleDiff -= 2 * Math.PI;
			} else if (angleDiff < -Math.PI) {
				angleDiff += 2 * Math.PI;
			}
		} while (Math.abs(angleDiff) > Math.PI);

		// clockwise?
		// var angleDir = Math.getDirection2D(curPt.plus( [
		// Math.cos(prevAngle) * radius, Math.sin(prevAngle) * radius ]),
		// prevPt, curPt);
		// consoleMessage(angleDir);

		var stepNo = Math.floor(Math.abs(angleDiff / Path.ANGLE_STEP));
		if (stepNo == 0) {
			newPoints.push(curPt[0] + Math.cos(prevAngle)
					* radius * 1.5);
			newPoints.push(curPt[1] + Math.sin(prevAngle)
					* radius * 1.5);
			continue;
		}
		var angleStep = angleDiff / stepNo;

		var curAngle = prevAngle;
		for ( var j = 0; j <= stepNo; ++j, curAngle += angleStep) {

			var curX = Math.cos(curAngle) * radius * 1.5;
			var curY = Math.sin(curAngle) * radius * 1.5;
			newPoints.push(curPt[0] + curX);
			newPoints.push(curPt[1] + curY);
		}
	}

	newPoints.push(this.points[this.points.length - 2]);
	newPoints.push(this.points[this.points.length - 1]);

	this.points = newPoints;
	this.vecs = null;
}

Path.prototype.pathLength = function() {

	var sum = 0;
	for ( var i = 0; i < this.points.length / 2 - 1; ++i) {
		sum += this.points.slice(i * 2, i * 2 + 2).minus(
				this.points.slice(i * 2 + 2, i * 2 + 4)).vecLength();
	}
	return sum;
}

Path.prototype.append = function(path) {
	for ( var i = 0; i < path.points.length; ++i) {
		this.points.push(path.points[i]);
		this.vecs.push(path.vecs[i]);
	}
}

Path.prototype.length = function() {
	return this.points.length / 2;
};