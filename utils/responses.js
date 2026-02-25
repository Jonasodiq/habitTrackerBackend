module.exports.success = (data, statusCode = 200) => ({
  statusCode,
  body: JSON.stringify(data),
});

module.exports.error = (message, statusCode = 500) => ({
  statusCode,
  body: JSON.stringify({ message }),
});

module.exports.getUserId = (event) =>
  event.requestContext.authorizer.jwt.claims.sub;