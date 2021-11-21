# Development Environment

This document describes the stylable-intelligence project setup and development process.
Readme for the extension itself can be found [here](https://github.com/wix/stylable-intelligence/blob/master/README.md).

## Project Setup

* Clone this repo
* Run `npm i` to install dependencies
* Run `npm test` to test and build the vscode extension
* To launch and debug the extension:
  1. open the repo in VSCode
  2. open the 'Debug Panel' in VSCode
  3. Choose the 'Launch Extension' configuration and press play, a new VSCode instance will open to debug
  4. Once the extension is launched, choose the 'Attach' configuration and press play once more.
  5. You can now add breakpoints and debug the project by placing breakpoints in the original VSCode and triggering actions in the debugged instance of VSCode

## Misc. Resources

* VSCode example client/server: https://code.visualstudio.com/docs/extensions/example-language-server
* VSCode extension reference: https://code.visualstudio.com/docs/extensionAPI/overview
* CSS Language Service: https://github.com/Microsoft/vscode-css-languageservice
* CSS Syntax Highlighter (TextMate format, base for our own): https://github.com/Microsoft/vscode/blob/master/extensions/css/syntaxes/css.tmLanguage.json
* Color Icon and Color Picker: https://github.com/Microsoft/vscode/issues/38959
* Allow disabling Color Picker: https://github.com/Microsoft/vscode/issues/42344
* Why no file icon in VScode? : https://github.com/Microsoft/vscode/issues/14662
* Issues regarding completion display/filtering:
  * Bug in completion text matching (mine): https://github.com/Microsoft/vscode/issues/34542
  * Lots of explanations and links to code about how completions are ordered and filtered: https://github.com/Microsoft/vscode/issues/26096
  * Link to activating completion ranking display: https://github.com/Microsoft/vscode/issues/41060#issuecomment-357879748
