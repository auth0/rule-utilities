const jwt = require("jsonwebtoken");
const crypto = require("crypto");

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

  createSessionToken(additionalClaims = {}) {
    this.user.rule_nonce = crypto.randomBytes(32).toString("hex");

    const sessionToken = {
      ip: this.context.request.ip,
      sub: this.user.user_id,
      nonce: this.user.rule_nonce,
      ...additionalClaims
    };

    return this.sign(sessionToken, this.tokenSecret);
  }

  validateSessionToken() {
    const jwt = this.queryParams.sessionToken;
    const payload = this.verify(jwt, this.tokenSecret);
    const { nonce, sub, ...params } = payload;

    if (nonce !== this.user.rule_nonce) {
      throw new Error("Invalid session nonce");
    }

    if (sub !== this.user.user_id) {
      throw new Error("Invalid user");
    }

    return params;
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
