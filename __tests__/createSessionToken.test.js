const faker = require("faker");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const verifyAsync = promisify(jwt.verify);

const { Auth0RuleUtilities } = require("../src");

describe("createSessionToken()", () => {
  let mockContext;
  let mockUser;
  let tokenSecret;
  let sessionToken;
  let verifiedToken;

  beforeEach(async () => {
    mockContext = {
      request: {
        ip: faker.random.alphaNumeric(12),
      },
    };

    mockUser = {
      user_id: faker.random.alphaNumeric(12),
    };

    tokenSecret = faker.random.alphaNumeric(12);

    const util = new Auth0RuleUtilities(mockContext, mockUser, {
      SESSION_TOKEN_SECRET: tokenSecret,
    });
    sessionToken = await util.createSessionToken();
    verifiedToken = await verifyAsync(sessionToken, tokenSecret);
  });

  it("sets the user ID in the token", async () => {
    expect(verifiedToken.sub).toEqual(mockUser.user_id);
  });

  it("sets the nonce in the token", async () => {
    expect(verifiedToken.nonce).toEqual(mockUser.rule_nonce);
  });

  it("sets a long-enough nonce", async () => {
    expect(verifiedToken.nonce.length).toEqual(64);
  });

  it("sets the IP address in the token", async () => {
    expect(verifiedToken.ip).toEqual(mockContext.request.ip);
  });
});
