module.exports = function(User) {
  User.getCurrent = async options => {
    return User.findById(options.accessToken.userId);
  };

  User.remoteMethod("getCurrent", {
    description: "Returns current user by access token",
    accepts: {
      arg: "options",
      type: "object",
      http: "optionsFromRequest"
    },
    returns: {
      arg: "user",
      type: "user",
      description: "Current user of the access token",
      root: true
    },
    http: {
      verb: "get",
      path: "/current"
    }
  });
};
