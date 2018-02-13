[![Build Status](https://travis-ci.org/wix/stylable-intelligence.svg?branch=master)](https://travis-ci.org/wix/stylable-intelligence)
[![Build Status](https://ci.appveyor.com/api/projects/status/github/wix/stylable-intelligence?branch=master&svg=true)](https://ci.appveyor.com/project/qballer/stylable-intelligence)

# Scope
This document is about the stylable-intelligence project setup and development.
Readme for the extension itself is at https://github.com/wix/stylable-intelligence/tree/master/packages/client/README.md

# Project Setup
* Clone this repo
* Run yarn (in this order) in: packages/server/, packages/client/ and project root
* To build server and copy to client: yarn start in packages/server/
* To build server and run tests: yarn test in packages/server/
* To run client tests from command line: yarn test in packages/client/
  * To run client tests from command line, you must have no open instances of vscode. It is easier to run client tests from within vscode (see below).
* To run client tests from vscode, open vscode in pakages/client/ and choose the 'Launch Tests' launch configuration.
* To run server tests from vscode, open vscode in pakages/server/ and choose the 'run tests' launch configuration.
* To launch and debug the extension:
  1. open vscode in packages/client/ and in packages/server/. 
  2. Choose the 'Launch Extension' configuration in the client vscode. 
  3. Once the extension is launched, choose the 'Attach' configuration in the server vscode. 

## Brain Dump
* CSS Language Service: https://github.com/Microsoft/vscode-css-languageservice
* CSS Syntax Highlighter (TextMate format, base for our own): https://github.com/Microsoft/vscode/blob/master/extensions/css/syntaxes/css.tmLanguage.json
* Color Icon and Color Picker: https://github.com/Microsoft/vscode/issues/38959
* Allow disabling Color Picker: https://github.com/Microsoft/vscode/issues/42344
* Why no file icon in VScode? : https://github.com/Microsoft/vscode/issues/14662
