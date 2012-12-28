function Main() {
	this.types = {
		"application": {
			"javascript": "js",
			"json": "json",
			"octet-stream": "DS_Store safariextz",
			"pdf": "pdf",
			"vnd.ms-fontobject": "eot",
			"x-chrome-extension": "crx",
			"x-opera-extension": "oex",
			"x-web-app-manifest+json": "webapp",
			"xpi": "x-xpinstall",
			"xml": "atom rdf rss xml"
		},
		"audio": {
			"mp4": "m4a",
			"ogg": "oga ogg"
		},
		"font":
		{
			"opentype": "otf",
			"ttf": "ttc ttf",
			"woff": "woff xpi"
		},
		"image": {
			"gif": "gif",
			"jpg": "jpg",
			"png": "png",
			"svg+xml": "svg svgz",
			"webp": "webp",
			"x-icon": "ico"
		},
		"text": {
			"cache-manifest": "appcache manifest",
			"html": "html jshtml",
			"plain": "md txt",
			"x-component": "htc",
			"x-vcard": "vcf"
		},
		"video": {
			"mp4": "m4v mp4",
			"ogg": "ogv",
			"webm": "webm"
		}
	};

	this.defaultType = "text/html";

	this.getType = function (path) {
		var ext = path.replace(/^[\W\w]*\./, ""), type, subtype;

		for (type in this.types) {
			for (subtype in this.types[type]) {
				if ((" " + this.types[type][subtype] + " ").indexOf(ext) > -1) {
					return type + "/" + subtype;
				}
			}
		}

		return this.defaultType;
	};
}

module.exports = new Main();