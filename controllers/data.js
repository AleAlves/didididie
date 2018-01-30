
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
        track.find({}).sort({ track_rates_avarage_rate: -1 }).select({
            track_id: 1,
            track_name: 1,
            track_artist: 1,
            track_image: 1,
            track_add_by: 1,
            track_rates_avarage_rate: 1,
        }).exec(function (error, trackList) {
            user.find({}).select({ user_id: 1, user_display_name: 1 }).exec(function (error, usersList) {
                if (error) {
                    res.send({ 'list': trackList });
                }
                else {
                    res.send({ 'users': usersList, 'list': trackList });
                }
            });
        });
    }

    return dataController;
}