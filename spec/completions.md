# completions

the provider provides completion suggestion when a user types certain characters or pressees "ctrl+enter"

current trigger charactes:  "." ":" "-" and " "

## available completions

### top level directives

top level directives are allowd only in the top level of the document.


- :import - imports dependencies
- :vars - define vars for use

### class definition directives

class definition directives are used to add metadata to a css class, they are only allowed inside simple selectors*
multiple use of the same directive in the same class is not allowed

- -st-extends - defines class or variant to extend
- -st-states - defines list of states available for css class
- -st-variant - defines the css class as a variant to be used as a mixin

### import info directives
allowed only in import directive

- -st-from:"" -  file path to import
- -st-default: - local name of default export
- -st-named: - list of imported named imports

### mixin directives
the mixin directive is allowed inside any selector

- -st-mixin - list of mixins to be applied

### selector completions

#### class

the names of existing simple selectors should be offered as completions
- in root level
- as part of a selector

#### Tag

the names of imported components should be offered as completions
- in root level
- as part of a selector

#### pseudo states

custom states need to be completed for relevant class

#### pseudo elements

custom pseudo elements need to be completed for relevant class


### rule value completions

- value(varName): allowed in any non directive rule
- -st-from value: allowed as value of -st-from. completes from fs
- -st-named value: completes from file exports
- -st-extends: completes from imported stylesheets and variants

### variable completion

completes available variables (from local file and imports) inside value()

## glosary

#### simple selectors
selectors in the top level of the document (not in media query) made up of one class selector:

```css
.className{

}
```
