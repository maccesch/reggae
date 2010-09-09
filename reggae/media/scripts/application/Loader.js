/**
 * @author maccesch
 */
 
// show a loading indicator
// TODO

import('application.GameLogic');
import('core.MainLoop');

function package_application_Loader() {
	// hide the loading indicator bacause this code is executed last
	// TODO
	
	MainLoop.instance.start();
}