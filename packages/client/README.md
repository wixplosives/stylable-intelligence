# Stylable Intelligence 

## Overview
Stylable Intelligence is an extension implementing the Language Server Protocol that provides IDE support for Stylable.
It currently supports most code completions as well as all diagnostics provided by Stylable.
Other Language Server features will be added in the near future.
Stylable Intelligence is currently only supported in VSCode (version 1.16 and later). Support for JetBrains IDEs (WebStorm, IntelliJ) is planned.

## Installation

### From VSCode Marketplace
Search VSCode Extension Marketplace for 'Stylable Intelligence'.
Install extension.
Reload window when prompted by VsCode.

### From .vsix file 
In VsCode extension menu, choose 'Install from VSIX'.
Double-click your .vsix file. 
Reload window when prompted by VsCode.

## Known Issues

### Not supported yet (in rough order of priority):
* Mixins and JS imports
* Variants
* Esoteric syntax (-st-compose, -st-theme, -st-root, -st-global)

### Buggy areas
* Inner parts of nested custom selectors
* Aliased imports
* Imported values spanning multiple lines
