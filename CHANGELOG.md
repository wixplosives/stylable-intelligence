# Change log

## v0.2.2

### Pseudo-class support

* Add completions for state type definitions
* Add completions for type validators
* Add completions for state selector enum options

## v0.2.0

### Development Infrastructure

* The intelligence service can now receive it's require function externally
* Many version updated to latest, including:
  * VSCode language services v4.0.0
  * TypeScript v2.7.2
  * Webpack v4.1.0

## v0.1.6

* Fixed a bug that caused syntax highlighting to not show on stylable files

## v0.1.2

### Pseudo-Classes with Parameters

Added basic support:

* Completions:
  * Selectors ending with a pseudo-class with a parameter will complete with parenthesis now
* Hinting:
  * Inside a selector with a pseudo-class, hint the state type and validators used
  * In a state definition, hint available types

## v0.1.0

* Major project structure refactor to improve developer experience, performance and usability.
