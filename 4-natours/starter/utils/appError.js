class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // We call the parent (Error) constructor to set the message property
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // We add "isOperational" to send them to the user
    this.isOperational = true;
    // We add the stacktrace,ommiting the document creation and the constructor stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
