var fs = require('fs');

var program = '';
var prologue = fs.readFileSync('rna_prologue.js','utf8').split('\n').join('\\n\\\n');

var protein = fs.readFileSync('./protein.js');

var program = '#!/usr/bin/env node\n\nvar PROLOGUE = "\\n\\\n' + prologue + '\\n\\\n"' + protein;

fs.writeFileSync('/usr/local/bin/protein',program);


