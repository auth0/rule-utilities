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
    this.noRedirectProtocols = noRedirectProtocols;

    configuration = configuration || {};
    this.tokenSecret = configuration.SESSION_TOKEN_SECRET;
    this.tokenExpiresIn = configuration.SESSION_TOKEN_EXPIRES_IN || "3d";

    this.verify = jwt.verify;
    this.sign = jwt.sign;
  }

  /**
   * Get an existing redirect URL from context, if available.
   *
   * @return {string|undefined}
   */
  get redirectUrl() {
    return this.context.redirect && this.context.redirect.url;
  }

  /**
   * Get the current query params, if any.
   *
   * @return {object}
   */
  get queryParams() {
    return (this.context.request && this.context.request.query) || {};
  }

  /**
   * Determine if the current Rule protocol allows a redirect to occur.
   *
   * @return {boolean}
   */
  get protocolCanRedirect() {
    return !this.noRedirectProtocols.includes(this.context.protocol);
  }

  /**
   * Determine if this Rule execution is happening on the redirect Rule callback.
   *
   * @return {boolean}
   */
  get isRedirectCallback() {
    return this.context.protocol === "redirect-callback";
  }

  /**
   * Determine if the current Rule context allows for a redirect to happen.
   *
   * @return {boolean}
   */
  get canRedirect() {
    // Don't redirect if someone else wants to.
    if (this.redirectUrl) {
      return false;
    }

    // If multifactor is requested skip this.
    if (this.context.multifactor) {
      return false;
    }

    // If prompt is none, this will throw an interaction needed error.
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

    return this.sign(sessionToken, this.tokenSecret, {
      expiresIn: this.tokenExpiresIn,
    });
  }

  /**
   * Validate the seesion token returned in the URL.
   *
   * @param {object} verifyOptions - Additional options for jsonwebtoken.verify
   */
  validateSessionToken(verifyOptions = {}) {
    const jwt = this.queryParams.session_token;
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

  /**
   * Check if redirect is possible and set the context if so.
   *
   * @param {sting} url - URL to redirect to.
   * @param {object|undefined} options - Session token to use or omit to create one.
   */
  doRedirect(url, options = {}) {
    if (!this.canRedirect || !url) {
      throw new Error("Cannot redirect");
    }

    const { sessionToken, generateSessionToken } = options || {};

    let sessionTokenParam;
    if (sessionToken && typeof sessionToken === "string") {
      sessionTokenParam = sessionToken;
    } else if (generateSessionToken === true) {
      sessionTokenParam = this.createSessionToken();
    }

    if (sessionTokenParam) {
      url += "?session_token=" + sessionTokenParam;
    }

    this.context.redirect = { url };
  }
}

module.exports = {
  Auth0RedirectRuleUtilities,
  noRedirectProtocols,
};
