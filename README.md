# stylable-intelligence

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
