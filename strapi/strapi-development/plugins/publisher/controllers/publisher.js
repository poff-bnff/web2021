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
];

/**
 * publisher.js controller

 *
 * @description: A set of functions called "actions" of the `publisher` plugin.
 */

const doBuild = async(site, userInfo) => {
  console.log("doBuild")
  let id
  // kontrollib kas fail on olemas?
  if (fs.existsSync("../build.sh")) {
    console.log("file exists")
    //annan .sh faili kaasa argumendid
    const args = [site];

    const child = spawn("../build.sh", args);

    id = await doLog(site, userInfo)
    console.log("id", id)

    child.stdout.on("data", async(chunk)  => {
      console.log(decoder.write(chunk));
      // data from the standard output is here as buffers
    });
    // since these are streams, you can pipe them elsewhere
    child.stderr.on("data", (chunk) => {
      console.log("err:", decoder.write(chunk));
      // data from the standard error is here as buffers
    });
    // child.stderr.pipe(child.stdout);
    child.on("close", async(code)  => {
      console.log(`child process exited with code ${code}`);
      // siin tahaksin saata alles ctx.send
      const logData = {"endTime": moment().tz("Europe/Tallinn").format()}
      strapi.entityService.update({params: {id: id,},data: logData},{ model: "plugins::publisher.build_logs" });
      // const result = await strapi.entityService.update({logData},{ model: "plugins::publisher.build_logs" })
      // console.log(result)
    });
  }
};


const doLog = async (site, userInfo) => {
  // strapi.generateTimestampCode
  // console.log("strapi timestamp",generateTimestampCode())
  const logData = {
    site: site,
    user: `${userInfo.firstname} ${userInfo.lastname}`,
    email: userInfo.email,
    startTime: moment().tz("Europe/Tallinn").format()
  };
  //using strapi method for creating and entry from the data that was sent
  const result = await strapi.entityService.create({data: logData},{ model: "plugins::publisher.build_logs" })
  console.log(result)
  return result.id
}





module.exports = {
  /**
   * Default action.
   *
   * @return {Object}
   */

  ///login buil-idest
  //

  index: async (ctx) => {
    // Add your own logic here.

    // Send 200 `ok`
    ctx.send({
      message: "ok",
    });
  },
  publish: async (ctx) => {
    const data = ctx.request.body;
    // console.log(data)
    const userInfo = JSON.parse(data.userInfo);
    const site = data.site;
    //kontrollin kas päringule lisati site
    if (!data.site) {
      return ctx.badRequest("no site");
    } else {
      // kas site on meie site'ide nimekirjas
      if (domains.includes(data.site)) {
        // console.log("leht on nimekirjas");
        //first log entry return the id of the log created
        // const id = await doLog(site, userInfo)
        // // log entry is should be used to update the entry with end time.
        // console.log("id", id)
        doBuild(site, userInfo)
        ctx.send({ message: `ok ${data.site}` });

      } else {
        return ctx.badRequest("site not found");
      }
    }
  },
};