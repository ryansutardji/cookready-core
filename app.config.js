const variant = process.env.APP_VARIANT ?? "production";

const packageSuffix = {
  development: ".dev",
  preview: ".preview",
  production: "",
}[variant];

const appName = {
  development: "CookReady (Dev)",
  preview: "CookReady (Preview)",
  production: "CookReady",
}[variant];

module.exports = ({ config }) => ({
  ...config,
  name: appName,
  android: {
    ...config.android,
    package: `com.charkurylab.cookready${packageSuffix}`,
  },
});
