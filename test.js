var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

var nPassed = 0;
var nFailed = 0;

var cpath = "./tests";
var files = fs.readdirSync(cpath);

files.forEach(function(file_name, index, files) {
    var stat = fs.statSync(cpath + "/" + file_name);

    if (stat.isFile()) {
        if (path.extname(file_name) == ".check") {
            exec("protein " + cpath + "/" + file_name.slice(0,-6) + ".js.dna" , function(error, stdout, stderr) {
                var result = stdout;
                var check = fs.readFileSync(cpath + "/" + file_name);
                if (check != result) {
                    process.stdout.write(file_name.substring(0, file_name.length - 6) + ' test FAILED\n');
                    nFailed++;
                } else {
                    process.stdout.write(file_name.substring(0, file_name.length - 6) + ' test PASSED\n');
                    nPassed++;
                }
            });
        }
    }
});
