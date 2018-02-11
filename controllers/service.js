
module.exports = function (app) {

    var ServiceController = {

        index: function (req, res) {
            if (req.session.user != null) {
                res.render('home/index');
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