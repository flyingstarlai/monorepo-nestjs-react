import { nestJsConfig } from "@repo/eslint-config/nest-js";

export default [
	...nestJsConfig,
	{
		ignores: ["dist/", "node_modules/", "coverage/"],
	},
];
