var import;

(function() {
	SCRIPTS_ROOT = '/';
	if (window.settings && window.settings.SCRIPTS_ROOT) {
		SCRIPTS_ROOT = settings.SCRIPTS_ROOT;
	} else {
		SCRIPTS_ROOT = findScriptsRoot();
	}

	var head = document.getElementsByTagName('head')[0];

	// assume that this file is placed directly inside the scripts root
	function findScriptsRoot() {
		var scripts = document.getElementsByTagName('script');
		for (var i = 0; i < scripts.length; ++i) {
			var script = scripts[i];
			var src = script.getAttribute('src');
			
			var index;
			if (src) {
				index = src.indexOf('package.js');
			} else {
				index = -1;
			}
			if (index >= 0) {
				return src.substring(0, index);
			}
		}
		return "/";
	}
	
	var importList = [];
	var loading = false;
	
	// define the package tree data types
	function PkgNode(name) {
		this._name = name;
		this._dependencies = [];
		this._level = 0;
	}
	
	PkgNode.prototype.addDependency = function(node) {
		this._dependencies.push(node);
		node.setLevel(this._level + 1);
	}
	
	PkgNode.prototype.setLevel = function(level) {
		this._level = Math.max(this._level, level);
	}
	
	PkgNode.prototype.getLevel = function() {
		return this._level;
	}

	PkgNode.prototype.getName = function() {
		return this._name;
	}
	
	var _root = new PkgNode('__root__');
	var packageGraph = {
		_pkgNamesToNodes: {},
		_root: _root,
		_currentPkg: _root,
		_pkgs: [],
		_loadedPkgNames: [],
		
		setCurrentPkg: function(pkgName) {
			this._currentPkg = this.getPkgNode(pkgName);
			this._loadedPkgNames.push(pkgName);
		},
		
		setNoCurrentPkg: function() {
			this._currentPkg = this._root;
		},
		
		getPkgNode: function(pkgName) {
			var node = this._pkgNamesToNodes[pkgName];
			if (!node) {
				node = new PkgNode(pkgName);
				this._pkgNamesToNodes[pkgName] = node;
				this._pkgs.push(node);
			}
			return node;
		},
		
		currentPkgImports: function(pkgName) {
			this._currentPkg.addDependency(this.getPkgNode(pkgName));
		},
		
		toList: function() {
			this._pkgs.sort(function(a, b) {
				return b.getLevel() - a.getLevel();
			});
			var list = [];
			for (var i = 0; i < this._pkgs.length; ++i) {
				var name = this._pkgs[i].getName();
				if (name != '__root__') {
					list.push(name);
				}
			}
			return list;
		},
		
		isLoaded: function(pkgName) {
			return this._loadedPkgNames.indexOf(pkgName) >= 0;
		}
	}
	
	/**
	 * Called when a script has finished loading
	 */
	function checkAllLoaded() {
//		setTimeout(function() {
	
		// when all packages have finished loading execute their package functions
		// otherwise continue by loading the next package
		if (importList.length == 0) {
			loading = false;
			var importedPkgs = packageGraph.toList();
			for (var i = 0; i < importedPkgs.length; ++i) {
				var curPkg = 'package_' + importedPkgs[i].replace('\.', '_');
				if (window[curPkg]) {
					window[curPkg].call(window);
				}
			}
		} else {
			loadNextPkg();
		}
		
//		}, 3000);
	}
	
	function loadNextPkg() {
		// get next package which is not already loaded
		var curPkg;
		
		do {
			if (importList.length == 0) {
				checkAllLoaded();
				return;
			}
			
			curPkg = importList.shift();
		} while (packageGraph.isLoaded(curPkg));
		
		packageGraph.setCurrentPkg(curPkg);
		
		// load javascript file
		var pkgPath = SCRIPTS_ROOT + curPkg.replace('\.', '/') + '.js';
		var pkgName = curPkg.split('.');
		pkgName = pkgName[pkgName.length-1]
	
		var scriptEl = document.createElement('script');
		scriptEl.type = 'text/javascript';
		scriptEl.src = pkgPath;
		scriptEl.onload = checkAllLoaded;

		// Add the script to the document, causing it to load and run asynchronously.
		head.appendChild(scriptEl);
	}
	
	import = function (package) {
	
		importList.push(package);

		packageGraph.currentPkgImports(package);
		
		if (!loading) {
			loading = true;
			loadNextPkg();
		}
	};

})();