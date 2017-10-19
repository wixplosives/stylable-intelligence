# Stylable Intelligence 

## Overview
Stylable Intelligence is an extension implementing the Language Server Protocol that provides IDE support for Stylable.
It currently supports all code completions as well as all diagnostics provided by Stylable.
Other Language Server features will be added in the near future.
Stylable Intelligence is currently only supported in VSCode (version 1.16 and later). Support for JetBrains IDEs (WebStorm, IntelliJ) is planned.

## Installation

### From VsCode Marketplace
Search VsCode Extension Marketplace for 'Stylable Intelligence'.
Install extension.
Reload window when prompted by VsCode.

### From .vsix file
In VsCode extension menu, choose 'Install from VSIX'.
Double-click your .vsix file. 
Reload window when prompted by VsCode.

## Known Issues

### Not supported yet (in rough order of priority):
* Complex types (.classA.classB, custom selectors with several chinks)
* Mixins and JS imports
* Variants
* Globals
* Esoteric syntax (-st-compose, -st-theme, -st-root, -st-scoped)

