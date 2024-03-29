'use strict';
/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/v3.x/concepts/configurations.html#bootstrap
 */

const chokidar = require('chokidar');
const fs = require('fs')
const { exec, execSync, spawn } = require('child_process');
const { StringDecoder } = require('string_decoder')
const decoder = new StringDecoder('utf8')
const path = require('path')



function writeToZone(file_name) {

  const put_command = `echo put ${file_name} | ftp assets.poff.ee`;
  exec(put_command, (err, stdout, stderr) => {
    if (err) {
      console.log('vsjo problema');
      return
    }
    // the *entire* stdout and stderr (buffered)
    // console.log(`stdout: ${stdout}`)
    // console.log(`stderr: ${stderr}`)
  })
}

function deleteFromZone(file_name) {
  const del_command = `echo delete ${file_name} | ftp assets.poff.ee`;
  exec(del_command, (err, stdout, stderr) => {
    if (err) {
      console.log('vsjo problema');
      return
    }
    // the *entire* stdout and stderr (buffered)
    // console.log(`stdout: ${stdout}`)
    // console.log(`stderr: ${stderr}`)
  })
}


module.exports = () => {

  let fileData = { "files": [] }
  let file = '/srv/strapi/imgList.json'

  try {
    if (fs.existsSync(file)) {

      let readFile = fs.readFileSync(file)
      let fileJsonData = JSON.parse(readFile)
      fileData.files = fileJsonData?.files

      // Initialize watcher.
      const watcher = chokidar.watch('public/uploads', {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInital: true
      });

      // Something to use when events are received.
      const log = console.log.bind(console);
      // Add event listeners.
      watcher
        .on('add', path => {

          let fileName = path.split('/')[2]
          // log(`file -> ${fileName} with path ${path} has been added`)

          if (!fileData.files.includes(path)) {

            fileData.files.push(path)
            let data = JSON.stringify(fileData)
            fs.writeFileSync(file, data)
            console.log(`adding ${fileName} to zone`)
            writeToZone(fileName)
          }

        })

        .on('unlink', path => {

          if (!path.startsWith('public/uploads/thumbnail')) {
            let fileName = path.split('/')[2]
            log(`File ${path} has been removed`)

            fileData.files.splice(fileData.files.indexOf(path), 1)
            let data = JSON.stringify(fileData)
            fs.writeFileSync(file, data)

            console.log(`delete ${fileName} from zone `);
            deleteFromZone(fileName)

          }

        })
    }
  } catch (err) {
    console.log(file, 'does not exist');
  }
  // If build queue exists, restart build manager to continue with the queue
  let build_manager_path = path.join(__dirname, `/../../../../ssg/helpers/build_manager.js`)
  console.log(build_manager_path)
  const child = spawn('node', [build_manager_path, 'forcewithdelay'])

  child.stdout.on('data', (chunk) => {
    console.log('stdout', decoder.write(chunk))
  });
}

