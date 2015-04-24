var fs = require('fs'), path = require('path'), http = require('http');

var MIME = {
	'.css' : 'text/css',
	'.js' : 'application/javascript'
};

function combineFiles(pathnames, callback) {
	var output = [];

	(function next(i, len) {
		if (i < len) {
			fs.readFile(pathnames[i], function(err, data) {
				if (err) {
					callback(err);
				} else {
					output.push(data);
					next(i + 1, len);
				}
			});
		} else {
			callback(null, Buffer.concat(output));
		}
	}(0, pathnames.length));
}

function main(argv) {
	var config = JSON.parse(fs.readFileSync(argv[0], 'utf-8')), root = config.root
			|| '.', port = config.port || 80;

	console.log("root:" + root + ":" + port);

	http.createServer(function(request, response) {
		var urlInfo = parseURL(root, request.url);
		console.log('header:' + request.headers);

		combineFiles(urlInfo.pathnames, function(err, data) {
			console.log('err:' + err);
			console.log('urlInfo:' + urlInfo.toString);
			
			if (err) {
				response.writeHead(404);
				response.end(err.message);
			} else {
				response.writeHead(200, {
					'Context-Type' : urlInfo.mime
				});
				response.end(end);
			}
		});

	}).listen(port);
}

function parseURL(root, url) {
	var base, pathnames, parts;
	console.log('root:' + root + ',url:' + url);
	if (url.indexOf('??') === -1) {
		url = url.replace('/', '/??');
	}

	parts = url.split('??');
	base = parts[0];
	console.log('base:' + base + ',parts:' + parts);
	pathnames = parts[1].split(',').map(function(value) {
		return path.join(root, base, value);
	});
	console.log('base2:' + base + ',parts2:' + parts);
	return {
		mime : MIME[path.extname(pathnames[0])] || 'text/plain',
		pathnames : pathnames
	};
}

main(process.argv.slice(2));
