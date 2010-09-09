function FrameAnimation(onImageChange, frameNo, cyclic, fps) {

	if (!fps) {
		this.fps = 24;
	} else {
		this.fps = fps;
	}
	if (cyclic === false) {
		this.cyclic = false;
	} else {
		this.cyclic = true;
	}
	this.frameNo = frameNo;
	this.progress = 0;
	this.curFrame = 1;

	this.onImageChange = onImageChange;
}

FrameAnimation.prototype.toStart = function() {
	this.onImageChange(this.curFrame, 1);
	this.curFrame = 1;
	this.progress = 0;
};

FrameAnimation.prototype.update = function(deltaT) {
	this.progress += deltaT;

	var length = this.frameNo * 1000 / this.fps;

	if (this.progress >= length) {
		if (!this.cyclic) {
			this.progress = length;
			return;
		}
		this.progress %= length;
	}

	var newFrame = Math.floor(this.progress * this.frameNo / length) + 1;

	if (newFrame != this.curFrame) {
		this.onImageChange(newFrame, this.curFrame);
		this.curFrame = newFrame;
	}
};

/********************************************************************/
/* png animation													*/
/********************************************************************/

/**
 * Creates a new PngAnimation instance.
 * @classDescription An movie picture made of a number of .png images, that share the same path
 * and name prefix.
 * @constructor
 * @type {Object}
 * @return {PngAnimation} The new instance
 * @param {HTMLElement} element The html element that should contain the animation iamges.
 * @param {String} imagesPath The path and prefix of the .png files. If you have for example
 * an animation with 3 images named "image0001.png", "image0002.png", "image0003.png" that are in
 * the folder "/images/anim" you would have to set imagesPath to "/images/anim/image". Please
 * note that the number part of the file names have to have 4 digits like in the example above.
 * @param {Number} fameNo Length of the animation in frames.
 * @param {Boolean} [cyclic] True if the animation should be played back cyclicly or halted after
 * the last frame is reached. Defaults to true.
 * @param {Number} [fps] Playback speed in frames per second. Defaults to 24.
 */
function PngAnimation(element, imagesPath, frameNo, cyclic, fps) {
	this._imagesPath = imagesPath;
	this._element = element;
	
	var self = this;
	FrameAnimation.call(this, function(frame, oldFrame) {
		self._hideFrame(oldFrame);
		self._showFrame(frame);
	}, frameNo, cyclic, fps);
	
	this._frameElements = [];
	this._initFrameElements();
}

PngAnimation.prototype = new FrameAnimation(null, 1);

/**
 * Creates and initializes the html element for each frame.
 */
PngAnimation.prototype._initFrameElements = function() {
	for (var i = 1; i <= this.frameNo; ++i) {
		var frameEl = document.createElement('img');
		frameEl.src = this._imagesPath + this._format(i) + ".png";
		frameEl.setAttribute('style',
				'position: absolute; visibility: hidden;');
		this._frameElements[i] = frameEl;
		this._element.appendChild(frameEl);
	}
}

/**
 * Returns the given number as string of length 4.
 */
PngAnimation.prototype._format = function(num) {
	var str = num.toString();
	for (var i = str.length; i < 4; ++i) {
		str = '0' + str;
	}
	return str;
};

/**
 * Makes the html element visible, that represents the given frame.
 */
PngAnimation.prototype._showFrame = function(frame) {
	this._frameElements[frame].style.visibility = "visible";
}

/**
 * Makes the html element invisible, that represents the given frame.
 */
PngAnimation.prototype._hideFrame = function(frame) {
	this._frameElements[frame].style.visibility = "hidden";
}