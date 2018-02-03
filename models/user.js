module.exports = function (app) {

    var schema = require('mongoose').Schema;

    var user = schema({
        user_id: { type: String, unique: true, riquered: true },
        user_display_name: { type: String, required: false },
        user_email: { type: String, riquered: true },
        user_image_url: {type: String, riquered: false}
    });

    return db.model('user', user);
}