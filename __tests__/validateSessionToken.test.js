const faker = require("faker");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const signAsync = promisify(jwt.sign);

const { Auth0RuleUtilities } = require("../src");

describe("validateSessionToken()", () => {
  let mockContext;
  let mockUser;
  let tokenSecret;
  let sessionToken;
  let signedSessionToken;

  beforeEach(async () => {
    tokenSecret = faker.random.alphaNumeric(12);

    sessionToken = {
      nonce: faker.random.alphaNumeric(12),
      sub: faker.random.alphaNumeric(12),
      prop: faker.random.alphaNumeric(12),
    };

    signedSessionToken = await signAsync(sessionToken, tokenSecret);

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

  it("throws an error if the token nonce does not match the user", async () => {
    const util = new Auth0RuleUtilities(mockContext, mockUser, {
      SESSION_TOKEN_SECRET: tokenSecret,
    });

    let error;
    try {
      await util.validateSessionToken();
    } catch (e) {
      error = e;
    }

    expect(error).toEqual(new Error("Invalid session nonce"));
  });

  it("throws an error if the token sub does not match the user", async () => {
    mockUser.rule_nonce = sessionToken.nonce;
    const util = new Auth0RuleUtilities(mockContext, mockUser, {
      SESSION_TOKEN_SECRET: tokenSecret,
    });

    let error;
    try {
      await util.validateSessionToken(mockContext, mockUser, tokenSecret);
    } catch (e) {
      error = e;
    }

    expect(error).toEqual(new Error("Invalid user"));
  });

  it("returns the validated token if checks pass", async () => {
    mockUser.rule_nonce = sessionToken.nonce;
    mockUser.user_id = sessionToken.sub;
    const util = new Auth0RuleUtilities(mockContext, mockUser, {
      SESSION_TOKEN_SECRET: tokenSecret,
    });

    expect(
      await util.validateSessionToken(mockContext, mockUser, tokenSecret)
    ).toMatchObject({
      prop: sessionToken.prop,
    });
  });
});
