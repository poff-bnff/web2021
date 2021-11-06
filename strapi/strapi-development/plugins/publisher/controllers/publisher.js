"use strict";
const { execFile, exec, spawn } = require("child_process");
const fs = require("fs");
const yaml = require('js-yaml')
const { StringDecoder } = require("string_decoder");
const decoder = new StringDecoder("utf8");
const moment = require("moment-timezone")
const { generateTimestampCode } = require('strapi-utils')

const { addS } = require('../services/publisher.js')

// let timestamp = strapi.generateTimestampCode
const domains = [
  "poff.ee",
  "justfilm.ee",
  "shorts.poff.ee",
  "industry.poff.ee",
  "kinoff.poff.ee",
  "hoff.ee",
  "kumu.poff.ee",
  "filmikool.poff.ee",
  "oyafond.ee",
  "tartuff.ee"
];

/**
 * publisher.js controller
 *
 * @description: A set of functions called "actions" of the `publisher` plugin.
 */

const doBuild = async (site, userInfo) => {
  // console.log("doBuild")
  let id
  // kontrollib kas fail on olemas?
  if (fs.existsSync("../../ssg/deploy.sh")) {
    // console.log("fail olemas")

    //kirjutab esimese logi kande

    let type = 'live'
    id = await doLog(site, userInfo, type)

    const child = spawn("bash", ["../../ssg/deploy.sh", site]);

    child.stdout.on("data", data => {
      console.log(`stdout ..............: ${data}`);
    });

    child.stderr.on("data", async (data) => {
      // console.log(`stderr: ${data}`);
      let error = decoder.write(data)
      const logData = { "build_errors": error }
      // const result = await strapi.entityService.update({params: {id: id,},data: logData},{ model: "plugins::publisher.build_logs" });
      // console.log("stderr result:", result)
    });

    child.on("close", async (code) => {
      console.log(`child process exited with code ${code}`);
      let logData = {}

      // switch (code) {
      //   case 0:
      //     logData = { "end_time": moment().tz("Europe/Tallinn").format(), "error_code": "-" }
      //     break;
      //   case 1:
      //     logData = { "end_time": moment().tz("Europe/Tallinn").format(), "error_code": "CD_ERROR" }
      //     break;
      //   case 2:
      //     logData = { "end_time": moment().tz("Europe/Tallinn").format(), "error_code": "NODE_ERROR" }
      //     break;
      //   case 23:
      //     logData = { "end_time": moment().tz("Europe/Tallinn").format(), "error_code": "NO_FILE_OR_DIR" }
      //     break;
      //   case 80:
      //     logData = { "end_time": moment().tz("Europe/Tallinn").format(), "error_code": "BUILDDIR_ERR" }
      //     break;
      //   case 81:
      //     logData = { "end_time": moment().tz("Europe/Tallinn").format(), "error_code": "BACKUP_ERR" }
      //     break;
      //   case 82:
      //     logData = { "end_time": moment().tz("Europe/Tallinn").format(), "error_code": "LIVE_REPLACE_ERR" }
      //     break;
      //   default:
      //     logData = { "end_time": moment().tz("Europe/Tallinn").format(), "error_code": `ERR_CODE_${code}` }
      // }
      // const result = await strapi.entityService.update({params: {id: id,},data: logData},{ model: "plugins::publisher.build_logs" });
      // console.log("close result:", result)

    });
  }
};


const doLog = async (site, userInfo, type) => {
  // console.log("......userinfo: ", userInfo)
  const logData = {
    site: site,
    admin_user: { id: userInfo.id },
    start_time: moment().tz("Europe/Tallinn").format(),
    type: type
  };
  //using strapi method for creating and entry from the data that was sent
  const result = await strapi.entityService.create({ data: logData }, { model: "plugins::publisher.build_logs" })
  // console.log(result)
  return result.id
}

async function doFullBuild(userInfo) {
  for (let i = 0; i < domains.length; i++) {

    let site = domains[i]
    let type = 'build all'
    let id = await doLog(site, userInfo, type)
    console.log(site, userInfo.id, type, id)

    if (fs.existsSync(`../../ssg/helpers/build_manager.js`)) {
      let args = [site, 'full', 'full']
      let build_dir = `../../ssg/helpers/build_manager.js`
      const child = spawn('node', [build_dir, args])

      let info = ''
      child.stdout.on("data", async (data) => {
        console.log(`info: ${info}`)
        info += 'info: ' + decoder.write(data)
        const logData = { "build_errors": info, "end_time": moment().tz("Europe/Tallinn").format() }
        // const result = await strapi.entityService.update({params: {id: id,},data: logData},{ model: "plugins::publisher.build_logs" });
        // console.log(result)
      });

      child.stderr.on("data", async (data) => {
        console.log(`error: ${data}`)
        let error = 'error' + decoder.write(data)
        const logData = { "build_errors": error, "end_time": moment().tz("Europe/Tallinn").format() }
        // const result = await strapi.entityService.update({params: {id: id,},data: logData},{ model: "plugins::publisher.build_logs" });
        // console.log("stderr result:", result)
      });

      child.on("close", async (code) => {
        console.log(`child process exited with code ${code}`);
        let logData = {}

        switch (code) {
          case 0:
            logData = { "end_time": moment().tz("Europe/Tallinn").format(), "error_code": "-" }
            break;
          case 1:
            logData = { "end_time": moment().tz("Europe/Tallinn").format(), "error_code": "ERROR" }
            break;
          default:
            logData = { "end_time": moment().tz("Europe/Tallinn").format(), "error_code": `ERR_CODE_${code}` }
        }
        // const result = await strapi.entityService.update({params: {id: id,},data: logData},{ model: "plugins::publisher.build_logs" });
        // console.log("close result:", result)

      });
      // }
    }
  }
}

async function doKillSwitch(userInfo, killStartTime) {
  const queuePath = `../../ssg/helpers/build_queue.yaml`
  const logPath = `../../ssg/helpers/build_logs.yaml`
  const killerScript = `../../ssg/kill_switch.sh`
  console.log('KILL SWITCH ACTIVATED!');
  if (userInfo) {
    if (fs.existsSync(queuePath)) {
      if (fs.existsSync(logPath)) {
        const logFile = yaml.load(fs.readFileSync(logPath, 'utf8'))
        const logFileStartedBuilds = logFile.filter(b => b.type === 'Build start')
        const lastBuild = logFileStartedBuilds[logFileStartedBuilds.length - 1]
        const lastBuildPID = lastBuild.type === 'Build start' ? lastBuild.PID : ''
        const userName = `${userInfo.firstname} ${userInfo.lastname}`

        console.log(`Killer: ${userName}. Killing last startedbuild: ${lastBuildPID}`)

        const child = spawn('bash', [killerScript, lastBuildPID])

        let info = ''
        return new Promise((resolve, reject) => {
          child.stdout.on("data", async (data) => {
            info += decoder.write(data)
          });

          child.stderr.on("data", async (data) => {
            console.log(`error: ${data}`)
            let error = 'error' + decoder.write(data)
            info += 'error: ' + decoder.write(error)
          });

          child.on("close", async (code) => {
            console.log(`child process exited with code ${code}`);

            if (code === 0) {
              let shortUserMessage = info
              console.log('shortUserMessage', shortUserMessage);
              shortUserMessage = shortUserMessage.replace(/SEPARATORSTART.*SEPARATOREND/, '')
              shortUserMessage = shortUserMessage.replace(/SEPARATORSTART/, '')
              shortUserMessage = shortUserMessage.replace(/SEPARATOREND/, '')

              let logMessageLong = info
              console.log('logMessageLong', logMessageLong);
              logMessageLong = logMessageLong.replace(/SEPARATORSTART/, '')
              logMessageLong = logMessageLong.replace(/SEPARATOREND/, '')

              const logKillData = {
                site: '-',
                admin_user: { id: userInfo.id },
                start_time: killStartTime,
                end_time: moment().tz("Europe/Tallinn").format(),
                type: 'KILL',
                build_stdout: logMessageLong,
                shown_to_user: true,
              };
              const result = await strapi.entityService.create({ data: logKillData }, { model: "plugins::publisher.build_logs" })

              resolve({ type: 'success', message: shortUserMessage })
            } else if (code === 1) {
              console.log(info);
              resolve({ type: 'warning', message: `Error code 1. ${info}` })
            } else {
              console.log(info);
              resolve({ type: 'warning', message: `Error code ${code}. ${info}` })
            }
          });
        });

      } else {
        console.log('No log file for PID');
        return { type: 'warning', message: 'Logifaili PID lugemiseks ei leitud' }
      }
    } else {
      console.log('No build queue');
      return { type: 'warning', message: 'Järjekorda ei eksisteeri' }
    }
  } else {
    console.log('No killer info');
    return { type: 'warning', message: 'Kasutaja info on puudulik' }
  }

}

module.exports = {
  /**
   * Default action.
   *
   * @return {Object}
   */
  publish: async (ctx) => {
    const data = ctx.request.body;
    // console.log(ctx)
    const userInfo = JSON.parse(data.userInfo);
    const site = data.site;
    //kontrollin kas päringule lisati site
    if (!data.site) {
      return ctx.badRequest("no site");
    } else {
      // kas site on meie site'ide nimekirjas
      if (domains.includes(data.site)) {

        await doBuild(site, userInfo)
        ctx.send({ buildSite: site, message: `${data.site} LIVE-i kopeeritud` });

      } else {
        return ctx.badRequest("site not found");
      }
    }
  },
  fullBuild: async (ctx) => {
    // console.log('ctx', ctx)
    console.log("starting full build")

    const data = ctx.request.body;
    const userInfo = JSON.parse(data.userInfo)

    await doFullBuild(userInfo)

  },
  killSwitch: async (ctx) => {
    // console.log('ctx', ctx)
    const killStartTime = moment().tz("Europe/Tallinn").format()
    console.log("Killing all!")

    const data = ctx.request.body;
    const userInfo = JSON.parse(data.userInfo)

    const killResult = await doKillSwitch(userInfo, killStartTime)
    ctx.send(killResult)

  },
  logs: async (ctx) => {

    // console.log ("...........MODEL:", await strapi.query( "build_logs", "publisher"))
    // console.log ("...........MODEL:", await strapi.query( "build_logs", "publisher").model)
    // console.log ("...........FIND:", await strapi.query( "build_logs", "publisher").find())
    //https://strapi.io/documentation/developer-docs/latest/concepts/services.html#core-services

    // console.log("ctx params:", ctx.params)

    //   find(params, populate) {
    //   return strapi.query('restaurant').find(params, populate);},
    // params (object): this represent filters for your find request.

    //   {"name": "Tokyo Sushi"} or {"_limit": 20, "name_contains": "sushi"} or { id_nin: [1], _start: 10 }
    // populate (array): you have to mention data you want populate a relation ["author", "author.name", "comment", "comment.content"]
    // const populate = ["site", "user", "startTime", "endTime", "errorCode"]

    // tagastab viimased 5 parameetrina kaasa antud lehe logi kannet
    //https://strapi.io/documentation/developer-docs/latest/concepts/queries.html#api-reference
    const params = { _limit: 5, site: ctx.params.site, _sort: 'id:desc' }

    const result = await strapi.query("build_logs", "publisher").find(params);

    return result

  },
  myFinishedBuildLogs: async (ctx) => {
    const params = {
      'admin_user.id': ctx.state.admin.id,
      end_time_null: false,
      shown_to_user: false,
      type: 'build'
    }
    let result = await strapi.query("build_logs", "publisher").find(params);
    (result.length > 0) ? result = await addS(result) : result = result
    return result

  },
  lastFailedBuildLogs: async (ctx) => {
    const params = {
      build_errors_null: false,
      type: 'build',
      _sort: 'id:desc'
    }
    let result = await strapi.query("build_logs", "publisher").find(params);
    (result.length > 0) ? result = await addS(result) : result = result
    return result

  },
  lastTwentyBuidFailsOfSite: async (ctx) => {
    const params = {
      build_errors_null: false,
      type: 'build',
      site: ctx.params.site,
      _limit: 20,
      _sort: 'id:desc',
    }
    let result = await strapi.query("build_logs", "publisher").find(params);
    result = result
      .map(r => {
        return {
          site: r.site,
          id: r.id,
          end_time: r.end_time,
          build_errors: r.build_errors
        }
      })
    return result

  },
  myStartedBuildLog: async (ctx) => {
    const params = {
      'admin_user.id': ctx.state.admin.id,
      type: 'build',
      _sort: 'id:desc'
    }

    let result = {}
    let sanitizedResult
    let tries = 0

    while (!result.in_queue && tries < 500) {
      result = await strapi.query("build_logs", "publisher").findOne(params);

      sanitizedResult = {
        queued_time: result.queued_time,
        build_est_duration: result.build_est_duration,
        queue_est_duration: result.queue_est_duration,
        in_queue: result.in_queue,
        site: result.site,
        build_args: result.build_args,
      }
      tries++
    }
    return sanitizedResult
  },
  onelog: async (ctx) => {

    const params = { id: ctx.params.id }

    const result = await strapi.query("build_logs", "publisher").findOne(params);
    if (result.admin_user) {
      result.admin_user = {
        firstname: result.admin_user.firstname || null,
        lastname: result.admin_user.lastname || null
      }
    }
    return result

  },
  lastBuildLogBySite: async (ctx) => {

    const params = {
      site: ctx.params.site,
      _sort: 'id:desc',
      type: 'build'
    }

    const result = await strapi.query("build_logs", "publisher").findOne(params);
    if (result.admin_user) {
      result.admin_user = {
        firstname: result.admin_user.firstname || null,
        lastname: result.admin_user.lastname || null
      }
    }
    return result

  },
  updatelog: async (ctx) => {

    const params = { id: ctx.params.id }

    const result = await strapi.query("build_logs", "publisher").update(
      { id: params.id }, ctx.request.body
    );
    if (result.admin_user) {
      result.admin_user = {
        firstname: result.admin_user.firstname || null,
        lastname: result.admin_user.lastname || null
      }
    }
    return result

  }
};





