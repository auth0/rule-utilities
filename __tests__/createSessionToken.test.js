const faker = require("faker");
const jwt = require("jsonwebtoken");

const { Auth0RedirectRuleUtilities } = require("../src");

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

  it("sets the exp in the token", () => {
    expect(verifiedToken.exp).toBeGreaterThan(Date.now() / 1000);
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
