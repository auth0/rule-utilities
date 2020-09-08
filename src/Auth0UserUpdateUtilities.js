const ManagementClient = require("auth0").ManagementClient;

class Auth0UserUpdateUtilities {
  constructor(user, auth0, namespace) {
    this.apiClient = new ManagementClient({
      token: auth0.accessToken,
      domain: auth0.domain,
      options: {
        retry: {
          enabled: true,
          maxRetries: 2,
        },
      },
    });

    this.updatedUserData = {};
    this.userId = user.user_id;
    this.user = user;
    this.user.user_metadata = user.user_metadata || {};
    this.user.app_metadata = user.app_metadata || {};

    this.isNamespaced = namespace && typeof namespace === "string";
    if (this.isNamespaced) {
      this.namespace = namespace;
      this.user.user_metadata[namespace] = user.user_metadata[namespace] || {};
      this.user.app_metadata[namespace] = user.app_metadata[namespace] || {};
    }
  }

  setUser(key, value) {
    this.user[key] = value;
    this.updatedUserData[key] = value;
  }

  setUserMeta(key, value) {
    if (this.isNamespaced) {
      this.user.user_metadata[this.namespace][key] = value;
    } else {
      this.user.user_metadata[key] = value;
    }
  }

  setAppMeta(key, value) {
    if (this.isNamespaced) {
      this.user.app_metadata[this.namespace][key] = value;
    } else {
      this.user.app_metadata[key] = value;
    }
  }

  getUserMeta(key) {
    return this.isNamespaced
      ? this.user.user_metadata[this.namespace][key]
      : this.user.user_metadata[key];
  }

  getAppMeta(key) {
    return this.isNamespaced
      ? this.user.app_metadata[this.namespace][key]
      : this.user.app_metadata[key];
  }

  updateUser() {
    (async () => {
      await this.apiClient.updateUser(
        { id: this.userId },
        this.updatedUserData
      );
    })();
  }

  updateUserMetadata() {
    (async () => {
      await this.apiClient.updateUserMetadata(
        { id: this.userId },
        this.user.user_metadata
      );
    })();
  }

  updateAppMetadata() {
    (async () => {
      await this.apiClient.updateAppMetadata(
        { id: this.userId },
        this.user.app_metadata
      );
    })();
  }
}

module.exports = {
  Auth0UserUpdateUtilities,
};
