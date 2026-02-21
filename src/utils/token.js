function cleanToken(rawValue) {
  if (typeof rawValue !== "string") {
    return "";
  }

  let token = rawValue.trim();
  if (!token) {
    return "";
  }

  // Accept "Bearer <token>" and also malformed "Bearer<token>".
  token = token.replace(/^Bearer\s*/i, "").trim();
  while (/^Bearer\s*/i.test(token)) {
    token = token.replace(/^Bearer\s*/i, "").trim();
  }

  // Strip wrapping quotes if frontend sends JSON-stringified token.
  token = token.replace(/^"(.*)"$/, "$1").trim();
  return token;
}

function extractAccessToken(req) {
  const candidates = [
    req.headers.authorization,
    req.headers.Authorization,
    req.headers["x-access-token"],
    req.headers["x-auth-token"],
    req.headers.token,
    req.body && req.body.accessToken,
    req.body && req.body.kirishToken,
    req.query && req.query.accessToken,
  ];

  for (const candidate of candidates) {
    const token = cleanToken(candidate);
    if (token) {
      return token;
    }
  }

  return "";
}

function extractRefreshToken(req) {
  const candidates = [
    req.body && req.body.refreshToken,
    req.body && req.body.yangilanishToken,
    req.headers["x-refresh-token"],
    req.headers.refreshtoken,
    req.query && req.query.refreshToken,
    req.headers.authorization,
  ];

  for (const candidate of candidates) {
    const token = cleanToken(candidate);
    if (token) {
      return token;
    }
  }

  return "";
}

module.exports = {
  extractAccessToken,
  extractRefreshToken,
};
