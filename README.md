# stylable-intelligence

[![Greenkeeper badge](https://badges.greenkeeper.io/wixplosives/stylable-intelligence.svg)](https://greenkeeper.io/)

Stylable intelligence is the engine behind Stylable's different IDE plugins.

## Capabilities

 - code completion
 - hover-hints
 - diagnostics
 - goto definition
 - find references
 - highlight occurances
 - rename symbols


## project structure


- src
    - extension.ts - VSCODE extension
    - provider.ts - completion provider   * must remain separate from VSCODE *
    - utils/ - utilities for provider   * must remain separate from VSCODE *
- test
    - index.ts - setup for E2E
    - setup.ts - setup for unit tests
    - extension/ - E2E
        - completion.test.ts - test file ( VSCODE requires the *.test.ts format )
        - *.css files - fixures used in completion.test.ts
    - completion.spec.ts - tests for provider
    - utils/ - tests for utils




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

