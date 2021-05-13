const fs = require('fs');
const path = require('path');

const stylesFolder =  path.join(__dirname, '../source/_styles/');

fs.mkdirSync(stylesFolder, { recursive: true });

if (process.env['DOMAIN'] === 'justfilm.ee') {
    var stylesFolderSource = path.join(__dirname, '../source/_styles_templates/_styles_justfilm/');
} else if (process.env['DOMAIN'] === 'shorts.poff.ee') {
    var stylesFolderSource = path.join(__dirname, '../source/_styles_templates/_styles_shorts/');
} else if (process.env['DOMAIN'] === 'kinoff.poff.ee') {
    var stylesFolderSource = path.join(__dirname, '../source/_styles_templates/_styles_kinoff/');
} else if (process.env['DOMAIN'] === 'industry.poff.ee') {
    var stylesFolderSource = path.join(__dirname, '../source/_styles_templates/_styles_industry/');
} else if (process.env['DOMAIN'] === 'filmikool.poff.ee') {
    var stylesFolderSource = path.join(__dirname, '../source/_styles_templates/_styles_filmikool/');
} else if (process.env['DOMAIN'] === 'hoff.ee') {
    var stylesFolderSource = path.join(__dirname, '../source/_styles_templates/_styles_hoff/');
} else if (process.env['DOMAIN'] === 'kumu.poff.ee') {
    var stylesFolderSource = path.join(__dirname, '../source/_styles_templates/_styles_kumu/');
} else if (process.env['DOMAIN'] === 'tartuff.ee') {
    var stylesFolderSource = path.join(__dirname, '../source/_styles_templates/_styles_tartuff/');
} else if (process.env['DOMAIN'] === 'oyafond.ee') {
    var stylesFolderSource = path.join(__dirname, '../source/_styles_templates/_styles_bruno/');
}else {
    var stylesFolderSource = path.join(__dirname, '../source/_styles_templates/_styles_poff/');
}

deleteStyles(copyStyles);

function deleteStyles(callback) {
    fs.readdir(stylesFolder, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }

        //listing all files using forEach
        files.forEach(function (file) {
            fs.unlinkSync(`${stylesFolder}${file}`)
            console.log(`Deleted: ${stylesFolder}${file}`);
        });
    });
    callback();
}

function copyStyles() {
    fs.readdir(stylesFolderSource, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //listing all files using forEach
        files.forEach(function (file) {

            fs.copyFile(`${stylesFolderSource}${file}`, `${stylesFolder}${file}`, err=>{
                if(!err){
                    console.log(`Copied: ${file} from ${stylesFolderSource}`);
                }
            });
        });
    });
}
