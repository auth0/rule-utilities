const faker = require("faker");

const { Auth0RedirectRuleUtilities, noRedirectProtocols } = require("../src");

describe("doRedirect()", () => {
  let mockContext;
  let mockUser;
  let tokenSecret;

  beforeEach(() => {
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

  it("throws an error if it cannot redirect", () => {
    mockContext.protocol = noRedirectProtocols[0];
    const util = new Auth0RedirectRuleUtilities(mockUser, mockContext);

    let error;
    try {
      util.doRedirect(mockContext);
    } catch (e) {
      error = e;
    }
    expect(error).toEqual(new Error("Cannot redirect"));
  });

  it("sets a custom session token", () => {
    const redirectUrl = faker.internet.url();
    const util = new Auth0RedirectRuleUtilities(mockUser, mockContext, {
      SESSION_TOKEN_SECRET: tokenSecret,
    });
    const customSessionToken = faker.random.alphaNumeric(12);

    util.doRedirect(redirectUrl, { sessionToken: customSessionToken });

    expect(mockContext.redirect.url).toEqual(
      `${redirectUrl}?session_token=${customSessionToken}`
    );
  });

  it("generates a session token", () => {
    const redirectUrl = faker.internet.url();
    const util = new Auth0RedirectRuleUtilities(mockUser, mockContext, {
      SESSION_TOKEN_SECRET: tokenSecret,
    });

    util.doRedirect(redirectUrl);

    expect(mockContext.redirect.url.split("=")[0]).toEqual(
      `${redirectUrl}?session_token`
    );
  });

  it("sets a plain redirect URL in context", () => {
    const redirectUrl = faker.internet.url();
    const util = new Auth0RedirectRuleUtilities(mockUser, mockContext);

    util.doRedirect(redirectUrl, { generateSessionToken: false });

    expect(mockContext.redirect.url).toEqual(redirectUrl);
  });
});
