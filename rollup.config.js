import pkg from "./package.json" assert { type: "json" };
import typescript from "@rollup/plugin-typescript";
// import terser from "@rollup/plugin-terser";

export default {
	input: "./src/index.ts",
	output: [
		{
			format: "cjs",
			file: pkg.main
		},
		{
			format: "es",
			file: pkg.module
		}
	],
	plugins: [
		typescript()
		// terser()
	]
};
