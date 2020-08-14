const faker = require("faker");

const { Auth0RuleUtilities, noRedirectProtocols } = require("../src");

describe("doRedirect()", () => {
  let mockContext;
  let mockUser;
  let tokenSecret;

  beforeEach(async () => {
    tokenSecret = faker.random.alphaNumeric(12);

    mockContext = {
      request: {
        query: {},
      },
    };

    mockUser = {
      user_id: faker.random.alphaNumeric(12),
      rule_nonce: faker.random.alphaNumeric(12),
    };
  });

  it("throws an error if it cannot redirect", async () => {
    mockContext.protocol = noRedirectProtocols[0];
    const util = new Auth0RuleUtilities(mockContext);

    let error;
    try {
      await util.doRedirect(mockContext);
    } catch (e) {
      error = e;
    }
    expect(error).toEqual(new Error("Cannot redirect"));
  });

  it("sets the redirect URL in context", async () => {
    const redirectUrl = faker.internet.url();
    const util = new Auth0RuleUtilities(mockContext, mockUser, {
      SESSION_TOKEN_SECRET: tokenSecret,
    });

    await util.doRedirect(redirectUrl);

    expect(mockContext.redirect.url.split("=")[0]).toEqual(`${redirectUrl}?sessionToken`);
  });
});
