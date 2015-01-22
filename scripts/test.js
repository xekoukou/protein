var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

var cpath = "./tests";
var files = fs.readdirSync(cpath);

process.stdout.write("Failed tests:\n\n");

files.forEach(function(file_name, index, files) {
    var stat = fs.statSync(cpath + "/" + file_name);

    if (stat.isFile()) {
        if (path.extname(file_name) == ".dna") {
            exec("protein " + cpath + "/" + file_name, function(error, stdout, stderr) {
                var result = stdout;
                var check = fs.readFileSync(cpath + "/" + file_name.substring(0, file_name.length - 4) + ".check");
                if (check != result) {
                    process.stdout.write(file_name.substring(0, file_name.length - 4) + ' test FAILED\n');
}
            });
        }
    }
});
