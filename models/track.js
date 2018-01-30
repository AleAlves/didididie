module.exports = function (app) {

    var schema = require('mongoose').Schema;

    var rate = schema({
        rate_user_id: { type: String, required: true },
        rate_track_id: { type: String, required: true },
        rate_value: { type: Number, required: true },
    }, { usePushEach: true });

    var track = schema({
        track_id: { type: String, unique: true, riquered: true },
        track_name: { type: String, required: false },
        track_artist: { type: String, riquered: true },
        track_image: { type: String, required: true },
        track_add_by: { type: String, required: false },
        track_rates_avarage_rate: { type: Number, required: true },
        track_rates: [rate]
    }, { usePushEach: true });

    return db.model('track', track);
}

