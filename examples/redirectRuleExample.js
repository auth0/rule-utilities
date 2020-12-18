/* global configuration, auth0 */

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
async function redirectRuleExample(user, context, callback) {
  const {
    Auth0RedirectRuleUtilities,
    Auth0UserUpdateUtilities,
  } = require("@auth0/rule-utilities@0.2.0");

  /*
  Override or set defaults for configuration values
  const customConfiguration = {
    ...configuration,
    ...{
      SESSION_TOKEN_SECRET: "custom token secret",
      SESSION_TOKEN_EXPIRES_IN: "in seconds or a string describing a time span",
    }
  }
  */

  const ruleUtils = new Auth0RedirectRuleUtilities(
    user,
    context,
    configuration // or customConfiguration
  );

  const userUtils = new Auth0UserUpdateUtilities(user, auth0, "namespace");

  if (ruleUtils.isRedirectCallback && ruleUtils.queryParams.session_token) {
    // User is back from the redirect and has a session token to validate.

    try {
      ruleUtils.validateSessionToken();
    } catch (error) {
      callback(error);
    }

    // ... do something with POSTed or param data ...

    userUtils.setAppMeta("is_verified", true);

    try {
      await userUtils.updateAppMeta();
    } catch (error) {
      callback(error);
    }

    callback(null, user, context);
  }

  // Some kind of context check occurred to determine if a redirect should happen.
  if (ruleUtils.canRedirect && !userUtils.setAppMeta("is_verified")) {
    try {
      // This method automatically creates a session token.
      // To add data to this token, use ruleUtils.createSessionToken and pass as second param below.
      // To omit the session token, pass false as second param below.
      ruleUtils.doRedirect(configuration.ID_VERIFICATION_URL);
      callback(null, user, context);
    } catch (error) {
      callback(error);
    }
  }

  callback(null, user, context);
}
