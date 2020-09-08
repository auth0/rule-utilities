const { Auth0UserUpdateUtilities } = require("../src");
const faker = require("faker");

describe("Auth0UserUpdateUtilities", () => {
  let user;
  let auth0;
  let util;

  beforeEach(() => {
    user = {
      user_metadata: {
        prop: faker.random.word(),
        namespace: { prop: faker.random.word() },
      },
      app_metadata: {
        prop: faker.random.word(),
        namespace: { prop: faker.random.word() },
      },
    };

    auth0 = {
      accessToken: faker.random.alphaNumeric(),
      domain: faker.internet.domainName(),
    };

    util = new Auth0UserUpdateUtilities(user, auth0);
    util.userId = faker.random.alphaNumeric(12);
    util.apiClient = {
      updateUser: jest.fn(),
      updateUserMetadata: jest.fn(),
      updateAppMetadata: jest.fn(),
    };
  });

  describe("setUser", () => {
    it("sets the user prop", () => {
      const propName = faker.random.alphaNumeric();
      const propValue = faker.random.alphaNumeric();
      util.setUser(propName, propValue);
      expect(util.user[propName]).toEqual(propValue);
      expect(util.updatedUserData[propName]).toEqual(propValue);
      expect(user[propName]).toEqual(propValue);
    });
  });

  describe("setUserMeta", () => {
    it("sets metadata without a namespace", () => {
      const propName = faker.random.alphaNumeric();
      const propValue = faker.random.alphaNumeric();
      util.setUserMeta(propName, propValue);
      expect(util.user.user_metadata[propName]).toEqual(propValue);
      expect(user.user_metadata[propName]).toEqual(propValue);
    });

    it("sets metadata with a namespace", () => {
      util = new Auth0UserUpdateUtilities(user, auth0, "namespace");
      const propName = faker.random.alphaNumeric();
      const propValue = faker.random.alphaNumeric();
      util.setUserMeta(propName, propValue);
      expect(util.user.user_metadata["namespace"][propName]).toEqual(propValue);
      expect(user.user_metadata["namespace"][propName]).toEqual(propValue);
    });
  });

  describe("setAppMeta", () => {
    it("sets metadata without a namespace", () => {
      const propName = faker.random.alphaNumeric();
      const propValue = faker.random.alphaNumeric();
      util.setAppMeta(propName, propValue);
      expect(util.user.app_metadata[propName]).toEqual(propValue);
      expect(user.app_metadata[propName]).toEqual(propValue);
    });

    it("sets metadata with a namespace", () => {
      util = new Auth0UserUpdateUtilities(user, auth0, "namespace");
      const propName = faker.random.alphaNumeric();
      const propValue = faker.random.alphaNumeric();
      util.setAppMeta(propName, propValue);
      expect(util.user.app_metadata["namespace"][propName]).toEqual(propValue);
      expect(user.app_metadata["namespace"][propName]).toEqual(propValue);
    });
  });

  describe("getUserMeta", () => {
    it("gets metadata without a namespace", () => {
      expect(util.getUserMeta("prop")).toEqual(user.user_metadata.prop);
    });

    it("gets metadata with a namespace", () => {
      util = new Auth0UserUpdateUtilities(user, auth0, "namespace");
      expect(util.getUserMeta("prop")).toEqual(
        user.user_metadata.namespace.prop
      );
    });

    it("gets empty metadata", () => {
      expect(util.getUserMeta(faker.random.alphaNumeric(12))).toBeUndefined();
    });
  });

  describe("getAppMeta", () => {
    it("gets metadata without a namespace", () => {
      expect(util.getAppMeta("prop")).toEqual(user.app_metadata.prop);
    });

    it("gets metadata with a namespace", () => {
      util = new Auth0UserUpdateUtilities(user, auth0, "namespace");
      expect(util.getAppMeta("prop")).toEqual(user.app_metadata.namespace.prop);
    });

    it("gets empty metadata", () => {
      expect(util.getAppMeta(faker.random.alphaNumeric(12))).toBeUndefined();
    });
  });

  describe("updateUser", () => {
    it("calls updateUser with the correct data", () => {
      util.userId = faker.random.alphaNumeric(12);
      util.updatedUserData = { nickname: faker.random.word() };
      util.updateUser();
      expect(util.apiClient.updateUser).toHaveBeenCalledWith(
        { id: util.userId },
        util.updatedUserData
      );
    });
  });

  describe("updateUserMetadata", () => {
    it("calls updateUserMetadata with the correct data", () => {
      util.updateUserMetadata();
      expect(util.apiClient.updateUserMetadata).toHaveBeenCalledWith(
        { id: util.userId },
        util.user.user_metadata
      );
    });
  });

  describe("updateAppMetadata", () => {
    it("calls updateAppMetadata with the correct data", () => {
      util.updateAppMetadata();
      expect(util.apiClient.updateAppMetadata).toHaveBeenCalledWith(
        { id: util.userId },
        util.user.app_metadata
      );
    });
  });
});
