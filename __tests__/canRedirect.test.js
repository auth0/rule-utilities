const faker = require("faker");

const { Auth0RedirectRuleUtilities, noRedirectProtocols } = require("../src");

describe("canRedirect()", () => {
  it("returns false if there is a redirect set", () => {
    const util = new Auth0RedirectRuleUtilities(
      {},
      {
        redirect: { url: faker.internet.url() },
      }
    );
    expect(util.canRedirect).toEqual(false);
  });

  it("returns false if there is multifactor context", () => {
    const util = new Auth0RedirectRuleUtilities(
      {},
      {
        multifactor: faker.random.word(),
      }
    );
    expect(util.canRedirect).toEqual(false);
  });

  it("returns false if prompt query param is set to none", () => {
    const util = new Auth0RedirectRuleUtilities(
      {},
      {
        request: { query: { prompt: "none" } },
      }
    );
    expect(util.canRedirect).toEqual(false);
  });

  it("returns false if a certain protocol", () => {
    const randomIndex = faker.random.number({
      min: 0,
      max: noRedirectProtocols.length - 1,
    });
    const util = new Auth0RedirectRuleUtilities(
      {},
      {
        request: {},
        protocol: noRedirectProtocols[randomIndex],
      }
    );
    expect(util.canRedirect).toEqual(false);
  });

  it("returns true", () => {
    const util = new Auth0RedirectRuleUtilities(
      {},
      {
        request: { query: { prompt: faker.random.word() } },
        protocol: faker.random.word(),
      }
    );
    expect(util.canRedirect).toEqual(true);
  });
});
