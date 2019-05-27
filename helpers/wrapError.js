/* eslint-disable */
module.exports = function wrapError(err, message) {
  err.message = message + '\n  Caused By: ' + err.message;
  return err;
};