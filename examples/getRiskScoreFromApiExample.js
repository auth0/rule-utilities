/* global configuration, auth0 */

/**
 * **Required configuration** (this Rule will be skipped if any of the below are not defined):
 *
 *    - `NAMESPACE_API_KEY` TBD
 *
 * **Optional configuration:**
 *
 *    - `NAMESPACE_TOKEN_CLAIM` Custom token claim to return response.
 *    - `NAMESPACE_SAVE_TO_USER` Set to "yes" to save latest risk score to the user.
 *    - `NAMESPACE_MAXIMUM_RISK` Set to a maximum risk score integer value above which login fails.
 *
 * @param {object} user
 * @param {object} context
 * @param {function} callback
 */
async function getRiskScoreFromApiExample(user, context, callback) {
  // TODO: Update with integration-specific namespace.
  if (!configuration.NAMESPACE_API_KEY) {
    console.log("Missing required configuration. Skipping.");
    return callback(null, user, context);
  }

  // OPTIONAL: check the Application metadata to see if this API should be skipped.
  if (context.clientMetadata.getUserDataFromApi === "false") {
    return callback(null, user, context);
  }

  // TODO: Update with integration-specific namespace.
  const userUtils = new require(
    "@auth0/rule-utilities@0.2.0"
  ).Auth0UserUpdateUtilities(user, auth0, "namespace");

  const axios = require("axios@0.19.2");

  // TODO: Add the API URL to call.
  const apiUrl = "https://api.example.org/profile";

  // Build the user object to POST to the API.
  // This call is M2M so we're not worried about tampering or PII.
  const userData = {
    // https://auth0.com/docs/rules/context-object
    ip: context.request.ip,
    userAgent: context.request.userAgent,

    // https://auth0.com/docs/rules/user-object-in-rules
    user_id: user.user_id,
    email: user.email,
    email_verified: !!user.email_verified,
  };

  let apiResponse;
  try {
    apiResponse = await axios.post(apiUrl, userData, {
      headers: {
        Authorization: `Bearer ${configuration.NAMESPACE_API_KEY}`,
      },
    });
  } catch (apiHttpError) {
    // Swallow risk scope API call, default is set to highest risk below.
    console.log(`Error while calling risk score API: ${apiHttpError.message}`);
  }

  // Default risk value is set to highest if API fails or no score returned.
  const riskScore = typeof apiResponse.riskScore === "number" ? riskScore : 100;

  // TODO: Update with integration-specific namespace.
  if (configuration.NAMESPACE_SAVE_TO_USER === "yes") {
    userUtils.setAppMeta("risk_score", riskScore);

    try {
      await userUtils.updateAppMeta();
    } catch (error) {
      // Swallow Auth0 error, login can continue.
      console.log(`Error updating user: ${apiHttpError.message}`);
    }
  }

  // TODO: Adjust for real values and update with integration-specific namespace.
  const maximumRisk = parseInt(configuration.NAMESPACE_MAXIMUM_RISK, 10);
  if (maximumRisk && riskScore > maximumRisk) {
    console.log(
      `Risk score ${riskScore} is greater than maximum of ${maximumRisk}`
    );
    return callback(new UnauthorizedError("Risk score too high"));
  }

  // TODO: Update with integration-specific namespace.
  if (configuration.NAMESPACE_TOKEN_CLAIM) {
    context.idToken[configuration.NAMESPACE_TOKEN_CLAIM] = riskScore;
    context.accessToken[configuration.NAMESPACE_TOKEN_CLAIM] = riskScore;
  }

  return callback(null, user, context);
}
