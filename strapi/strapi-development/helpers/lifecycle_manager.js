
const {
    StringDecoder
} = require('string_decoder')
const decoder = new StringDecoder('utf8')

const {
    execFile,
    exec,
    spawn
} = require('child_process')

const fs = require('fs')
const yaml = require('yaml')
const path = require('path')
const moment = require("moment-timezone")

async function call_update(result, model) {
    delete result.published_at
    await strapi.query(model).update({id: result.id}, result)
}

async function build_start_to_strapi_logs(result, domain, err=null ) {
    let editor = result.updated_by.id
    let plugin_log
    if (result.updated_by) {

        let loggerData = {
            start_time: moment().tz('Europe/Tallinn').format(), // moment().tz('Europe/Tallinn')
            admin_user: {
                id: editor
            },
            site: domain,
            error_code: err
        }

        plugin_log = await strapi.entityService.create({data: loggerData}, {model: "plugins::publisher.build_logs"})
        // console.log('Sinu palutud v4ljaprint', plugin_log)
    }
    return plugin_log
}

async function update_strapi_logs(plugin_log) {
    let id = plugin_log.id
    delete plugin_log.id
    await strapi.entityService.update({params: {id: id,}, data: plugin_log}, {model: "plugins::publisher.build_logs" })
}

async function call_build(build_dir, plugin_log, args) {

    const child = spawn(build_dir, args)

    child.stdout.on('data', (chunk) => {
        console.log(decoder.write(chunk))
        // data from the standard output is here as buffers
    });
    // since these are streams, you can pipe them elsewhere
    child.stderr.on('data', (chunk) => {
        console.log('err:', decoder.write(chunk))
        plugin_log.build_errors = decoder.write(chunk)
        plugin_log.end_time = moment().format()
        update_strapi_logs(plugin_log)
        // data from the standard error is here as buffers
    });
    // child.stderr.pipe(child.stdout);
    child.on('close', (code) => {
        console.log(`child process exited with code ${code}`)
        switch (code) {
            case 0:
                plugin_log.end_time = moment().tz("Europe/Tallinn").format()
                plugin_log.error_code = "-"
                break;
            case 83:
                plugin_log.end_time = moment().tz("Europe/Tallinn").format()
                plugin_log.error_code = "TestERROR"
                break;
            default:
                plugin_log.end_time = moment().tz("Europe/Tallinn").format()
                plugin_log.error_code = `ERR_CODE_${code}`
        }
        // console.log(plugin_log)
        update_strapi_logs(plugin_log)
    });
}

// async function get_build_params(name) {
//     const q_answer = await strapi.query(name).model.info.name
//     const param = q_answer.split('_').slice(-1)[0].toLowerCase()
//     return param
// }

async function do_query(model, params) {
    let obj_to_return = []
    for (let param of params) {
        let query_answer = await strapi.query(model).find({ id : param.id })
        obj_to_return.push(query_answer)
    }
    return obj_to_return
}

async function get_domain(result) {
    let domain = []
    if (result.domain) {
        domain.push(result.domain.url)
    }
    else if (result.domains) {
        for (let dom of result.domains) {
            domain.push(dom.url)
        }
    }
    else if (result.festival_edition) {
        let query_answer = await strapi.query('festival-edition').find({ id : result.festival_edition.id })
        for (let dom of query_answer[0].domains) {
            domain.push(dom.url)
        }
    }
    else if (result.festival_editions) {
        let festival_eds = await do_query('festival-edition', result.festival_editions)
        console.log(festival_eds)
        for (let festival_ed of festival_eds) {
            for (let dom of festival_ed[0].domains) {
                domain.push(dom.url)
            }
        }
    }
    else if (result.programmes) {
        let query_answers = await do_query('programme', result.programmes)
        console.log(query_answers)
        for (let query_answer of query_answers) {
            for (let dom of query_answer[0].domains) {
                domain.push(dom.url)
            }
        }
    }
    return domain
}

const mapping_domain = {
    'filmikool.poff.ee': 'filmikool',
    'hoff.ee': 'hoff',
    'industry.poff.ee': 'industry',
    'justfilm.ee': 'just',
    'kinoff.poff.ee': 'kinoff',
    'kumu.poff.ee': 'kumu',
    'oyafond.ee': 'bruno',
    'poff.ee': 'poff',
    'shorts.poff.ee': 'shorts',
    'tartuff.ee': 'tartuff'
}

function get_build_script(domain) {
    let short_domain = mapping_domain[domain]
    let dir_to_build = path.join(__dirname,`/../../../../../ssg/buildtest.sh`)
    // let dir_to_build = `/srv/ssg/build_${short_domain}.sh`
    return dir_to_build
}

exports.call_update = call_update
exports.build_start_to_strapi_logs = build_start_to_strapi_logs
exports.call_build = call_build
exports.get_domain = get_domain
exports.get_build_script = get_build_script
// exports.get_build_params = get_build_params
exports.update_strapi_logs = update_strapi_logs

