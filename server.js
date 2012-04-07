#!/usr/bin/env node
var ripper = require('./src/ripperfm'),
port = process.argv.length > 2 ? parseInt(process.argv[2], 10) : 8080;

function closer(response) {
    return function(output) {
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(output));
    }
}

function handler(request, response, body) {
    return function() {
        var json = JSON.parse(body.toString());
        ripper.downloadStream(json, closer(response));
    }
}

function respond(request, response) {
    var body = new Buffer(),
    complete = handler(request, response, body);    
    request.on('end', complete);
    request.pipe(body);
}

http.createServer(respond).listen(port);
console.log("Server running on port", port);