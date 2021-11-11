
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
const os = require('os')

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

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

async function call_update(result, model) {
  if (result.published_at) {
    delete result.published_at
  }
  await strapi.query(model).update({ id: result.id }, result)
}

async function build_start_to_strapi_logs(result, domain, err = null, b_err = null, model_and_target = null, del) {
  let editor = result.updated_by?.id || 48
  let plugin_log

  let loggerData = {
    queued_time: moment().tz('Europe/Tallinn').format(), // moment().tz('Europe/Tallinn')
    admin_user: {
      id: editor
    },
    type: 'build',
    site: domain,
    error_code: err,
    build_errors: b_err,
    build_args: model_and_target,
    action: del ? 'delete' : 'new or edit'
  }

  plugin_log = await strapi.entityService.create({ data: loggerData }, { model: "plugins::publisher.build_logs" })
  // console.log('Sinu palutud v4ljaprint', plugin_log)
  return plugin_log
}

async function update_strapi_logs(plugin_log, id) {
  await strapi.entityService.update({ params: { id: id, }, data: plugin_log }, { model: "plugins::publisher.build_logs" })
}

async function call_process(build_dir, plugin_log, args) {
  const child = spawn('node', [build_dir, args])
  console.log(child.pid, 'blablaaaa');
  os.setPriority(child.pid, 10)
  const id = plugin_log.id

  let data = "";
  child.stdout.on('data', (chunk) => {
    console.log('stdout', decoder.write(chunk))
    data += 'info: ' + decoder.write(chunk)
    plugin_log.build_errors = data
    plugin_log.end_time = moment().tz("Europe/Tallinn").format()
    delete plugin_log.id
    // update_strapi_logs(plugin_log, id)
    // data from the standard output is here as buffers
  });
  // since these are streams, you can pipe them elsewhere
  child.stderr.on('data', (chunk) => {
    console.log('err:', decoder.write(chunk))
    plugin_log.build_errors = 'error: ' + decoder.write(chunk)
    plugin_log.end_time = moment().tz("Europe/Tallinn").format()
    delete plugin_log.id
    // update_strapi_logs(plugin_log, id)
    // data from the standard error is here as buffers
  });
  // child.stderr.pipe(child.stdout);
  child.on('close', (code) => {
    // console.log(`child process exited with code ${code}`)
    switch (code) {
      case 0:
        plugin_log.end_time = moment().tz("Europe/Tallinn").format()
        plugin_log.error_code = "-"
        break;
      // case 83:
      //     plugin_log.end_time = moment().tz("Europe/Tallinn").format()
      //     plugin_log.error_code = "TestERROR"
      //     break;
      default:
        plugin_log.end_time = moment().tz("Europe/Tallinn").format()
        plugin_log.error_code = `ERR_CODE_${code}`
    }
    delete plugin_log.id
    // update_strapi_logs(plugin_log, id)
  });
}

async function do_query(model, params) {
  let obj_to_return = []
  for (let param of params) {
    let query_answer = await strapi.query(model).find({ id: param.id })
    obj_to_return.push(query_answer)
  }
  return obj_to_return
}

async function get_domain(result) {
  let domain = []

  if (Array.isArray(result)) {
    result = result[0]
  }
  if (result.domain) {
    domain.push(result.domain.url)
  }
  else if (result.domains) {
    for (let dom of result.domains) {
      domain.push(dom.url)
    }
  }
  else if (result.festival_edition) {
    let query_answer = await strapi.query('festival-edition').find({ id: result.festival_edition.id })
    for (let dom of query_answer[0].domains) {
      domain.push(dom.url)
    }
  }
  else if (result.festival_editions) {
    let festival_eds = await do_query('festival-edition', result.festival_editions)
    for (let festival_ed of festival_eds) {
      for (let dom of festival_ed[0].domains) {
        domain.push(dom.url)
      }
    }
  }
  else if (result.programmes) {
    let query_answers = await do_query('programme', result.programmes)
    for (let query_answer of query_answers) {
      for (let dom of query_answer[0].domains) {
        domain.push(dom.url)
      }
    }
  }
  else if (result.cassette) {
    let query_answer = await strapi.query('cassette').find({ id: result.cassette.id })
    for (let festival_e of query_answer[0].festival_editions) {
      let q_answer = await strapi.query('festival-edition').find({ id: festival_e.id })
      for (let dom of q_answer[0].domains) {
        domain.push(dom.url)
      }
    }
  }
  // New set to eliminate duplicate domains
  return [...new Set(domain)]
}

function get_programme_out_of_cassette(result) {
  let tags = result.tags.programmes
  let programme_id = []
  for (let prog of tags) {
    programme_id.push(prog.id)
  }
  return programme_id
}

function get_build_script(domain) {
  let short_domain = mapping_domain[domain]
  if (short_domain) {
    let dir_to_build = path.join(__dirname, `/../../../ssg/helpers/build_manager.js`)
    return dir_to_build
  } else {
    console.log('No build script provided for', domain.toUpperCase(), 'or this domain is built through Slack.')
    return null
  }
}

function clean_result(result) {
  if (result.created_by) {
    delete result.created_by.username
    delete result.created_by.password
    delete result.created_by.resetPasswordToken
    delete result.created_by.registrationToken
    delete result.created_by.isActive
    delete result.created_by.blocked
  }
  if (result.updated_by) {
    delete result.updated_by.username
    delete result.updated_by.password
    delete result.updated_by.resetPasswordToken
    delete result.updated_by.registrationToken
    delete result.updated_by.isActive
    delete result.updated_by.blocked
  }

  for (let element in result) {
    if (element === "updated_by" || element === "created_by") {
      continue
    }

    if (result[element] === null) {
      delete result[element]
    }

    // if (typeof result[element] === 'object') {
    //     let date = (result[element] instanceof Date)
    //     if (Array.isArray(result[element]) && !date ) {
    //         let list_elem = []
    //         for (let elem of result[element]) {
    //             list_elem.push({"id": elem.id})
    //         }
    //         result[element] = list_elem
    //         if (result[element].length < 1) {
    //             delete result[element]
    //         }
    //     }
    //     else if (!date) {
    //         result[element] = {"id": result[element].id}
    //     }
    // }
  }
  return result
}


async function modify_stapi_data(result, model_name, vanish = false) {
  const modelsToBeSkipped = ['users-persons']
  if (modelsToBeSkipped.includes(model_name)) { return }

  let modelname = await strapi.query(model_name).model.info.name
  modelname = modelname.split('_').join('')
  let result_id = result.id ? result.id : null
  console.log(modelname, 'id:', result_id, ' by:', result.updated_by?.firstname || null, result.updated_by?.lastname || null)
  result = clean_result(result)

  const strapidata_dir = path.join(__dirname, '..', '..', '..', 'ssg', 'source', '_allStrapidata', `${modelname}.yaml`)
  let strapidata = yaml.parse(fs.readFileSync(strapidata_dir, 'utf8'), { maxAliasCount: -1 })

  let list_of_models = []
  for (let singel_model in strapidata) {
    list_of_models.push(strapidata[singel_model].id)
    if (vanish && strapidata[singel_model].id === result.id) {
      delete strapidata[singel_model]
      break
    }
    else if (strapidata[singel_model].id === result.id) {
      strapidata[singel_model] = result
      break
    }
  }

  if (!list_of_models.includes(result.id)) {
    strapidata.push(result)
  }

  fs.writeFileSync(strapidata_dir, yaml.stringify(strapidata.filter(e => e !== null), { indent: 4 }), 'utf8')
}

async function call_build(result, domains, model_name, del = false) {
  // here to skip specific model builds
  if (model_name === 'industry-project' || model_name === 'industry-event' || model_name === 'industry-person') {
    return
  }
  let build_error
  if (domains[0] === 'FULL_BUILD') {
    let error = 'FULL BUILD'
    console.log('-------------', error, '-------------')
    build_error = 'Creating/updating this object needs all domain sites to rebuild.'
    await build_start_to_strapi_logs(result, 'All domains', error, build_error, `${model_name} ${result.id}`, del)
  }
  else if (domains.length > 0) {
    console.log('Build ', domains)
    for (let domain of domains) {
      let build_dir = get_build_script(domain)
      if (fs.existsSync(build_dir)) {
        let plugin_log = await build_start_to_strapi_logs(result, domain, null, null, `${model_name} ${result.id}`, del)
        let plugin_log_id = plugin_log.id
        let args = [domain, plugin_log_id, model_name, "target", result.id]

        // erand screeningule, kaasa viienda argumendina objektiga seotud kasseti id
        if (result.cassette && model_name === 'screening') {
          args = [domain, plugin_log_id, model_name, "target", result.id, result.cassette.id]
        }
        // erand cassette, kaasa viienda argumendina kassetiga seotud programmi id'd [list]
        if (result.tags && model_name === 'cassette') {
          let prog_args = get_programme_out_of_cassette(result)
          args = [domain, plugin_log_id, model_name, "target", result.id, prog_args.join(' ')]
        }

        if (del) {
          args = [domain, plugin_log_id, model_name, "target"]
        }
        await call_process(build_dir, plugin_log, args)
      }
      // else {
      //     plugin_log.end_time = moment().tz("Europe/Tallinn").format()
      //     plugin_log.error_code = `NO_BUILD_SCRIPT_ERROR`
      //     // update_strapi_logs(plugin_log)
      // }
    }
  } else {
    let error = 'NO DOMAIN'
    console.log('-------------', error, '-------------')
    build_error = 'All domain or domain related fields must be filled, if you want this object to show on build.(domain).ee.'
    await build_start_to_strapi_logs(result, '¯\\_( ͡ᵔ ͜ʖ ͡ᵔ)_/¯', error, build_error)
  }
  return build_error
}

async function call_delete(result, domains, model_name) {
  if (Array.isArray(result)) {
    result = result.sort((a, b) => b.id - a.id)[0]
  }
  await modify_stapi_data(result, model_name, true)

  // Film build is done by its cassettes if any
  if (model_name !== 'film') {
    await call_build(result, domains, model_name, true)
  }
}

exports.call_update = call_update
exports.build_start_to_strapi_logs = build_start_to_strapi_logs
exports.call_process = call_process
exports.call_build = call_build
exports.get_domain = get_domain
exports.get_build_script = get_build_script
exports.update_strapi_logs = update_strapi_logs
exports.modify_stapi_data = modify_stapi_data
exports.slugify = slugify
exports.call_delete = call_delete


// build_hoff.sh hoff.ee target screenings id  // info mida sh fail ootab
