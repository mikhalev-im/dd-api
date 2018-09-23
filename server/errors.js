class CustomError extends Error {
  constructor(status, message, code, name) {
    super(message);
    this.status = status;
    if (code) this.code = code;
    if (name) this.name = name;
  }
}

module.exports.BadRequest = class BadRequest extends CustomError {
  constructor(...args) {
    super(400, ...args);
  }
};

module.exports.Unauthorized = class Unauthorized extends CustomError {
  constructor(...args) {
    super(401, ...args);
  }
};

module.exports.Forbidden = class Forbidden extends CustomError {
  constructor(...args) {
    super(403, ...args);
  }
};

module.exports.NotFound = class NotFound extends CustomError {
  constructor(...args) {
    super(404, ...args);
  }
};

module.exports.Conflict = class Conflict extends CustomError {
  constructor(...args) {
    super(409, ...args);
  }
};

module.exports.InternalServer = class InternalServer extends CustomError {
  constructor(...args) {
    super(500, ...args);
  }
};

module.exports.codes = {
  CART_IS_EMPTY: "CART_IS_EMPTY",
  CART_DOES_NOT_EXIST: "CART_DOES_NOT_EXIST"
};
