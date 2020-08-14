const faker = require("faker");
const jwt = require("jsonwebtoken");

const { Auth0RedirectRuleUtilities } = require("../src");

describe("validateSessionToken()", () => {
  let mockContext;
  let mockUser;
  let tokenSecret;
  let sessionToken;
  let signedSessionToken;

  beforeEach(() => {
    tokenSecret = faker.random.alphaNumeric(12);

    sessionToken = {
      nonce: faker.random.alphaNumeric(12),
      sub: faker.random.alphaNumeric(12),
      prop: faker.random.alphaNumeric(12),
    };

    signedSessionToken = jwt.sign(sessionToken, tokenSecret);

    mockContext = {
      request: {
        query: {
          sessionToken: signedSessionToken,
        },
      },
    };

    mockUser = {
      user_id: faker.random.alphaNumeric(12),
      rule_nonce: faker.random.alphaNumeric(12),
    };
  });

  it("throws an error if the token nonce does not match the user", () => {
    const util = new Auth0RedirectRuleUtilities(mockUser, mockContext, {
      SESSION_TOKEN_SECRET: tokenSecret,
    });
    expect(() => util.validateSessionToken()).toThrowError(
      "Invalid session nonce"
    );
  });

  it("throws an error if the token sub does not match the user", () => {
    mockUser.rule_nonce = sessionToken.nonce;
    const util = new Auth0RedirectRuleUtilities(mockUser, mockContext, {
      SESSION_TOKEN_SECRET: tokenSecret,
    });
    expect(() => util.validateSessionToken()).toThrowError("Invalid user");
  });

  it("returns the validated token if checks pass", () => {
    mockUser.rule_nonce = sessionToken.nonce;
    mockUser.user_id = sessionToken.sub;
    const util = new Auth0RedirectRuleUtilities(mockUser, mockContext, {
      SESSION_TOKEN_SECRET: tokenSecret,
    });

    expect(util.validateSessionToken()).toMatchObject({
      prop: sessionToken.prop,
    });
  });
});
