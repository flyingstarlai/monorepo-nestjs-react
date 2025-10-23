import { config as baseConfig } from "@repo/eslint-config/base";

export default [
	...baseConfig,
	{
		ignores: [
			"dist/",
			"node_modules/",
			"coverage/",
			"apps/*/dist/",
			"packages/*/dist/",
			"*.config.js",
			"*.config.ts",
		],
	},
];
