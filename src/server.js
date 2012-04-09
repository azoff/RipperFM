var http = require('http'),
ripper = require('./ripperfm'),
port = process.argv.length > 2 ? parseInt(process.argv[2], 10) : 8080;

function closer(request, response) {
    return function(output) {     
        response.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'http://turntable.fm',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept',
            'Access-Control-Max-Age': 1000
        });
        response.end(output ? JSON.stringify(output) : '');
    };
}

function handler(request, response, body) {
    var json = body ? JSON.parse(body) : {},
    complete = closer(request, response);    
    if (request.method === 'POST') {
        if (json && json.stream_info) {
            console.log('STREAM: ', json.stream_info.file);
            ripper.rewindStream(json);
            ripper.downloadStream(json, complete);
        } else {
            complete({ error: 'Invalid parameters.' });
        }
    } else {
        complete();
    }
}

function respond(request, response, body) {
    console.log('ACCESS: ', request.method, request.headers);    
    request.setEncoding('utf8');    
    request.on('data', function(chunk){
        body = body ? (body+chunk) : chunk;
    });
    request.on('end', function(){
        handler(request, response, body);
    });
}

http.createServer(respond).listen(port);
console.log("Server running on port", port);