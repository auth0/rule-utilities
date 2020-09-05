const faker = require("faker");
const jwt = require("jsonwebtoken");

const { Auth0RedirectRuleUtilities } = require("../src");

const testClockLeeway = 60 * 1000;
const threeDays = 3 * 24 * 60 * 60 * 1000;
const oneHour = 60 * 60 * 1000;

describe("createSessionToken()", () => {
  let mockContext;
  let mockUser;
  let tokenSecret;
  let verifiedToken;
  let util;

  beforeEach(() => {
    mockContext = {
      request: {
        ip: faker.random.alphaNumeric(12),
        hostname: faker.random.alphaNumeric(12),
      },
    };

    mockUser = {
      user_id: faker.random.alphaNumeric(12),
    };

    tokenSecret = faker.random.alphaNumeric(12);

    util = new Auth0RedirectRuleUtilities(mockUser, mockContext, {
      SESSION_TOKEN_SECRET: tokenSecret,
    });

    verifiedToken = jwt.verify(util.createSessionToken(), tokenSecret);
  });

  it("sets the user ID in the token", () => {
    expect(verifiedToken.sub).toEqual(mockUser.user_id);
  });

  it("sets a default exp in the token", () => {
    expect(verifiedToken.exp).toBeGreaterThan(
      (Date.now() + threeDays - testClockLeeway) / 1000
    );
    expect(verifiedToken.exp).toBeLessThan(
      (Date.now() + threeDays + testClockLeeway) / 1000
    );
  });

  it("sets a custom exp in the token", () => {
    util = new Auth0RedirectRuleUtilities(mockUser, mockContext, {
      SESSION_TOKEN_SECRET: tokenSecret,
      SESSION_TOKEN_EXPIRES_IN: "1h",
    });

    verifiedToken = jwt.verify(util.createSessionToken(), tokenSecret);

    expect(verifiedToken.exp).toBeGreaterThan(
      (Date.now() + oneHour - testClockLeeway) / 1000
    );
    expect(verifiedToken.exp).toBeLessThan(
      (Date.now() + oneHour + testClockLeeway) / 1000
    );
  });

  it("sets the iss in the token", () => {
    expect(verifiedToken.iss).toEqual(
      `https://${mockContext.request.hostname}/`
    );
  });

  it("sets the IP address in the token", () => {
    expect(verifiedToken.ip).toEqual(mockContext.request.ip);
  });

  it("sets additional properties in the token", () => {
    const additionalProps = { prop: faker.random.alphaNumeric(12) };
    verifiedToken = jwt.verify(
      util.createSessionToken(additionalProps),
      tokenSecret
    );
    expect(verifiedToken.prop).toEqual(additionalProps.prop);
  });
});
