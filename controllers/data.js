
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
            user.find({}).select({ user_id: 1, user_display_name: 1 }).exec(function (error, usersList) {
                if (error) {
                    res.send({ 'list': trackList });
                }
                else {
                    user.find({}).select({}).exec(function (error, users) {
                        if (error) {
                            res.send('EROR');
                        }
                        else {
                            for (var i in users) {
                                var sum = 0;
                                var count = 0;
                                for (var j in trackList) {
                                    if (trackList[j].track_add_by == users[i].user_id) {
                                        sum += trackList[j].track_rates_avarage_rate;
                                        count++;
                                    }
                                }
                                console.log(" User: " + users[i].user_display_name);
                                console.log(" Count: " + count);
                                console.log(" Sum: " + sum.toFixed(2));
                                console.log(" Avarage:" + (sum / count).toFixed(2));
                                var data = new Object();
                                data.user_name = users[i].user_display_name;
                                data.user_tracks_count = count;
                                data.user_avarage_rate = (sum / count).toFixed(2);
                                usersData.push(data);
                            }
                            res.send({ 'users': usersList, 'list': trackList, 'user_data': usersData });
                        }
                    });
                }
            });
        });
    }

    return dataController;
}