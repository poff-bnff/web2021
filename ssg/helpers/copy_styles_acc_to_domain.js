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
} else if (process.env['DOMAIN'] === 'discoverycampus.poff.ee') {
    var stylesFolderSource = path.join(__dirname, '../source/_styles_templates/_styles_discamp/');
}else {
    var stylesFolderSource = path.join(__dirname, '../source/_styles_templates/_styles_poff/');
}


    const deleteFiles = (folder) => {
        return new Promise((resolve, reject) => {
            fs.readdir(folder, function (err, files) {
                if (err) {
                    return reject('Unable to scan directory: ' + err);
                }

                files.forEach(function (file) {
                    fs.unlinkSync(`${folder}${file}`);
                    console.log(`Deleted: ${folder}${file}`);
                });

                resolve();
            });
        });
    };

    const copyFiles = (sourceFolder, targetFolder) => {
        return new Promise((resolve, reject) => {
            fs.readdir(sourceFolder, function (err, files) {
                if (err) {
                    return reject('Unable to scan directory: ' + err);
                }

                files.forEach(function (file) {
                    fs.copyFile(`${sourceFolder}${file}`, `${targetFolder}${file}`, err => {
                        if (!err) {
                            console.log(`Copied: ${file} from ${sourceFolder}`);
                        }
                    });
                });

                resolve();
            });
        });
    };

    (async () => {
        try {
            await deleteFiles(stylesFolder);
            await copyFiles(stylesFolderSource, stylesFolder);
        } catch (error) {
            console.error(error);
        }
    })();
