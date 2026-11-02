import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // El núcleo no conoce el framework, la base de datos, el LLM ni el canal: así se puede
    // conectar otro canal o reutilizarlo en otro negocio sin reescribirlo.
    files: ["src/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["next", "next/*", "react", "react-dom"], message: "core/ no depende del framework." },
            { group: ["@supabase/*", "@anthropic-ai/*"], message: "core/ habla con infraestructura solo por puertos." },
            { group: ["@/infra/*", "@/features/*", "@/app/*"], message: "core/ no importa capas externas." },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mjs"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
