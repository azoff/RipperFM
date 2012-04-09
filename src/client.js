(function(tt, $){

    var session, socket;
    
    function notifyUser(response) {
        if (response.error) {
            tt.showAlert(response.error);
        } else if(response.file) {
            tt.showAlert('Downloaded: ' + response.file);
        }
    }

    function requestDownload(info) {
        var room = info ? info.room : false;
        if (room) {
            var song = room.metadata.current_song.metadata;
            tt.showAlert('Download "' + song.song + '" by ' + song.artist + '?', function(){
                $.ajax({
                    url: 'http://localhost:8080',
                    type: 'POST',
                    dataType: 'json',
                    contentType: "application/json; charset=UTF-8",
                    data: JSON.stringify(room),
                    crossDomain: true,                    
                    success: notifyUser
                });
            });
        } else {
            tt.showAlert('Unable to load room data!');
        }
    }
    
    function getRoomInfo(callback) {
        socket.call(tt, {
            api: 'room.info',
            roomid: session.roomId
        }).then(callback);
    }

    function downloadStream() {
        getRoomInfo(requestDownload);      
    }

    function exposeButton() {
        $('#songboard_add .btn.amazon')
            .off().data('tipsy', null)
            .css({
                backgroundImage: 'url("http://online-bingo.net/wp/wp-content/uploads/images/icons/icon_download.png")'
            }).tipsy({ 
                title: function(){
                    return'<div class="tiny_tooltip">download</div>';
                },
                fade: true,
                gravity: 's',
                offset: -7,
                html: true,
                opacity: 0.9
            }).click(downloadStream)
            .insertBefore('#songboard_add .btn.queue');
    }
    
    function loadPrivateApi() {
        var publicApi = ["pendingCalls","deferreds", "clientId", "clientTimeDelta", 
        "eventListeners", "socket", "socketVerbose", "socketErrors", "messageId", 
        "currentSocketPort", "currentSocketServer", "favorites", "buddyList", 
        "syncServerClock", "main", "socketsByPort", "flushUnsentMessages", "setSocketAddr", 
        "socketConnected", "socketKeepAlive", "socketLog", "socketDumpLog", "isIdle", 
        "isUnavailable", "idleTime", "checkIdle", "currentStatus", "presenceTimer", 
        "trackPresence", "updatePresence", "resetPresenceThrottle", "sendPresence", 
        "buddyPresenceTimer", "initBuddyPresencePolling", "lastBuddyPresencePoll", 
        "fetchBuddyPresence", "pingTimer", "numPings", "socketReconnected", 
        "pingSocket", "closeSocket", "addEventListener", "removeEventListener", 
        "dispatchEvent", "idleTimers", "addIdleListener", "removeIdleListener", "setPage", 
        "reloadPage", "initFavorites", "hashMod", "getHashedAddr", "numRecentPendingCalls", 
        "unsentMessageCallbacks", "whenSocketConnected", "messageReceived", "logMessage", 
        "randomRoom", "showWelcome", "die", "showAlert", "serverNow", "seedPRNG", "user", 
        "playlist", "loadTime", "connectionTimeout", "syncServerClockLast", 
        "socketKeepAliveTimer", "uploader", "socketDumpLogLast"];
        $.each(tt, function(name, prop, fn){
            if (publicApi.indexOf(name) < 0) {
                if ($.isFunction(prop)) {
                    fn = prop({}); 
                    if(fn && fn.then) {
                        socket = prop;
                    }
                } else if (prop.roomId) {
                    session = prop;
                }
            }
        });
    }
    
    function init() {
        loadPrivateApi();
        exposeButton();
    }
    
    $(init);

})(turntable, jQuery);