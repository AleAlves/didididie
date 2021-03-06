
module.exports = function (app) {

    var track = app.models.track;
    var user = app.models.user;


    var dataController = {

        index: function (req, res) {
            if (req.session.user != null) {
                res.render('analysis/analysis');
            }
            else {
                res.redirect('/');
            }
        },

        playListAnalysis: function (req, res) {
            if (req.session.user != null) {
                getTopRated(req, res);
            }
            else {
                res.redirect('/');
            }
        }
    };

    function getTopRated(req, res) {
        var usersData = new Array();
        track.find({}).sort({
            track_rates_avarage_rate: -1
        }).select({}).exec(function (error, trackList) {
            user.find({}).select({ user_id: 1, user_display_name: 1, user_image_url: 1 }).exec(function (error, usersList) {
                if (error) {
                    res.send({ 'list': trackList });
                }
                else {
                    user.find({}).select({}).exec(function (error, users) {
                        if (error) {
                            res.send('EROR');
                        }
                        else {
                            var totalSum = 0;
                            var totalCunt = 0;
                            for (var i in users) {
                                var sum = 0;
                                var count = 0;
                                var votesByUser = 0;
                                for (var j in trackList) {
                                    updateAvaragerate(req, res, trackList[j])
                                    if (trackList[j].track_add_by == users[i].user_id) {
                                        sum += trackList[j].track_rates_avarage_rate;
                                        count++;
                                    }
                                    for (var k = 0; k < trackList[j].track_rates.length; k++) {
                                        if (trackList[j].track_rates[k].rate_user_id == users[i].user_id)
                                            votesByUser++;
                                    }
                                }
                                console.log(" User: " + users[i].user_display_name);
                                console.log(" Count: " + count);
                                console.log(" Sum: " + sum.toFixed(2));
                                console.log(" Avarage:" + (sum / count).toFixed(2));
                                console.log(" Votes by user:" + votesByUser);
                                var data = new Object();
                                data.user_name = users[i].user_display_name;
                                data.user_tracks_count = count;
                                data.user_avarage_rate = (sum / count).toFixed(2);
                                data.user_image_url = users[i].user_image_url;
                                data.user_total_votes = votesByUser;
                                usersData.push(data);
                            }
                            for (var i in trackList) {
                                totalSum += trackList[i].track_rates_avarage_rate;
                                totalCunt++;
                            }
                            var playListData = new Object();
                            playListData.total_avarage_rate = (totalSum / totalCunt).toFixed(2);
                            playListData.totalCunt = totalCunt;
                            console.log("Total: " + totalCunt + " Total med" + (totalSum / totalCunt).toFixed(2));

                            res.send({
                                'users': usersList, 'list': trackList, 'playlist_data': playListData, 'user_data': usersData.sort(function (a, b) {
                                    return b.user_avarage_rate - a.user_avarage_rate
                                })
                            });
                        }
                    });
                }
            });
        });
    }

    function updateAvaragerate(req, res, track) {
        // console.log("Track");
        // console.log(track);
        var rates = 0;
        var ratesCount = 0;
        for (var i = 0; i < track.track_rates.length; i++) {
            rates += track.track_rates[i].rate_value;
            ratesCount++;
            // console.log("rate: " + rates);
        }
        rates = rates / ratesCount;
        // console.log("Result: " + rates);
        track.track_rates_avarage_rate = rates;
        track.save();
    }

    return dataController;
}