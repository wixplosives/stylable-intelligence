# stylable-intelligence

[![Greenkeeper badge](https://badges.greenkeeper.io/wixplosives/stylable-intelligence.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/wixplosives/stylable-intelligence.svg?branch=master)](https://travis-ci.org/wixplosives/stylable-intelligence)

Stylable intelligence is the engine behind Stylable's different IDE plugins.

## Capabilities

 - code completion
 - hover-hints
 - diagnostics
 - goto definition
 - find references
 - highlight occurances
 - rename symbols


## Project Structure

This project reflects usual langauage server-based extensions structure.

The client is located in packages/client/. It is a VSCode extension that loads and registers the server. 

The server is located in packages/server/. It is a language server according to the Laguage Server Protocol.

The server is structurally independent from VSCode, and while its design is currently ifnluenced by VSCode implementation, it is subject to change.


## inherent problems

### source variance

the css source format offers a lot of choice where to place spaces tabs and newlines

```css

.gaga : hover{

}

```

```css

.gaga:hover{}

```


```css

.gaga:hover
{}

```

are all equivanlant
therefore
```css

.gaga : |



```

```css

.gaga:|

```
should offer the same completions

### invalid source
in many cases when completions are triggered the source is broken (in the middle of typing) and generating an AST is impossible.
2 ways of dealing with this are
- keeping the last valid copy
- trying to fix the file

currently provider.provideCompletionItemsFromSrc fixes the file for some easily detected cases

### corupted schema

in some cases the of illigeal source the AST is generated but corrupted:

```css
    .gaga

    .baga{

    }

```
generates an AST with one selector `.gaga \n .baga'


## Useful Resources
- https://code.visualstudio.com/docs/extensionAPI/vscode-api (and other parts of API reference)
- https://code.visualstudio.com/docs/extensions/example-language-server (and other extension authoring pages)
- https://github.com/Microsoft/vscode-languageserver-node-example/ (simple example repo)
- https://github.com/Microsoft/vscode-tslint/ (Working Lang Server, not very advanced)
- https://github.com/Microsoft/vscode/issues/26096 (Completion sorting explanation)
