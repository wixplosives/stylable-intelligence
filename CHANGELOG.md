# Changelog

## v0.2.10
* restore onDidOpen document event - run diagnosis when opening any `.st.css` files

## v0.2.9

### Bug fix
* Restored Stylable language service export for non-vscode consumers

## v0.2.8

### Bug fix

* Fixed a regression bug concerning native CSS diagnostics
* Minor fixes concerning references and definitions

### Tests

* Implement missing integration tests for several features

### Misc

* Fix broken repository URL in package.json
* Updated all production and development dependencies

## v0.2.7

### Diagnostics

* Add safety check for document color requests to prevent errors

## v0.2.6

### Diagnostics

* Turn off diagnostics messages for server language traces

## v0.2.5

### Bug fix

* Fix bug causing Stylable diagnosis to run on other file types

## v0.2.4

### Bug fix

* Color providers (color picker icons) no longer appear twice

### Infrastructure

* Further restructuring of the project for better maintainability

## v0.2.3

### Documentation

* Main `README.md` now describes the extension, all development related content moved to `dev.md`

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
