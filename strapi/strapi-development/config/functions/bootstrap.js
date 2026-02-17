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
const logging = false

let recheckTimerVar = null

const setRecheckTimerFunction = () => {
  clearTimeout(recheckTimerVar)
  recheckTimerVar = setTimeout(() => {
    recheck()
  }, 30000)
}

function writeToZone(file_name) {

  const put_command = `echo put ${file_name} | ftp assets.poff.ee`;
  exec(put_command, (err, stdout, stderr) => {
    if (err) {
      logger("Add error:")
      logger(err)
      console.log('vsjo problema');
      return
    }
  })
}

function deleteFromZone(file_name) {
  const del_command = `echo delete ${file_name} | ftp assets.poff.ee`;
  exec(del_command, (err, stdout, stderr) => {
    if (err) {
      logger("Delete error:")
      logger(err)
      console.log('vsjo problema');
      return
    }
  })
}

function logger(content){
  if(logging){
    let logFile = '/srv/strapi/imgLog.txt'
    const d = new Date()
    let dateTime = d.toLocaleString("et-EE")
    fs.appendFileSync(logFile, dateTime + " : " + content + "\n\n")
  }
}

function recheck(){
  logger("\nRechecking")
  console.log('Rechecking')

  let fileData = { "files": [] }
  let file = '/srv/strapi/imgList.json'

  try {
    if (fs.existsSync(file)) {

      let readFile = fs.readFileSync(file)
      let fileJsonData = JSON.parse(readFile)
      fileData.files = fileJsonData?.files

      let serverFiles = fs.readdirSync('public/uploads')

      serverFiles.forEach(serverFile => {
        let serverFilePath = 'public/uploads/' + serverFile
        console.log(serverFilePath)
        if (!fileData.files.includes(serverFilePath)) {
          console.log("Adding:" + serverFile)
          logger("Adding:" + serverFile)
          fileData.files.push(serverFilePath)
          console.log(`adding ${serverFile} to zone`)
          writeToZone(serverFile)
          logger("Added!")
        }
      })

      console.log("\n\n------------!--------------\n\n")

      fileData.files.forEach(filePath => {
        if (!filePath.startsWith('public/uploads/thumbnail')) {
          let fileName = filePath.split('/')[2]
          if(fileName != '.gitkeep'){
            console.log(filePath)
            if(!serverFiles.includes(fileName)){
              console.log("Delete:" + fileName)
              logger("\nDelete:" + fileName)
              console.log(`File ${filePath} has been removed`)

              fileData.files.splice(fileData.files.indexOf(filePath), 1)

              console.log(`delete ${fileName} from zone `);
              deleteFromZone(fileName)
              logger("Deleted!")
            }
          }
        }
      })

      let data = JSON.stringify(fileData)
      fs.writeFileSync(file, data)

    }
  } catch (err) {
    console.log(err)
    logger(err)
  }
}

module.exports = () => {

  // ============================================================================
  // FIX: Mandrill Email Provider - Unhandled Promise Rejection
  // ============================================================================
  // The Mandrill provider (strapi-provider-email-mcmandrill) has a bug where
  // promise rejections escape when templates don't exist or API keys are invalid.
  // This wrapper catches all rejections and logs them properly.
  // ============================================================================
  
  let emailInProgress = null;
  
  // Global safety net for any unhandled rejections from Mandrill
  process.on('unhandledRejection', (reason, promise) => {
    if (emailInProgress && reason && typeof reason === 'object') {
      console.error('❌ EMAIL SEND FAILED (Caught unhandled rejection)');
      console.error('  To:', emailInProgress.to);
      console.error('  Template:', emailInProgress.template_name || 'N/A');
      console.error('  Error:', JSON.stringify(reason));
      emailInProgress = null;
      return; // Handled, don't crash
    }
    
    // For non-email rejections, log normally
    console.error('Unhandled Promise Rejection:', reason);
  });

  // Wrap the email provider's send method to catch rejections
  if (strapi.plugins?.email?.provider) {
    const originalSend = strapi.plugins.email.provider.send.bind(strapi.plugins.email.provider);
    
    strapi.plugins.email.provider.send = function(options, cb) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 EMAIL SEND TRIGGERED');
      console.log('  To:', options.to);
      console.log('  Template:', options.template_name || 'N/A');
      console.log('  Subject:', options.subject || 'N/A');
      console.log('  Timestamp:', new Date().toISOString());
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Wrap the original send in a new promise to catch rejections
      return new Promise((resolve, reject) => {
        try {
          originalSend(options, cb)
            .then(result => {
              console.log('✅ EMAIL SENT SUCCESSFULLY to:', options.to);
              resolve(result);
            })
            .catch(error => {
              console.error('❌ EMAIL SEND FAILED');
              console.error('  To:', options.to);
              console.error('  Error:', JSON.stringify(error));
              reject(error);
            });
        } catch (syncError) {
          console.error('❌ EMAIL SEND FAILED (sync error):', syncError);
          reject(syncError);
        }
      });
    };
    
    console.log('✓ Email provider wrapper installed - unhandled rejections will be caught');
  }

  // ============================================================================
  // File watching and build management (original bootstrap code)
  // ============================================================================

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
          logger("\nCatching:" + fileName)

          if (!fileData.files.includes(path)) {
            logger("Adding:" + fileName)
            fileData.files.push(path)
            let data = JSON.stringify(fileData)
            fs.writeFileSync(file, data)
            console.log(`adding ${fileName} to zone`)
            writeToZone(fileName)
            logger("Added!")
            setRecheckTimerFunction()
          }

        })

        .on('unlink', path => {
          if (!path.startsWith('public/uploads/thumbnail')) {
            let fileName = path.split('/')[2]
            logger("\nDelete:" + fileName)
            log(`File ${path} has been removed`)

            fileData.files.splice(fileData.files.indexOf(path), 1)
            let data = JSON.stringify(fileData)
            fs.writeFileSync(file, data)

            console.log(`delete ${fileName} from zone `);
            deleteFromZone(fileName)
            logger("Deleted!")
            setRecheckTimerFunction()
          }

        })

        .on('change', path => {
          logger("\nChange:" + path)
        })

        .on('error', error => {
          logger("\nError:" + error)
        })

        .on('raw', (event, path, details) => {
          logger("\nRaw: " + event + " " + path)
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

