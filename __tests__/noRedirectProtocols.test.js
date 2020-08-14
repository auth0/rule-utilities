const { noRedirectProtocols } = require("../src");

describe("noRedirectProtocols", () => {
  it("includes all the correct protocols", () => {
    expect(noRedirectProtocols).toEqual([
      "oauth2-resource-owner",
      "oauth2-refresh-token",
      "oauth2-password",
      "redirect-callback",
    ]);
  });
});
