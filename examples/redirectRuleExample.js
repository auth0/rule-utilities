/* global configuration */

/**
 * Exmaple Rule to redirect for verification and store the result in the user meta.
 * Use Rules configuration to define:
 *    - SESSION_TOKEN_SECRET: Long, random string
 *    - ID_VERIFICATION_URL: URL to receive the redirect
 *
 * @param {object} user
 * @param {object} context
 * @param {function} callback
 */
function redirectRuleExample(user, context, callback) {
  const { Auth0RedirectRuleUtilities } = require("@auth0/rule-utilities@0.1.0");

  const ruleUtils = new Auth0RedirectRuleUtilities(
    user,
    context,
    configuration
  );

  if (ruleUtils.isRedirectCallback && ruleUtils.queryParams.session_token) {
    // User is back from the redirect and has a session token to validate.

    try {
      ruleUtils.validateSessionToken();
    } catch (error) {
      callback(error);
    }

    // ... do something with POSTed or param data ...

    user.app_metadata = user.app_metadata || {};
    user.app_metadata.is_verified = true;
    callback(null, user, context);
  }

  // Some kind of context check occurred to determine if a redirect should happen.
  if (
    ruleUtils.canRedirect &&
    (!user.app_metadata || !user.app_metadata.is_verified)
  ) {
    try {
      // This method automatically creates a session token.
      // To add data to this token, use ruleUtils.createSessionToken and pass as second param below.
      ruleUtils.doRedirect(configuration.ID_VERIFICATION_URL);
      callback(null, user, context);
    } catch (error) {
      callback(error);
    }
  }

  callback(null, user, context);
}
