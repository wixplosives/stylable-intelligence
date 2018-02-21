[![Visual Studio Marketplace](https://img.shields.io/vscode-marketplace/v/wix.stylable-intelligence.svg)](https://marketplace.visualstudio.com/items?itemName=wix.stylable-intelligence)
[![Build Status](https://travis-ci.org/wix/stylable-intelligence.svg?branch=master)](https://travis-ci.org/wix/stylable-intelligence)
[![Build Status](https://ci.appveyor.com/api/projects/status/github/wix/stylable-intelligence?branch=master&svg=true)](https://ci.appveyor.com/project/qballer/stylable-intelligence)
[![Visual Studio Marketplace](https://img.shields.io/vscode-marketplace/d/wix.stylable-intelligence.svg)](https://marketplace.visualstudio.com/items?itemName=wix.stylable-intelligence)
[![npm version](https://badge.fury.io/js/stylable-intelligence.svg)](https://badge.fury.io/js/stylable-intelligence)

# Scope
This document is about the stylable-intelligence project setup and development.
Readme for the extension itself is at https://github.com/wix/stylable-intelligence/tree/master/packages/client/README.md

# Project Setup
* Clone this repo
* Run `yarn` to install dependencies
   * (investigate what's up with `postinstall` and `prepublish` hooks)
* Run `yarn vscode:prepublish` ?? (needs to investigate further)
* Run `yarn test` to test and build (both server and client)
* To launch and debug the extension: (needs to investigate further)
  1. open vscode in packages/client/ and in packages/server/. 
  2. Choose the 'Launch Extension' configuration in the client vscode. 
  3. Once the extension is launched, choose the 'Attach' configuration in the server vscode. 

## Brain Dump
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


# Client
[![Build Status](https://travis-ci.org/wix/stylable-intelligence.svg?branch=master)](https://travis-ci.org/wix/stylable-intelligence)
[![Build Status](https://ci.appveyor.com/api/projects/status/6ky876hm9nycyu8m/branch/master?svg=true)](https://ci.appveyor.com/project/qballer/stylable-intelligence)
 
## Overview
Stylable Intelligence is an extension implementing the Language Server Protocol that provides IDE support for Stylable.

Stylable Intelligence is currently only supported in VSCode (version 1.18.0 and later). Support for JetBrains IDEs (WebStorm, IntelliJ) is planned.

Currently supported: Code Completions, Diagnostics, Go to Definition, Syntax Highlighting

All CSS language support functionality is also supported (hover hints, inline color picker, etc.). Some CSS diagnostics no longer apply in Stylable and are filtered out.

Other Language Server features will be added in the near future.


## Installation

### From VSCode Marketplace
Search VSCode Extension Marketplace for ['Stylable Intelligence'](https://marketplace.visualstudio.com/search?term=stylable-intelligence&target=VSCode&category=All%20categories&sortBy=Relevance).

Install extension.

Reload window when prompted by VsCode.

### From .vsix file 
In VsCode extension menu, choose 'Install from VSIX'.

Double-click your .vsix file. 

Reload window when prompted by VsCode.

## Known Issues

### Not supported yet (in rough order of priority):
* Mixins and JS imports - WIP
* Variants
* Esoteric syntax (-st-compose, -st-theme, -st-root, -st-global)
* Find References
* Rename/Refactor

# Server
stylable-intelligence-server
----------------------------
stylable-intelligence completion provider to be consumed outside
of the context of vscode extension.

```typescript
import {MinimalDocs, createProvider, Provider } from 'stylable-intelligence-server'
```
