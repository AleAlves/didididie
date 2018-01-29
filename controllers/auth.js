module.exports = function (app) {

    var user_logged = app.models.user;

    var generateRandomString = function (length) {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    };

    var stateKey = 'spotify_auth_state';

    var authController = {

        login: function (req, res) {
            var state = generateRandomString(16);
            res.cookie(stateKey, state);
            // your application requests authorization
            var scope = 'user-read-private user-read-email playlist-read-collaborative';
            res.redirect('https://accounts.spotify.com/authorize?' +
                querystring.stringify({ response_type: 'code', client_id: client_id, scope: scope, redirect_uri: redirect_uri, state: state }));
        },

        logout: function (req, res) {
            req.session.destroy();
            res.redirect('/home/index');
        },

        callback: function (req, res) {
          
            var code = req.query.code || null;
            var state = req.query.state || null;
            var storedState = req.cookies ? req.cookies[stateKey] : null;

            if (state === null) {
                res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
            } else {
                res.clearCookie(stateKey);
                var authOptions = {
                    url: 'https://accounts.spotify.com/api/token',
                    form: {
                        code: code,
                        redirect_uri: redirect_uri,
                        grant_type: 'authorization_code'
                    },
                    headers: {
                        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
                    },
                    json: true
                };

                request.post(authOptions, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        var access_token = body.access_token,
                            refresh_token = body.refresh_token;

                        var options = {
                            url: 'https://api.spotify.com/v1/me',
                            headers: { 'Authorization': 'Bearer ' + access_token },
                            json: true
                        };

                        // use the access token to access the Spotify Web API
                        request.get(options, function (error, response, body) {
                            console.log("Body:");
                            console.log(body);
                            var user_object = new Object();
                            user_object.user_id = body.id;
                            user_object.user_display_name = body.display_name;
                            user_object.user_email = body.email;
                            user_logged.findOne({ user_id: body.id },
                                function (error, user_response) {
                                    try {
                                        if (error) {
                                            console.log("Error - track - step 1 " + error);
                                        }
                                        else if (user_response == null) {
                                            user_logged.create(user_object, function (error, user_esponse) {
                                                if (error) {
                                                    console.log("Error - track - step 2 " + error);
                                                }
                                                else {
                                                    console.log("Usuario criado");
                                                }
                                            });
                                        }
                                        else {
                                            console.log("Usuario existe");
                                        }
                                        req.session.user = user_object;
                                        console.log(req.session.user);
                                        global.user_logged_id = body.id;
                                        console.log(user_logged_id);
                                        // we can also pass the token to the browser to make requests from there
                                        res.redirect('/#' +
                                            querystring.stringify({
                                                access_token: access_token,
                                                refresh_token: refresh_token
                                            }));
                                    } catch (e) {
                                        console.log("db error");
                                    }
                                });
                        });
                    } else {
                        res.redirect('/#' +
                            querystring.stringify({
                                error: 'invalid_token'
                            }));
                    }
                });
            }
        },

        refresh_token: function (req, res) {
            // requesting access token from refresh token
            var refresh_token = req.query.refresh_token;
            var authOptions = {
                url: 'https://accounts.spotify.com/api/token',
                headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
                form: {
                    grant_type: 'refresh_token',
                    refresh_token: refresh_token
                },
                json: true
            };

            request.post(authOptions, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    var access_token = body.access_token;
                    res.send({
                        'access_token': access_token
                    });
                }
            });
        }
    };
    return authController;
}