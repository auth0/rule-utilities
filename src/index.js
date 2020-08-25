const jwt = require("jsonwebtoken");

const noRedirectProtocols = [
  "oauth2-resource-owner",
  "oauth2-refresh-token",
  "oauth2-password",
  "redirect-callback",
];

class Auth0RedirectRuleUtilities {
  constructor(user, context, configuration) {
    this.context = context || {};
    this.user = user || {};
    this.tokenSecret = configuration && configuration.SESSION_TOKEN_SECRET;
    this.noRedirectProtocols = noRedirectProtocols;

    this.verify = jwt.verify;
    this.sign = jwt.sign;
  }

  get redirectUrl() {
    return this.context.redirect && this.context.redirect.url;
  }

  get queryParams() {
    return (this.context.request && this.context.request.query) || {};
  }

  get protocolCanRedirect() {
    return !this.noRedirectProtocols.includes(this.context.protocol);
  }

  get isRedirectCallback() {
    return this.context.protocol === "redirect-callback";
  }

  get canRedirect() {
    // Don't redirect if someone else wants to.
    if (this.redirectUrl) {
      return false;
    }

    // If multifactor is requested skip this.
    if (this.context.multifactor) {
      return false;
    }

    // If prompt is none, don't redirect, this will throw an
    // interaction needed error, therefore we will try to
    // avoid this, for conditions like these, the app may
    // just add more support for progressive profiling
    // using <iframe> as a widget in-app.
    if (this.queryParams.prompt === "none") {
      return false;
    }

    return this.protocolCanRedirect;
  }

  /**
   * Create a signed session token with the user ID and IP address by default.
   * Additional claims can be added as an object.
   * These additional claims MUST NOT contain sensitive information.
   * The Rules configuration must contain a SESSION_TOKEN_SECRET value.
   *
   * @param {object} additionalClaims - Object or additional, non-sensitive claims to include.
   *
   * @return {string} - Signed token.
   */
  createSessionToken(additionalClaims = {}) {
    const sessionToken = {
      ip: this.context.request.ip,
      iss: `https://${this.context.request.hostname}/`,
      sub: this.user.user_id,
      ...additionalClaims,
    };

    return this.sign(sessionToken, this.tokenSecret, { expiresIn: "3d" });
  }

  validateSessionToken(verifyOptions = {}) {
    const jwt = this.queryParams.sessionToken;
    const payload = this.verify(jwt, this.tokenSecret, {
      ...verifyOptions,
      subject: this.user.user_id,
      issuer: `https://${this.context.request.hostname}/`,
    });

    if (!payload.exp) {
      throw new Error("Expired token");
    }

    return payload;
  }

  doRedirect(url) {
    if (!this.canRedirect) {
      throw new Error("Cannot redirect");
    }

    const token = this.createSessionToken();
    this.context.redirect = {
      url: `${url}?sessionToken=${token}`,
    };
  }
}

module.exports = {
  Auth0RedirectRuleUtilities,
  noRedirectProtocols,
};
