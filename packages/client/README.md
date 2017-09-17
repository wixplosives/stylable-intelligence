# Stylable Intelligence Server
[![Build Status](https://travis-ci.org/wixplosives/stylable-intelligence.svg?branch=master)](https://travis-ci.org/wixplosives/stylable-intelligence)

## Overview
Stylable Intelligence is a server implementing the Language Server Protocol that provides IDE support for Stylable.
It currently supports all code completiosn as well as all diagnostics provided by Stylable.
Stylable Intelligence is currently only supported in VsCode (version 1.16 and later), and WebStorm will be the next IDE.

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

### Not supported yet:
* Mixins
* Variables
* Esoteric syntax (-st-compose, -st-theme, -st-root)
* Variants
* Globals
