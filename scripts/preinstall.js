fs = require('fs');

var program = '';
var prologue = fs.readFileSync('rna_prologue.js').split("\n").join('\n\\n');
var protein = fs.readFileSync('./protein.js');

var program = 'var PROLOGUE = "\n' + prologue + '\n\\n"' + protein;

fs.writeFileSync('main.js');
