"use strict";
const { execFile, exec, spawn } = require("child_process");
const fs = require("fs");
const { StringDecoder } = require("string_decoder");
const decoder = new StringDecoder("utf8");
const moment = require("moment-timezone")
const { generateTimestampCode } = require('strapi-utils')

// let timestamp = strapi.generateTimestampCode
const domains = [
  // "poff.ee",
  // "justfilm.ee",
  // "shorts.poff.ee",
  // "industry.poff.ee",
  // "kinoff.poff.ee",
  "hoff.ee",
  // "kumu.poff.ee",
  // "filmikool.poff.ee",
  // "oyafond.ee",
  // "tartuff.ee"
];

/**
 * publisher.js controller
 *
 * @description: A set of functions called "actions" of the `publisher` plugin.
 */

const doBuild = async(site, userInfo) => {
  // console.log("doBuild")
  let id
  // kontrollib kas fail on olemas?
  if (fs.existsSync("../../ssg/deploy.sh")) {
    // console.log("fail olemas")

    //kirjutab esimese logi kande

    let type = 'deploy'
    id = await doLog(site, userInfo, type)

    const child = spawn("bash", ["../../ssg/deploy.sh", site]);

    child.stdout.on("data", data => {
        console.log(`stdout ..............: ${data}`);
    });

    child.stderr.on("data", async(data) => {
        // console.log(`stderr: ${data}`);
        let error = decoder.write(data)
        const logData = {"build_errors": error}
        const result = await strapi.entityService.update({params: {id: id,},data: logData},{ model: "plugins::publisher.build_logs" });
        // console.log("stderr result:", result)
    });

    child.on("close", async(code)=> {
      console.log(`child process exited with code ${code}`);
      let logData = {}

      switch(code) {
        case 0:
          logData = {"end_time": moment().tz("Europe/Tallinn").format(), "error_code": "-"}
          break;
        case 1:
          logData = {"end_time": moment().tz("Europe/Tallinn").format(), "error_code": "CD_ERROR"}
          break;
        case 2:
          logData = {"end_time": moment().tz("Europe/Tallinn").format(), "error_code": "NODE_ERROR"}
          break;
        case 23:
          logData = {"end_time": moment().tz("Europe/Tallinn").format(), "error_code": "NO_FILE_OR_DIR"}
          break;
        case 80:
          logData = {"end_time": moment().tz("Europe/Tallinn").format(), "error_code": "BUILDDIR_ERR"}
          break;
        case 81:
          logData = {"end_time": moment().tz("Europe/Tallinn").format(), "error_code": "BACKUP_ERR"}
          break;
        case 82:
          logData = {"end_time": moment().tz("Europe/Tallinn").format(), "error_code": "LIVE_REPLACE_ERR"}
          break;
        default:
          logData = {"end_time": moment().tz("Europe/Tallinn").format(), "error_code": `ERR_CODE_${code}`}
      }
      const result = await strapi.entityService.update({params: {id: id,},data: logData},{ model: "plugins::publisher.build_logs" });
      // console.log("close result:", result)

    });
  }
};


const doLog = async (site, userInfo, type) => {
  // console.log("......userinfo: ", userInfo)
  const logData = {
    site: site,
    admin_user: {id: userInfo.id},
    start_time: moment().tz("Europe/Tallinn").format(),
    type: type
  };
  //using strapi method for creating and entry from the data that was sent
  const result = await strapi.entityService.create({data: logData},{ model: "plugins::publisher.build_logs" })
  // console.log(result)
  return result.id
}

// const mapping = {
//   "poff.ee": 'poff',
//   "justfilm.ee": 'just',
//   "shorts.poff.ee": 'shorts',
//   "industry.poff.ee": 'industry',
//   "kinoff.poff.ee": 'kinoff',
//   "hoff.ee": 'hoff',
//   "kumu.poff.ee": 'kumu',
//   "filmikool.poff.ee": 'filmikool',
//   "oyafond.ee": 'bruno',
//   "tartuff.ee": 'tartuff'
// }

// async function do_build(id, site) {

// }

async function doFullBuild(userInfo) {
  for (let i = 0; i < domains.length; i++){
  //     // console.log("doBuild")
    let site = domains[i]
    let type = 'full build'
    let id = await doLog(site, userInfo, type)

    if (fs.existsSync(`../../ssg/helpers/build_manager.js`)) {
      // for (let site in domains) {
        // const child = spawn(`../../ssg/build_${domain}.sh`, [site, 'full']);
        let args = [site, 'full', 'full']
        let build_dir = `../../ssg/helpers/build_manager.js`
        const child = spawn('node', [build_dir, args])

        child.stdout.on("data", data => {
            console.log(`stdout ..............: ${data}`);
        });

        child.stderr.on("data", async(data) => {
            // console.log(`stderr: ${data}`);
            let error = decoder.write(data)
            const logData = {"build_errors": error}
            const result = await strapi.entityService.update({params: {id: id,},data: logData},{ model: "plugins::publisher.build_logs" });
            // console.log("stderr result:", result)
        });

        child.on("close", async(code)=> {
          console.log(`child process exited with code ${code}`);
          let logData = {}

          switch(code) {
            case 0:
              logData = {"end_time": moment().tz("Europe/Tallinn").format(), "error_code": "-"}
              break;
            case 1:
              logData = {"end_time": moment().tz("Europe/Tallinn").format(), "error_code": "ERROR"}
              break;
            default:
              logData = {"end_time": moment().tz("Europe/Tallinn").format(), "error_code": `ERR_CODE_${code}`}
          }
          const result = await strapi.entityService.update({params: {id: id,},data: logData},{ model: "plugins::publisher.build_logs" });
          // console.log("close result:", result)

        });
      // }
    }
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
        ctx.send({ message: `${data.site} LIVE-i kopeeritud` });

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
    
    ctx.send({ message: "full build started" })
    await doFullBuild(userInfo)

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
    const params = {_limit: 5, site: ctx.params.site, _sort: 'id:desc' }

    const result = await strapi.query( "build_logs", "publisher").find(params);

    return result

  }
};





