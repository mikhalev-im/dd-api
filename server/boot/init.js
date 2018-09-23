const errors = require("../errors");

// custom init logic
module.exports = function(server) {
  // attach default errors
  server.errors = errors;
};
