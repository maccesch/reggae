/**
 * Creates a new instance of Loader. Don't use this, use Loader.instance instead.
 * @classDescription A ressource loading scheduler.
 * @constructor
 */
function Loader() {
	this._jobQueue = [];
	this._jobsRunning = 0;
}

/**
 * Maximum of loading jobs running concurrently.
 */
Loader.MAX_JOBS = 1;

/**
 * Queue for the loading jobs. Every job is represented by three items:
 * A string for job type, a string for the url to load from and the callback
 */
Loader.prototype._jobQueue = null;

/**
 * The number of loading jobs currently running.
 */
Loader.prototype._jobsRunning = 0;

/**
 * Schedules the loading of an xml file.
 * @param {String} url The url to load from.
 * @param {Function} completeCallback A callback function which is called when the loading has completed.
 * The callback takes one parameter responseXml of type Document which is the DOM of the loaded xml file.
 */
Loader.prototype.loadXml = function(url, completeCallback) {
	this._enqueue("xml", url, completeCallback);
}

/**
 * Enqueues a job.
 * @param {String} jobType The type of the job, eg "xml"
 * @param {String} url The url to load form.
 * @param {Function} completeCallback The callback to call when the ressource has loaded.
 */
Loader.prototype._enqueue = function(jobType, url, completeCallback) {
	this._jobQueue.push(jobType);
	this._jobQueue.push(url);
	this._jobQueue.push(completeCallback);
	
	this._startLoading();
}

/**
 * Starts the actual execution of a job form the queue.
 */
Loader.prototype._startLoading = function() {
	if (this._jobQueue.length == 0 || this._jobsRunning >= Loader.MAX_JOBS) {
		return;
	}
	this._jobsRunning += 1;
	
	var jobType = this._jobQueue.shift();
	var url = this._jobQueue.shift();
	var callback = this._jobQueue.shift();
	
	switch (jobType) {
		case "xml":
			Network.instance.getXmlFile(url, this._getCallback(callback));
			break;
	}
}

/**
 * Constructs a callback for loading complete.
 * @param {Function} completeCallback The callback from the client.
 * @return {Function} The callback that is decorated by some loader management stuff.
 */
Loader.prototype._getCallback = function(completeCallback) {
	var self = this;
	var f = function(arg) {
		completeCallback(arg);
		self._jobsRunning -= 1;
		self._startLoading();
	}
	return f;
}

Loader.instance = new Loader();
