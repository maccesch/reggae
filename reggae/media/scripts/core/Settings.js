/**
 * @author maccesch
 */
 
/**
 * Default settings. These are overwritten by the servers settings. See the example app for how
 * this is done.
 */
 
if (!window.settings) {
	window.settings = {}
}

settings.MEDIA_URL = settings.MEDIA_URL || '/';

settings.IMAGES_ROOT = settings.IMAGES_ROOT || 'images/';

settings.SKINS_ROOT = settings.SKINS_ROOT || 'skins/';

settings.SKIN = settings.SKIN || 'default';

settings.FIELD_SIZE = settings.FIELD_SIZE || 64;

settings.REGGAE_CANVAS_ID = settings.REGGAE_CANVAS_ID || 'reggae_canvas';


/**
 * @method
 * @return {String} The path where images can be found.
 */
settings.getImagesPath = function(){
	return settings.MEDIA_URL + settings.SKINS_ROOT + settings.SKIN + '/' + settings.IMAGES_ROOT;
}
