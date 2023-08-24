module.exports = {
  env: {
    node: true,
  },
  extends: ["eslint:recommended", "prettier"],
  // list prettier last to switch off rule sets conflicting with it
  parser: "@typescript-eslint/parser",
  plugins: ["eslint-plugin-jsdoc", "eslint-plugin-prefer-arrow", "prettier"],
  rules: {
    "prettier/prettier": 1,
    // means prettier issues are lint warnings, auto fixed where possible
  },
  overrides: [
    {
      files: ["*.ts"], // only apply to .ts files
      // recommended to extend the TS-specific plugins here,
      // instead of extending them outside the `overrides`.
      extends: ["plugin:@typescript-eslint/recommended"],
      parserOptions: {
        project: ["./tsconfig.json"],
      },
      rules: {
        "prefer-const": "warn",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-empty-interface": "warn",
      },
    },
  ],
};
