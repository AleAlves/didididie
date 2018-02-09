module.exports = function (app) {

  var ratingController = app.controllers.rating;
  var updateController = app.controllers.update;
  var authController = app.controllers.auth;
  var serviceController = app.controllers.service;
  var dataController = app.controllers.data;
  app.get('/', serviceController.index);
  app.get('/login', authController.login);
  app.get('/logout', authController.logout);
  app.get('/callback', authController.callback);
  app.get('/refresh_token', authController.refresh_token);
  app.get('/update', updateController.getPlaylist);
  app.get('/xablau', updateController.updateUser);
  app.put('/delete', ratingController.deleteTrack);
  app.post('/rate', ratingController.rateTrack);
  app.get('/rating', ratingController.getTracks);
  app.get('/rating_playlist', ratingController.index);
  app.get('/analysis', dataController.index);
  app.get('/analysis_playlist', dataController.playListAnalysis);

}