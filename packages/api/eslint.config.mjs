import { libraryConfig } from "@repo/eslint-config/library";

export default [
	...libraryConfig,
	{
		ignores: ["dist/", "node_modules/", "coverage/"],
	},
];
