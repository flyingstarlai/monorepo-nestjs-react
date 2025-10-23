import { config as baseConfig } from "./base.js";
import globals from "globals";

/**
 * A custom ESLint configuration for Node.js libraries.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const libraryConfig = [
	...baseConfig,
	{
		languageOptions: {
			globals: {
				React: true,
				JSX: true,
				...globals.node,
			},
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
			},
		},
		settings: {
			"import/resolver": {
				typescript: {
					project: "./tsconfig.json",
				},
			},
		},
	},
	{
		ignores: [".*.js", "node_modules/", "dist/"],
	},
];

export default libraryConfig;
