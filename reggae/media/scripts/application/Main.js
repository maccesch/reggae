
window.onload = function() {

	// workaround for safari (and chrome?) which shows page loading from 
	// xmlhttprequests that are opened in onload event. Network constructor does that.
	// Using rather large value so it will work on iphone, too.
	
	setTimeout(function() {
		import('application.Loader');
	}, 200);

};