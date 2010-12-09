/**
 * @author maccesch
 */

import('core.Settings');

var _hideLoadingIndicator;

(function() {
    var loader;
    
    function _showLoadingIndicator() {
        var el = document.getElementById(settings.REGGAE_CANVAS_ID);
        var top = el.offsetTop + 'px';
        var left = el.offsetLeft + 'px';
        var width = el.offsetWidth + 'px';
        var height = el.offsetHeight + 'px';
        console.debug(height);
        loader = document.createElement('div');
        loader.setAttribute('style', 'position: absolute; text-align: center; line-height: ' + 
                  height + '; top: ' + top + '; left: ' + left + '; width: ' + width +
                  '; height: ' + height + '; background: #ffffff; opacity: 0.8; z-index: 200;');
        loader.innerHTML = "Loading...";
        el.parentNode.appendChild(loader);
    }
    
    _hideLoadingIndicator = function() {
        loader.parentNode.removeChild(loader);
    }
    
    _showLoadingIndicator();
})();

import('application.GameLogic');
import('core.MainLoop');

function package_application_Loader() {
    _hideLoadingIndicator();
    	
	MainLoop.instance.start();
}