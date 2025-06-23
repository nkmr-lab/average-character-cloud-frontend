module.exports = {
  src: "./src",
  language: "typescript",
  schema: "./schema.graphql",
  eagerEsModules: true,
  exclude: [
    "**/node_modules/**",
    "**/__tests__/**",
    "**/__mocks__/**",
    "**/__generated__/**",
  ],
  customScalarTypes: {
    DateTimeUtc: "string",
    CharacterValue: "string",
    Figure: "string",
    Ulid: "string",
  },
};
