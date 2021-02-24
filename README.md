# SPYGlass

<div align="center"><img src="https://raw.githubusercontent.com/SPYGlassMC/logo/main/banner.png" height="256px"></div>

🚧 Under construction 🚧

## Packages

- `@spyglassmc/core`: The core package containing plugin API and general framework.
- `@spyglassmc/mcfunction`: The `mcfunction` parser and interpreter.
- `@spyglassmc/snbt`: The SNBT parser.
- `@spyglassmc/json`: The JSON validator based on [Misode][misode]'s [mcschema][mcschema] structure.
- `@spyglassmc/language-server`: The language server wrapped around other packages.
- `@spyglassmc/vscode-extension`: The VS Code extension implemented based on the language server.

## Contributing

1. ```shell
	$ git clone https://github.com/SPYGlassMC/SPYGlass.git --recursive
	```
	or
	```shell
	$ git clone https://github.com/SPYGlassMC/SPYGlass.git && git submodule update --init
	```
2. ```shell
	$ npm run init && npm run build
	```

If you're using VS Code to develop SPYGlass:

- Install the recommended [ESLint extension][eslint-extension]. Make a copy of `.vscode/settings.template.json` and rename it to `.vscode/settings.json`.
  Now your VS Code should automatically fix all linting errors every time you save the file.
- Press F5 to run the VS Code extension in development environment. VS Code will automatically compile all packages and build the extension file in watch mode.

Please refrain from using `mocha --watch`, as it might interface with and break the snapshot testing.

[eslint-extension]: https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint
[misode]: https://github.com/misode
[mcschema]: https://github.com/misode/minecraft-schemas
