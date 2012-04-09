var http = require('http'),
path = require('path'),
url = require('url'),
fs = require('fs'),
mkdirp = require('mkdirp'),
exec = require('child_process').exec,

downloads = path.join(path.dirname(__dirname), 'downloads');

ripper = {
    
    getHttpParams: function(options) {
        var segId = options.metadata.sync.current_seg;
        return {
            host: url.parse(options.metadata.netloc).host,
            path: '/' + options.roomid + 'Seg' + segId.toString()
        };
    },
    
    clean: function(txt) {
        return txt.replace(/\//g, '\\/');
    },
    
    getMp3Path: function(options, pre) {
        var song = options.metadata.current_song.metadata,
        mp3Path = path.join(downloads, ripper.clean(song.artist));
        mp3Path = path.join(mp3Path, ripper.clean(song.album) || 'Untitled Album');
        mp3Path = path.join(mp3Path, (pre||'') + ripper.clean(song.song) + '.mp3');
        return mp3Path;
    },
    
    getWriteStream: function(options, callback) {
        var mp3Path = ripper.getMp3Path(options, '~'), mode = 0777;
        mkdirp(path.dirname(mp3Path), mode, function(){
            callback(fs.createWriteStream(mp3Path, { 
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
    
    tagMp3: function(file, options, callback) {
        var song = options.metadata.current_song.metadata,
        command = ['id3tool -r "', song.artist, '" -t "', song.song, '" '];
        if (song.album) { 
            command = command.concat(['-a "', song.album, '" ']); 
        }
        command = command.concat(['"', file ,'"']);
        command = command.join('');
        console.log('TAG:', command);
        exec(command, callback);
    },
    
    finalizeStream: function(options, callback) {
        var temp = ripper.getMp3Path(options, '~'),
        dest = ripper.getMp3Path(options);
        ripper.tagMp3(temp, options, function(error){
            if (error) {
                callback({ error: 'Unable to tag mp3!' });
            } else {
                console.log('MV:', dest);
                fs.rename(temp, dest, function(error){
                    if (error) {
                        callback({ error: 'Unable to download stream!' });
                    } else {
                        callback({ file: dest });
                    }
                });
            }
        });
    },
    
    segmentSaver: function(options, callback) {
        var sync = options.metadata.sync;
        return function(response) {
            console.log('SEGMENT:', sync.current_seg, response.statusCode);
            if (response.statusCode === 200) {
                ripper.appendSegment(options, response, callback);
            } else {
                ripper.finalizeStream(options, callback);
            }
        };
    },
    
    downloadSegment: function(options, callback) {
        var params = this.getHttpParams(options);
        http.get(params, this.segmentSaver(options, callback));
    },
    
    rewindStream: function(options) {
        var sync = options.metadata.sync, stream = options.stream_info;
        sync.current_seg = stream.first_seg_id;
    },
    
    downloadStream: function(options, callback) {
        ripper.downloadSegment(options, function(complete){
            if (complete) {
                callback(complete);
            } else {
                options.metadata.sync.current_seg++;
                ripper.downloadStream(options, callback);
            }
        });
    }
    
};

module.exports = ripper;