# completions

the provider provides completion suggestion when a user types certain characters or pressees "ctrl+enter"

current trigger charactes:  "." ":" "-" and " "

in the current examples. | denotes the users starting caret position and  $1, $2 etc denote the caret position after completion and the tab order

## available completions

### top level directives

top level directives are allowed only in the top level of the document.


- :import - imports dependencies
- :vars - define vars for use



```css

    :|

    will offer completions:

    :import{
        -st-from:"$1"
    }

    and

    :vars{
        $1
    }
```




### class definition directives

class definition directives are used to add metadata to a css class, they are only allowed inside simple selectors*
multiple use of the same directive in the same class is not allowed

- -st-extends - defines class or variant to extend

```css
    .gaga{
        -st-extends:$1;
    }
```

- -st-states - defines list of states available for css class
```css
    .gaga{
        -st-states:$1;
    }
```
- -st-variant - defines the css class as a variant to be used as a mixin
```css
    .gaga{
        -st-variant:true;
        $1
    }
```

### import info directives
allowed only in import directive

- -st-from:"" -  file path to import
```css
    :import{
        -st-from: "$1";
    }
```
- -st-default: - local name of default export
```css
    :import{
        -st-default: $1;
    }
```
- -st-named: - list of imported named imports

```css
    :import{
        -st-named: $1;
    }
```


### mixin directives
the mixin directive is allowed inside any selector except the top level directives

- -st-mixin - list of mixins to be applied

```css
    .gaga:hover button{
        -st-mixin: $1;
    }
```

### selector completions

#### class

the names of existing simple selectors should be offered as completions, "root" class is always available
- in root level
- as part of a selector

```css
    .gaga{

    }
    .gaga$1
```


```css
    .root$1
```

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
