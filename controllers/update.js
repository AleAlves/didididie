module.exports = function (app) {

    var playlists = app.models.playlists;
    var track = app.models.track;

    var updateController = {

        getPlaylist: function (req, res) {
            var state = generateRandomString(16);
            // your application requests authorization
            var list = null;
            var access_token = req.query.access_token;
            var options = {
                url: 'https://api.spotify.com/v1/users/' + user_logged_id + '/playlists/',
                headers: {
                    'Authorization': 'Bearer ' + access_token
                },
                json: true
            };

            // use the access token to access the Spotify Web API
            request.get(options, function (error, response, body) {
                for (var i = 0; i < Object.keys(body.items).length; i++) {
                    if (body.items[i].name == "Didididiê") {
                        playlists.list_id = body.items[i].id;
                        playlists.list_name = body.items[i].name;
                        playlists.list_owner = body.items[i].owner.display_name;
                        playlists.list_owner_id = body.items[i].owner.id;
                        console.log(playlists.list_id + " - " + playlists.list_owner_id);
                    }
                }

                var options = {
                    url: '	https://api.spotify.com/v1/users/' + playlists.list_owner_id + '/playlists/' + playlists.list_id + '/tracks?market=US',
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    },
                    json: true
                };

                request.get(options, function (error, response, body) {
                    data = new Array();
                    data.push(body);
                    readNext(body);
                    function readNext(body) {
                        if (body.next != null) {
                            var options = {
                                url: body.next,
                                headers: {
                                    'Authorization': 'Bearer ' + access_token
                                },
                                json: true
                            };
                            request.get(options, function (error, response, body) {
                                data.push(body);
                                if (body.next != null) {
                                    readNext(body);
                                }
                                else {
                                    list = readTextFile(data, user_logged_id);
                                    res.send({'status':'Playlist Atualizada'});
                                }
                            });
                        }
                        else {
                            list = readTextFile(data, user_logged_id);
                            res.send({'status':'Playlist Atualizada'});
                        }
                    }
                });
            });

            // we can also pass the token to the browser to make requests from there
        }
    };

    var generateRandomString = function (length) {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    };

    function readTextFile(playlist, user_id) {
        var data = new Array();
        var count = 0;
        for (var i = 0; i < playlist.length; i++) {
            for (var j = 0; j < playlist[i].items.length; j++) {
                var trackObject = new Object();
                trackObject.track_id = playlist[i].items[j].track.id;
                trackObject.track_name = playlist[i].items[j].track.name;
                trackObject.track_add_by = playlist[i].items[j].added_by.id;
                trackObject.track_image = playlist[i].items[j].track.album.images[0].url;
                trackObject.track_artist = playlist[i].items[j].track.album.artists[0].name;
                trackObject.track_like = 0;
                trackObject.track_dislike = 0;
                data.push(trackObject);
                count++;
            }
        }
        trackHandler(data, 0);
        return data;
    }


    function trackHandler(trackObject, index) {
        if (index < trackObject.length)
            track.findOne({ track_id: trackObject[index].track_id },
                function (error, trackResponse) {
                    try {
                        if (error) {
                            console.log("Error - track - step 1 " + error);
                        }
                        else if (trackResponse == null) {
                            //Nao existe esse track
                            track.create(trackObject[index], function (error, trackResponse) {
                                if (error) {
                                    console.log("Error - track - step 2 " + error);
                                    trackHandler(trackObject, ++index);
                                }
                                else {
                                    trackHandler(trackObject, ++index);
                                }
                            });
                        }
                        else {
                            trackHandler(trackObject, ++index);
                        }
                    } catch (e) {
                        console.log("db error");
                    }
                });
    }
    return updateController;
}
