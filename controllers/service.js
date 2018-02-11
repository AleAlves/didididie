
module.exports = function (app) {

    var ServiceController = {

        index: function (req, res) {
            res.render('home/index');
        },

        home: function (req, res) {
            if (req.session.user != null) {
                res.redirect('/#' + querystring.stringify({ access_token: req.session.access_token, refresh_token: req.session.refresh_token }));
            }
            else {
                res.render('home/index');
            }
        },

        version: function (req, res) {
            var data = new Object();
            data.version = version;
            res.send(JSON.stringify(data));
        }
    };
    return ServiceController;
}