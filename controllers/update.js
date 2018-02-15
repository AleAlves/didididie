module.exports = function (app) {

    var playlists = app.models.playlists;
    var track = app.models.track;

    var updateController = {

        index: function (req, res) {
            console.log("Index");
        },

        updateUser: function (req, res) {
            track.find({ 'track_rates.rate_user_id': 'luziamd' }).select({}).exec(function (error, callback) {
                if (error) {
                    console.log("Error" + error);
                }
                else {
                    console.log("Start");
                    for (var i in callback) {
                        for (var j in callback[i].track_rates)
                            if (callback[i].track_rates[j].rate_user_id == 'luziamd') {
                                callback[i].track_rates[j].remove();
                                callback[i].save(function (error, callback) {
                                    if (error) {
                                        console.log("Erro");
                                    }
                                    else {
                                        console.log("Done");
                                    }
                                });
                            }
                    }
                }
            });
        },

        getPlaylist: function (req, res) {

            if (req.session.user != null) {

                console.log();
                var state = generateRandomString(16);
                // your application requests authorization
                var list = null;
                var access_token = req.session.access_token;
                var options = {
                    url: 'https://api.spotify.com/v1/users/' + req.session.user.user_id + '/playlists/',
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
                        }
                        console.log("Playlist " + i);
                        console.log(body);
                    }

                    req.session.playlist_owner = playlists.list_owner_id;
                    req.session.playlist_id = playlists.list_id;

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
                                        list = readTextFile(data, req.session.user.user_id);
                                        synchronizeDataBase(req, res, list);
                                    }
                                });
                            }
                            else {
                                list = readTextFile(data, req.session.user.user_id);
                                synchronizeDataBase(req, res, list);
                            }
                        }
                    });
                });
            }
            else {
                res.redirect('/');
            }
        }
    };

    function synchronizeDataBase(req, res, list) {
        var tracks_for_delete = new Array();
        track.find({}).exec(function (error, trackResponse) {
            if (error) {
                res.send(error);
            }
            else {
                for (var i = 0; i < trackResponse.length; i++) {
                    var found = false;
                    for (var j = 0; j < list.length; j++) {
                        if (list[j].track_id == trackResponse[i].track_id) {
                            found = true;
                            break;
                            console.log("-- tracks");
                            console.log(trackResponse[i]);
                        }
                    }
                    if (!found) {
                        console.log("Not found");
                        console.log(trackResponse[i].track_name + " " + trackResponse[i].track_add_by);
                        tracks_for_delete.push(trackResponse[i].track_id);
                    }
                };
                if (tracks_for_delete.length > 0) {
                    track.remove({ track_id: { $in: tracks_for_delete } }, function (error, response) {
                        if (error) {
                            console.log(error);
                            res.send(error);
                        }
                        else {
                            console.log("Done");
                            track.find({}).exec(function (error, trackResponse) {
                                if (error) {
                                    res.send(error);
                                }
                                else {
                                    updateIndexes(req, res, trackResponse, 0);
                                }
                            });
                        }
                    });
                }
                else {
                    track.find({}).exec(function (error, trackResponse) {
                        if (error) {
                            res.send(error);
                        }
                        else {
                            updateIndexes(req, res, trackResponse, 0);
                        }
                    });
                }
            }
        });
    }

    function updateIndexes(req, res, track, index) {
        if (index < track.length) {
            if (track[index].track_position != index) {
                track[index].track_position = index;
                track[index].save(function (error, response) {
                    if (error) {
                        console.log("Error");
                    }
                    else {
                        console.log("Atualizado " + index);
                        updateIndexes(req, res, track, ++index);
                    }
                });
            }
            else {
                updateIndexes(req, res, track, ++index);
            }
        }
        else {
            res.redirect('/#' + querystring.stringify({ access_token: req.session.access_token, refresh_token: req.session.refresh_token }));
        }
    }

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
                trackObject.track_uri = playlist[i].items[j].track.uri;
                trackObject.track_name = playlist[i].items[j].track.name;
                trackObject.track_add_by = playlist[i].items[j].added_by.id;
                trackObject.track_image = playlist[i].items[j].track.album.images[0].url;
                trackObject.track_artist = playlist[i].items[j].track.album.artists[0].name;
                trackObject.track_rates_avarage_rate = 0;
                trackObject.track_position = j;
                data.push(trackObject);
                count++;
                if (playlist[i].items[j].track.name == "Tempo Perdido") {
                    console.log("Body- tracks");
                    console.log(playlist[i].items[j]);
                }
                // console.log("Body- tracks");
                // console.log(playlist[i].items[j]);
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
                            trackResponse.track_uri = trackObject[index].track_uri;
                            trackResponse.track_position = index;
                            trackResponse.save(function (error, trackResponse) {
                                if (error) {

                                } else {
                                    trackHandler(trackObject, ++index);
                                }
                            });
                        }
                    } catch (e) {
                        console.log("db error");
                    }
                });
    }
    return updateController;
}
