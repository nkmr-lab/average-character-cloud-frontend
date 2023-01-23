module.exports = {
  plugins: ["relay"],
  extends: [
    "plugin:relay/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
  ],
  rules: {
    "relay/generated-flow-types": "off",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
