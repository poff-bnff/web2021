const fs = require('fs');

const JSONcopy = obj => JSON.parse(JSON.stringify(obj))

deleteFolderRecursive = path => {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

exports.deleteFolderRecursive = deleteFolderRecursive;
exports.JSONcopy = JSONcopy;
