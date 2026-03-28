import globals from "globals";
import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    languageOptions: { 
        globals: {
            ...globals.node,
            ...globals.es2021
        },
        ecmaVersion: "latest",
        sourceType: "module"
    }
  },
  pluginJs.configs.recommended,
  eslintConfigPrettier,
  {
      rules: {
          "no-unused-vars": "warn",
          "no-undef": "warn",
          "no-redeclare": "warn",
          "no-useless-catch": "warn",
          "no-empty": "warn"
      }
  },
  {
      ignores: ["node_modules/", "session/", "temp/", "logs/"]
  }
];
