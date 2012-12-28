var
GLOBAL = this,
REQUIRE = GLOBAL.require = {
	config: require("./server.config.js"),
	mime:   require("./server.mimetypes.js"),
	http:   require("http"),
	path:   require("path"),
	fs:     require("fs"),
	crypto: require("crypto"),
	jshtml: require("./jshtml.js")
};

process.on("uncaughtException", function (err) {
	console.log("Caught exception: " + err);
});



// Creates an object representing a server response

function ResponseObject(metadata) {
	this.data   = metadata.data || false;
	this.path   = metadata.path || "";
	this.status = metadata.status || 200;
	this.type   = metadata.type || false;
}

ResponseObject.prototype.getEtag = function () {
	return REQUIRE.crypto.createHash("md5").update(this.data).digest("hex");
};



// Filters server requests by type

function handleRequest(path, callback) {
	var
	directoryListing = REQUIRE.config.directory_listing,
	index,
	indexes     = REQUIRE.config.directory_index,
	isPath      = REQUIRE.fs.existsSync(REQUIRE.config.site_base + path),
	isDirectory = isPath && REQUIRE.fs.lstatSync(REQUIRE.config.site_base + path).isDirectory();

	if (isDirectory && directoryListing) {
		// Permitted directory
		path = path.replace(/\/$/, "") + "/";

		for (index in indexes) {
			if (REQUIRE.fs.existsSync(REQUIRE.config.site_base + path + indexes[index])) {
				return getFileResponse(path + indexes[index], callback);
			}
		}

		return getDirectoryResponse(path, callback);	
	} else if (isDirectory) {
		// Forbidden directory
		callback(new ResponseObject({
			"path": path,
			"status": 403
		}));
	} else if (isPath) {
		// Permitted file
		getFileResponse(path, callback)
	} else {
		// Missing file
		return callback(new ResponseObject({
			"path": path,
			"status": 404
		}));
	}
}



// Creates a ResponseObject from a file path

function getFileResponse(path, callback) {
	var tpl;

	REQUIRE.fs.readFile(REQUIRE.config.site_base + path, function (error, data) {
		if (error) {
			// Internal error
			callback(new ResponseObject({
				"data": error.stack,
				"path": path,
				"status": 500
			}));
		} else {
			// Success
			GLOBAL.path  = path;

			if (REQUIRE.path.extname(path) == ".jshtml") {
				tpl = new REQUIRE.jshtml.JSHTML();

				data = tpl.template(data.toString()).context(GLOBAL).render();
			}

			callback(new ResponseObject({
				"data": new Buffer(data),
				"path": path,
				"type": REQUIRE.mime.getType(path)
			}));
		}
	});
}



// Creates a ResponseObject from a directory path

function getDirectoryResponse(path, callback) {
	var tpl;

	REQUIRE.fs.readdir(REQUIRE.config.site_base + path, function (error, files) {
		if (error) {
			// Internal error
			callback(new ResponseObject({
				"data": error.stack,
				"path": path,
				"status": 500
			}));
		} else {
			// Success
			GLOBAL.path  = path;
			GLOBAL.files = files;

			REQUIRE.fs.readFile(REQUIRE.config.directory_template, function (error, data) {
				if (error) {
					// Internal error
					callback(new ResponseObject({
						"data": error.stack,
						"path": path,
						"status": 500
					}));
				} else {
					// Success
					if (REQUIRE.path.extname(REQUIRE.config.directory_template) == ".jshtml") {
						tpl = new REQUIRE.jshtml.JSHTML();

						data = tpl.template(data.toString()).context(GLOBAL).render();
					}

					callback(new ResponseObject({
						"data": new Buffer(data),
						"path": path,
						"type": REQUIRE.mime.getType(REQUIRE.config.site_base + path)
					}));
				}
			});
		}
	});
}



// Server

REQUIRE.http.createServer(function (request, response) {
	var etag, headers;

	GLOBAL.request = request;
	GLOBAL.response = response;

	// Get response object
	handleRequest(request.url, function (response_object) {
		if (response_object.data && response_object.data.length > 0) {
			etag = response_object.getEtag();

			if (request.headers.hasOwnProperty("if-none-match") && request.headers["if-none-match"] === etag) {
				// Not Modified
				response.writeHead(304);
				response.end();
			} else {
				headers = {
					"Content-Type": response_object.type,
					"Content-Length" : response_object.data.length,
					"Cache-Control" : "max-age=" + (REQUIRE.config.file_expiry_time * 60).toString(),
					"ETag" : etag
				};

				response.writeHead(response_object.status, headers);
				response.end(response_object.data);
			}
		} else {
			response.writeHead(response_object.status);
			response.end();
		}
	});
}).listen(REQUIRE.config.port, REQUIRE.config.host);

console.log("Server started: http://" + REQUIRE.config.host + ":" + REQUIRE.config.port);