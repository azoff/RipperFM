var http = require('http'),
path = require('path'),
url = require('url'),
fs = require('fs'),

root = path.dirname(__dirname),
mp3s = path.join(root, 'mp3s'),

ripper = {
    
    getHttpParams: function(options) {
        var room = url.parse(options.room_url),
        id = options.segment_id.toString();
        return {
            host: room.host,
            path: room.path + 'Seg' + id
        };
    },
    
    getMp3Path: function(options, pre) {
        var artist = options.artist.replace(/\W+/g, ' '),
        title = options.title.replace(/\W+/g, ' '),
        name =  (pre||'') + artist + ' - ' + title + '.mp3';
        return path.join(mp3s, name);
    },
    
    getWriteStream: function(options, callback) {
        var mp3 = ripper.getMp3Path(options, '~'), mode = 0777;
        fs.mkdir(mp3s, mode, function(){
            callback(fs.createWriteStream(mp3, { 
                encoding: 'utf8', 
                flags: 'a', 
                mode: mode
            }));
        });
    },
    
    appendSegment: function(options, response, callback) {
        ripper.getWriteStream(options, function(out){
            response.pipe(out);
        });
        response.on('end', callback);
    },
    
    finalizeStream: function(options, callback) {
        var temp = ripper.getMp3Path(options, '~'),
        dest = ripper.getMp3Path(options);
        fs.rename(temp, dest, function(){
            callback({ complete: dest });
        });
    },
    
    segmentSaver: function(options, callback) {
        return function(response) {
            console.log(response.statusCode, options.path);
            if (response.statusCode === 200) {
                ripper.appendSegment(options, response, callback);
            } else {
                session.finalizeStream(options, callback);
            }
        };
    },
    
    downloadSegment: function(options, callback) {
        var params = this.getHttpParams(options);
        http.get(options, this.segmentSaver(options, callback));
    },
    
    downloadStream: function(options, callback) {
        ripper.downloadSegment(options, function(complete){
            if (complete) {
                callback(complete);
            } else {
                options.segment_id++;
                ripper.downloadStream(options, callback);
            }
        });
    }
    
};

module.exports = ripper;