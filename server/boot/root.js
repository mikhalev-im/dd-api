module.exports = function(server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  router.get("/", server.loopback.status());

  // Custom routes
  router.get("/api/page/:alias", require("../controllers/page/get"));

  server.use(router);
};
