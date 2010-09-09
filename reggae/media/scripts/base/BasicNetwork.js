
/**
 * Creates a new BasicNetwork instance. Don't use this directly. Use BasicNetwork.instance instead.
 * @classDescription Provides basic AJAX network functionality
 * @constructor
 * @type {Object}
 * @return {BasicNetwork} The new instance.
 */
function BasicNetwork() {
	
}

// cross browser method to create an XMLHttpRequest object
BasicNetwork.prototype.createRequest = function() {
	var xmlhttp = null;
	
	// Standard
	if (window.XMLHttpRequest) {
		xmlhttp = new XMLHttpRequest();
	}
	// IE 6
	else if (window.ActiveXObject) {
		xmlhttp = new ActiveXObject("MSXML2.XMLHTTP.3.0");
	}
	return xmlhttp;
};

BasicNetwork.instance = new BasicNetwork();

/**
 * Loads some html from the server and inserts it into the given element.
 * @param {String} url The url of the ressource to retrieve the new html from.
 * @param {HTMLElement} htmlElement The html element, that will contain the retrieved html from the server.
 * @param {Boolean} [append] If set to true, the html in htmlElement won't be replaced and the
 * retrieved html from the server will be appended. Defaults to false, where the html of htmlElement
 * is replaced.
 * @method
 */
BasicNetwork.prototype.insertHtml = function(url, htmlElement, append) {
	this.getTextFile(url, function(text) {
		if (!append) {
			htmlElement.innerHTML = text;
		} else {
			htmlElement.innerHTML += text;
		}
	});
};

/**
 * Requests a text file from the server.
 * @param {String} file The url of the file.
 * @param {Function} [onFileReceived] Callback function which is called when the file was
 * successfully downloaded from the server. It is passed the response text as argument.
 * If this parameter is not passed the reqeust will be made synchronously and the retrieved
 * text will be returned.
 * @param {Function} [onFail] Callback function if something went wrong.
 * @member
 * @return {String} If onFileReceived is omitted the retrieved text is returned.
 * Undefined otherwise.
 */
BasicNetwork.prototype.getTextFile = function(file, onFileReceived, onFail) {
	return this.getGenericFile(file, onFileReceived, onFail, false);
};

/**
 * Requests a XML file from the server.
 * @param {String} file The url of the file.
 * @param {Function} [onFileReceived] Callback function which is called when the file was
 * successfully downloaded from the server. It is passed the response xml tree as argument.
 * If this parameter is not passed the reqeust will be made synchronously and the retrieved
 * xml tree will be returned.
 * @param {Function} [onFail] Callback function if something went wrong.
 * @member
 * @return {String} If onFileReceived is omitted the retrieved xml tree is returned.
 * Undefined otherwise.
 */
BasicNetwork.prototype.getXmlFile = function(file, onFileReceived, onFail) {
	return this.getGenericFile(file, onFileReceived, onFail, true);
};

// does the actual work for getTextFile and getXmlFile
BasicNetwork.prototype.getGenericFile = function(file, onFileReceived, onFail, xml) {
	var request = this.createRequest();
	
	var async = false;
	if (onFileReceived) {
		async = true;
	}

	request.open("GET", file, async);
	request.onreadystatechange = function() {
		if (request.readyState == 4) {
			if (request.status == 200) {
				if (async) {
					if (xml) {
						onFileReceived(request.responseXML);
					}
					else {
						onFileReceived(request.responseText);
					}
				}
			}
			else {
				if (onFail) {
					onFail();
				}
			}
		}
	};
	request.send(null);
	
	if (!async) {
		if (xml) {
			return request.responseXML;
		}
		else {
			return request.responseText;
		}
	}
};

/**
 * 
 * @param {Object} url
 * @param {Object} data
 * @param {Object} onSuccess
 * @param {Object} onFail
 */
BasicNetwork.prototype.post = function(url, data, onSuccess, onFail) {
	var request = this.createRequest();
	request.open("POST", url);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	
	request.onreadystatechange = function() {
		if (request.readyState == 4) {
			// TODO : implement
		}		
	};
	var dataArr = [];
	if (data instanceof HTMLFormElement) {
		for (var i = 0; i < data.elements.length; ++i) {
			var el = data.elements[i];
			dataArr.push(escape(el.name) + "=" + escape(el.value));
		}
	} else if (data instanceof Object) {
		for (attr in data) {
			dataArr.push(escape(attr) + "=" + escape(data[attr]));
		}
	}
	data = dataArr.join("&");
	request.send(data);
};
