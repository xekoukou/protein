/*
    Copyright (c) 2014-2015 Contributors as noted in AUTHORS file.
 
    This file is part of the Protein Project.

    Protein is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation or (at your option) any later version.

    Protein is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    Affero GNU General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with Protein.  If not, see http://www.gnu.org/licenses/.

*/


//Small changes to Basic classes to make life easier.
Array.prototype.last = function() {
    return this[this.length - 1];
}

var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;


function addslashes(str) {
    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}



function usage() {
    process.stderr.write("usage: protein [options] <dna-file> <args-passed-to-dna-script>\n");
    process.exit(1);
}

function dnaerror(s) {
    process.stderr.write(dnastack.last()[1] + ":" + dnastack.last()[2] + " - " + s + "\n");
    process.exit(1);
}


function rnawrite(s) {
    linemap.push([rnaln, dnastack.last()[1], dnastack.last()[2]]);
    if (rnaopt) {
        process.stdout.write(s);
    } else {
        fs.appendFileSync(rnafile, s);
    }
    var m = s.match(/\n/g);
    rnaln += m == null ? 0 : m.length;
}

if (process.argv.length < 3 || process.argv[2] == "-h" ||
      process.argv[2] == "--help") {
    usage();
}
if (process.argv[2] == "-v" || process.argv[2] == "--version") {
    process.stderr.write("protein code generator, version 1.16\n");
    process.exit(1);
}

var rnaopt;
var dnafile;
if (process.argv[2] == "--rna") {
    if (process.argv.length < 4) {
        usage();
    }

    rnaopt = true;
    dnafile = process.argv[3];

} else {
    rnaopt = false;
    dnafile = process.argv[2];
}

var dnastack = [
    [null, "protein", 27, ""]
];

if (!rnaopt) {
    if (dnafile.slice(-4) == ".dna") {
        rnafile = dnafile.slice(0, -4) + ".rna";
    } else {
        rnafile = dnafile + ".rna";
    }
}
rnaln = 1;
linemap = [];

try {
    fs.unlinkSync(rnafile)
}
catch (e) {
}
rnawrite(PROLOGUE);
rnawrite('\n\n//-------------Begin-------------\n\n');

if (!rnaopt) {
    rnawrite('try {\n');
}

var eol = /\r?\n/;
var dirname = path.normalize(path.dirname(dnafile));
var file;
try {
    file = fs.readFileSync(dnafile, "utf8");
} catch (e) {
    process.stderr.write("The file \n'" + dnafile + "'\n doesn't exist.");
    process.exit(1);
}

var dotbase = 0;
var removed_ndots = -1;
var exec_files_to_clean = [];
dnastack.push([file.split(eol), dnafile, 0, dirname]);

while (dnastack.length > 1) {

    var line = dnastack.last()[0][0];
    dnastack.last()[0].shift();
    dnastack.last()[2] ++;

    if (dnastack.last()[0].length == 0) {
        dnastack.pop();
    }


    if (((line.length == 0) || (line[0] != ".")) && (dotbase == 0)) {
        rnawrite(line + '\n');
        continue;
    }

    if(line.indexOf("./!dots") == 0 ) {
        var ndots = parseInt(line.split("(")[1].split(")")[0]);
	if (isNaN(ndots)) {
            dnaerror("dots has been specified with a parameter that is not a number");
	}
	dotbase +=ndots;
	if(dotbase < 0) {
            dnaerror("dots command led to a negative dotbase");
	}
	if(dotbase != 0) {
	    var nndots = ndots + removed_ndots;
	    if (nndots != 0) {
                rnawrite('ribosome.dot("' + addslashes('./!dots(' + nndots + ')') + '",function(_expr){return eval(_expr);})\n');
	    }
	    removed_ndots = 0;
	} else {
	    if (ndots+1 != 0) {
                rnawrite('ribosome.dot("' + addslashes('./!dots(' + (ndots+1) + ')') + '",function(_expr){return eval(_expr);})\n');
	    }
	    removed_ndots = -1;
        }
        continue;
    }

    if(dotbase != 0) {
        rnawrite('ribosome.pass("' + addslashes(line) + '")\n');
    } else {
        line = line.slice(1);

        if (line.slice(-1) == "$") {
            line = line.slice(0, -1);
        }

        if (line.indexOf("\t") != -1) {
            dnaerror("tab found in the line, replace it by space");
        }

        var firsttwo = line.trim().slice(0, 2);

        if (firsttwo == "/+") {
            rnawrite("ribosome.add('" + addslashes((line + 'w').trim().slice(2, -1)) + "',function(_expr){return eval(_expr);});\n");
            continue;
        }

        if (firsttwo == "/=") {
            rnawrite("ribosome.align('" + addslashes((line + 'w').trim().slice(2, -1)) + "',function(_expr){return eval(_expr);});\n");
            continue;
        }

        if (firsttwo == "/!") {
            line = (line + 'w').trim().slice(2, -1);
            var match = line.match(/^[0-9A-Za-z_]+/);
            if (match == null) {
                dnaerror("/! should be followed by an identifier");
            }

            var command = match[0];

            if (["output", "append", "stdout", "tabsize"].indexOf(command) >= 0) {
                rnawrite("ribosome." + line + "\n");
                continue;
            }

            if (command == "separate") {
                var separator = line.match(/["'].*["']/);
                if (separator == null) {
                    dnaerror("Bad command syntax");
                }
                separator = separator[0].slice(1, -1);
                var cname = "___separate_" + rnaln + "___";
                rnawrite("var " + cname + " = true;\n");
                line = dnastack.last()[0][0];
                dnastack.last()[0].shift();
                dnastack.last()[2] += 1;
                if (line == null || line[0] == "." ||
                    (!line.indexOf("while") && !line.indexOf("for"))) {
                    dnaerror("'separate' command must be followed by a loop.");
                }

                rnawrite(line);
                rnawrite("\nif(" + cname + ") {\n")
                rnawrite("    " + cname + " = false;\n")
                rnawrite("} else {\n")
                rnawrite("    ribosome.add('" + addslashes(separator) + "',function(_expr){return eval(_expr);});\n")
                rnawrite("}\n")
                continue;

            }
            if (command == "include") {
                var filename = line.match(/["'].*["']/);
                if (filename == null) {
                    dnaerror("Bad command syntax");
                }
                filename = filename[0].slice(1, -1).trim();
                filename = path.normalize(path.join(dnastack.last()[3], filename));
                var dirname = path.dirname(filename);

                var file;
                try {
                    file = fs.readFileSync(filename, "utf8");
                } catch (e) {
                    dnaerror("File doesn't exist.");
                }
                dnastack.push([file.split(eol), filename, 0, dirname]);
                continue;
            }
	    if (command == "exec") {
                var filename = line.split(/["']/)[1];
                if (filename == null) {
                    dnaerror("Bad command syntax");
                }
                filename = filename.trim();
                filename = path.normalize(path.join(dnastack.last()[3], filename));
                var dirname = path.dirname(filename);
                 
                var args = line.match(/\[[^\[\]]*\]/g);
                if (args == null) {
                    dnaerror("Bad command syntax");
                }
	        var lfilename = "./" + filename;
		for( var i=0; i < args.length; i++) {
                    var largs = args[i].slice(1,-1).split(",");
                    
		    try {
                        execSync("protein " + lfilename + " " +  largs.join(" ") + " 1> " + "./" +filename + ".result."+i+".js.dna");
		    } catch(e) {
                        process.exit(-1);
		    }
		    try { 
		        fs.unlinkSync("./" + filename + ".result." + (i-1)+".js.dna");
		    } catch(e) {}
		    lfilename = "./" + filename + ".result." + i+".js.dna";
		}
                var file;
                try {
                    file = fs.readFileSync(lfilename, "utf8");
                } catch (e) {
                    dnaerror("File doesn't exist.");
                }
                exec_files_to_clean.push(lfilename);
                dnastack.push([file.split(eol), lfilename, 0, dirname]);
                continue;
	    }

            dnaerror("Unknown command " + command);

        }
        rnawrite('ribosome.dot("' + addslashes(line) + '",function(_expr){return eval(_expr);})\n');
    }
}


if (!rnaopt) {
    fs.appendFileSync(rnafile, "}catch(e){\n");

    fs.appendFileSync(rnafile, "var LINEMAP = [\n");
    var last = null;
    linemap.forEach(function(le) {
        if (last == null || le[1] != last[1] || le[0] - last[0] != le[2] - last[2]) {
            fs.appendFileSync(rnafile, "[" +
                le[0] + ",'" + addslashes(le[1]) + "'," + le[2] + "],\n");
            last = le;
        }
    });

    fs.appendFileSync(rnafile, "        [null]\n");
    fs.appendFileSync(rnafile, "    ];\n");
    fs.appendFileSync(rnafile, "ribosome.rethrow(e, LINEMAP);\n");


    fs.appendFileSync(rnafile, "}\n");

}

if (rnaopt) {
    process.stdout.write("ribosome.close();\n\n");
} else {
    fs.appendFileSync(rnafile, "ribosome.close();\n\n");
}

if (!rnaopt) {
    exec("node " + rnafile + " " + process.argv.slice(3).join(' '), function(error, stdout, stderr) {
        process.stdout.write(stdout);
        process.stdout.write(stderr);
        fs.unlinkSync(rnafile);
    });

}

//Clean DNA files that are created from the Exec command.
exec_files_to_clean.forEach(function(file_path){
    fs.unlinkSync(file_path);
});
