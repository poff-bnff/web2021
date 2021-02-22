"use strict";
const { execFile, exec, spawn } = require("child_process");
const fs = require("fs");
const { StringDecoder } = require("string_decoder");
const decoder = new StringDecoder("utf8");
const moment = require("moment-timezone")
const { generateTimestampCode } = require('strapi-utils')

const domains = [
  "poff.ee",
  "justfilm.ee",
  "shorts.poff.ee",
  "industry.poff.ee",
  "kinoff.poff.ee",
  "hoff.ee",
];

let timestamp = strapi.generateTimestampCode


const now = moment().tz("Europe/Tallinn").format();

/**
 * publisher.js controller

 *
 * @description: A set of functions called "actions" of the `publisher` plugin.
 */

const doBuild = async(site, userInfo) => {
  // console.log("doBuild started ")
  if (fs.existsSync("../build.sh")) {
    // console.log("building" + site)
    const args = [site];

    const child = spawn("../../ssg/deploytest.sh", args);

    const id = await doLog(site, userInfo)
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
      // const end = moment().tz("Europe/Tallinn").format();
      // const logData = {"id": id, "endTime": end}
      // const result = await strapi.entityService.update({logData},{ model: "plugins::publisher.build_logs" })
      // console.log(result)
    });
  }
};


const doLog = async (site, userInfo) => {
  console.log(timestamp)
  const data = {
    site: site,
    user: `${userInfo.firstname} ${userInfo.lastname}`,
    email: userInfo.email,
    startTime: now
  };
  const result = await strapi.entityService.create({data},{ model: "plugins::publisher.build_logs" })
  //using strapi method for creating and entry from the data that was sent
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
    // console.log(user)
    // console.log(ctx.request)
    if (!data.site) {
      return ctx.badRequest("no site");
    } else {
      if (domains.includes(data.site)) {
        console.log("leht on nimekirjas");
        doLog(site, userInfo)
        // const id = await doLog(site, userInfo)
        // console.log("id", id)
        await doBuild(site, userInfo)
        ctx.send({ message: `ok ${data.site}` });

      } else {
        return ctx.badRequest("site not found");
      }
    }
  },
};