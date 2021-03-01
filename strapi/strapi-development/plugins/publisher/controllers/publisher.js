"use strict";
const { execFile, exec, spawn } = require("child_process");
const fs = require("fs");
const { StringDecoder } = require("string_decoder");
const decoder = new StringDecoder("utf8");
const moment = require("moment-timezone")
const { generateTimestampCode } = require('strapi-utils')

// let timestamp = strapi.generateTimestampCode
const domains = [
  "poff.ee",
  "justfilm.ee",
  "shorts.poff.ee",
  "industry.poff.ee",
  "kinoff.poff.ee",
  "hoff.ee",
  "kumu.poff.ee",
  "filmikool.poff.ee"
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
    id = await doLog(site, userInfo)

    const child = spawn("../../ssg/deploy.sh", [site]);

    child.stdout.on("data", data => {
        console.log(`stdout: ${data}`);
    });

    child.stderr.on("data", async(data) => {
        // console.log(`stderr: ${data}`);
        let error = decoder.write(data)
        const logData = {"buildErrors": error}
        const result = await strapi.entityService.update({params: {id: id,},data: logData},{ model: "plugins::publisher.build_logs" });
        // console.log("stderr result:", result)
    });

    child.on("close", async(code)=> {
      console.log(`child process exited with code ${code}`);
      let logData = {}

      switch(code) {
        case 0:
          logData = {"endTime": moment().tz("Europe/Tallinn").format(), "errorCode": "-"}
          break;
        case 1:
          logData = {"endTime": moment().tz("Europe/Tallinn").format(), "errorCode": "CD_ERROR"}
          break;
        case 2:
          logData = {"endTime": moment().tz("Europe/Tallinn").format(), "errorCode": "NODE_ERROR"}
          break;
        case 23:
          logData = {"endTime": moment().tz("Europe/Tallinn").format(), "errorCode": "NO_FILE_OR_DIR"}
          break;
        default:
          logData = {"endTime": moment().tz("Europe/Tallinn").format(), "errorCode": `ERR_CODE_${code}`}
      }
      const result = await strapi.entityService.update({params: {id: id,},data: logData},{ model: "plugins::publisher.build_logs" });
      // console.log("close result:", result)

    });
  }
};


const doLog = async (site, userInfo) => {
  // console.log("......userinfo: ", userInfo)
  const logData = {
    site: site,
    user: `${userInfo.firstname} ${userInfo.lastname}`,
    email: userInfo.email,
    startTime: moment().tz("Europe/Tallinn").format()
  };
  //using strapi method for creating and entry from the data that was sent
  const result = await strapi.entityService.create({data: logData},{ model: "plugins::publisher.build_logs" })
  // console.log(result)
  return result.id
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
  logs: async (ctx) => {

  // console.log ("...........MODEL:", await strapi.query( "build_logs", "publisher"))
  // console.log ("...........MODEL:", await strapi.query( "build_logs", "publisher").model)
  // console.log ("...........FIND:", await strapi.query( "build_logs", "publisher").find())
//https://strapi.io/documentation/developer-docs/latest/concepts/services.html#core-services
    console.log("ctx params:", ctx.params)

  //   find(params, populate) {
  //   return strapi.query('restaurant').find(params, populate);},
  // params (object): this represent filters for your find request.

  //   {"name": "Tokyo Sushi"} or {"_limit": 20, "name_contains": "sushi"} or { id_nin: [1], _start: 10 }
  // populate (array): you have to mention data you want populate a relation ["author", "author.name", "comment", "comment.content"]
    // const populate = ["site", "user", "startTime", "endTime", "errorCode"]

// tagastab viimased 5 parameetrina kaasa antud lehe logi kannet
    const params = {"_limit": 5, "site": ctx.params.site }

    const result = await strapi.query( "build_logs", "publisher").find(params);

    return result


    // ctx.send({
    //   message: "ok on logs",
    // });

  }
};





