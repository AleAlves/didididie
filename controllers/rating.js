module.exports = function (app) {

    var playlists = app.models.playlists;
    var track = app.models.track;
    var rate = app.models.rate;

    var ratingController = {

        index: function (req, res) {
            if (req.session.user != null) {
                res.render('rate/rating');
            }
            else {
                res.redirect('/');
            }
        },

        rateTrack: function (req, res) {
            if (req.session.user != null) {
                rateTrack(req, res, req.body);
            }
            else {
                res.redirect('/');
            }
        },

        getTracks: function (req, res) {
            if (req.session.user != null) {
                sendPlayList(req, res);
            }
            else {
                res.redirect('/');
            }
        },

        deleteTrack: function (req, res) {
            var access_token = req.session.access_token;
            var options = {
                url: 'https://api.spotify.com/v1/users/' + req.session.user.user_id + '/playlists/' + req.session.playlist_id + '/tracks',
                headers: {
                    'Authorization': 'Bearer ' + access_token
                },
                data: ({
                    tracks: [{
                        uri: '7MnT7msJZg3XBAS0OTfGrB',
                        positions: [
                            447
                        ]
                    }]
                }),
                json: true
            };
            console.log(req.body.track_uri);
            console.log(req.body.track_position);
            request.delete(options, function (error, response, body) {
                console.log("Delete body");
                console.log(body);
            });
            res.send("WOW");
        }

    }

    function rateTrack(req, res, body) {
        console.log("Body");
        console.log(body);
        var query = track.findOne({ "track_id": body.track_id });
        query.select({});
        query.exec(function (error, trackResponse) {
            if (error) {
                console.log("Error - rate - step 1 " + error);
            }
            else {
                if (trackResponse != null) {

                    track.findOne({ 'track_id': body.track_id, 'track_rates.rate_user_id': req.session.user.user_id }).select({}).exec(function (error, trackRateResponse) {
                        if (trackRateResponse == null) {
                            var rate = Object();
                            var rates = trackResponse.track_rates;
                            rate.rate_user_id = req.session.user.user_id;
                            rate.rate_track_id = body.track_id;
                            rate.rate_value = body.rate_value;
                            rates.push(rate);
                            trackResponse.save(function (error, trackResponse) {
                                if (error) {
                                    console.log("Error - save rate - step 2" + error);
                                    res.send("Falhou -1");
                                }
                                else {
                                    console.log("Opiniao computada");
                                    updateAvaragerate(req, res, trackResponse);
                                }
                            });
                        }
                        else {
                            for (var i in trackRateResponse.track_rates) {
                                if (trackRateResponse.track_rates[i].rate_user_id == req.session.user.user_id) {
                                    if (trackRateResponse.track_rates[i].rate_value != body.rate_value) {
                                        trackRateResponse.track_rates[i].rate_value = body.rate_value;
                                        trackRateResponse.save(function (error, trackResponse) {
                                            if (error) {
                                                console.log("Error - resave rate - step 2" + error);
                                                res.send("Falhou 2");
                                            }
                                            else {
                                                console.log("Opiniao atualizada");
                                                updateAvaragerate(req, res, trackResponse);
                                            }
                                        });
                                    }
                                    else {
                                        console.log("Opiniao já computada");
                                        sendPlayList(req, res);
                                    }
                                    break;
                                }
                            }
                        }
                    });
                }
                else {
                    console.log("ops");
                    res.send("ops");
                }
            }
        });
    }

    function updateAvaragerate(req, res, track) {
        console.log("Track");
        console.log(track);
        var rates = 0;
        var ratesCount = 0;
        for (var i = 0; i < track.track_rates.length; i++) {
            rates += track.track_rates[i].rate_value;
            ratesCount++;
            console.log("rate: " + rates);
        }
        rates = rates / ratesCount;
        console.log("Result: " + rates);
        track.track_rates_avarage_rate = rates;
        track.save(function (error, trackResponse) {
            if (error) {
                console.log("Error - resave rate - step 2" + error);
                res.send("Falhou 2");
            }
            else {
                console.log("Opiniao media atualizada");
                sendPlayList(req, res);
            }
        });
    }

    function sendPlayList(req, res) {
        track.find({}).select({}).exec(function (error, callback) {
            if (error) {
                console.log("Error" + error);
            }
            else {
                console.log("Esteve aqui");
                res.send({ 'user_id': req.session.user.user_id, 'list': callback });
            }
        });
    }

    return ratingController;
}
