PROTEIN
=======


This is a fork of [ribosome](https://github.com/sustrik/ribosome) that provides some necessary extensions to it.
At the moment, only the javascript implementation is provided.

## Installation

```
node install.js
```
## Testing

```
node test.js
```

Check ribosome for documentation. Here we will describe the extensions.

## Additional Commands

1. The dots command.
```
./dots(n)
```

Adds n level of dots. Protein will need to execute n times for the code to execute.
Similarly, expressions of this form:
```
.@m{expression}
.&m{expression}
```

will be executed in m + n + 1 protein executions.

2. The exec command.
```
./exec("path_to_dna",[args1],[args2])
```

Executes the dna file n times with the arguments passed in the arrays.
