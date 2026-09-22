export default {
  extends: ["stylelint-config-standard"],
  ignoreFiles: ["build/**", "dist/**"],
  rules: {
    "at-rule-no-unknown": [
      true,
      { ignoreAtRules: ["tailwind", "layer", "apply"] },
    ],
    "custom-property-pattern": "^ak-[a-z0-9-]+$",
    "selector-class-pattern": null,
    "selector-id-pattern": null,
  },
};
