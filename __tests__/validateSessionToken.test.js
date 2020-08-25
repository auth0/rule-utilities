const faker = require("faker");
const jwt = require("jsonwebtoken");

const { Auth0RedirectRuleUtilities } = require("../src");

describe("validateSessionToken()", () => {
  let mockContext;
  let mockUser;
  let tokenSecret;
  let sessionToken;
  let signedSessionToken;
  let issuerHost;

  beforeEach(() => {
    tokenSecret = faker.random.alphaNumeric(12);
    issuerHost = faker.random.alphaNumeric(12);

    sessionToken = {
      iss: `https://${issuerHost}/`,
      sub: faker.random.alphaNumeric(12),
      prop: faker.random.alphaNumeric(12),
    };

    signedSessionToken = jwt.sign(sessionToken, tokenSecret);

    mockContext = {
      request: {
        hostname: faker.random.alphaNumeric(12),
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

  it("throws an error if there is no expiration", () => {
    mockUser.user_id = sessionToken.sub;
    mockContext.request.hostname = issuerHost;
    const util = new Auth0RedirectRuleUtilities(mockUser, mockContext, {
      SESSION_TOKEN_SECRET: tokenSecret,
    });
    expect(() => util.validateSessionToken()).toThrowError("Expired token");
  });

  it("throws an error if the token is expired", () => {
    mockUser.user_id = sessionToken.sub;
    mockContext.request.hostname = issuerHost;
    sessionToken.exp = Date.now() / 1000 - 1;
    mockContext.request.query.sessionToken = jwt.sign(
      sessionToken,
      tokenSecret
    );
    const util = new Auth0RedirectRuleUtilities(mockUser, mockContext, {
      SESSION_TOKEN_SECRET: tokenSecret,
    });
    expect(() => util.validateSessionToken()).toThrowError("jwt expired");
  });

  it("throws an error if the token sub does not match the user", () => {
    mockContext.request.hostname = issuerHost;
    sessionToken.exp = Date.now() / 1000 + 999;
    mockContext.request.query.sessionToken = jwt.sign(
      sessionToken,
      tokenSecret
    );
    const util = new Auth0RedirectRuleUtilities(mockUser, mockContext, {
      SESSION_TOKEN_SECRET: tokenSecret,
    });
    expect(() => util.validateSessionToken()).toThrowError(
      `jwt subject invalid. expected: ${mockUser.user_id}`
    );
  });

  it("throws an error if the token iss does not match host", () => {
    mockUser.user_id = sessionToken.sub;
    sessionToken.exp = Date.now() / 1000 + 999;
    mockContext.request.query.sessionToken = jwt.sign(
      sessionToken,
      tokenSecret
    );
    const util = new Auth0RedirectRuleUtilities(mockUser, mockContext, {
      SESSION_TOKEN_SECRET: tokenSecret,
    });
    expect(() => util.validateSessionToken()).toThrowError(
      `jwt issuer invalid. expected: https://${mockContext.request.hostname}/`
    );
  });

  it("returns the validated token if checks pass", () => {
    mockContext.request.hostname = issuerHost;
    sessionToken.exp = Date.now() / 1000 + 999;
    mockContext.request.query.sessionToken = jwt.sign(
      sessionToken,
      tokenSecret
    );
    mockUser.user_id = sessionToken.sub;
    const util = new Auth0RedirectRuleUtilities(mockUser, mockContext, {
      SESSION_TOKEN_SECRET: tokenSecret,
    });

    expect(util.validateSessionToken()).toMatchObject({
      prop: sessionToken.prop,
    });
  });
});
