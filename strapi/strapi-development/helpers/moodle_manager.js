async function requester(method, func, requestParams) {
  // console.log('MoodleManager - request: ', method, func, requestParams);
  const token = process.env[`Moodle_${func}_key`]

  return new Promise(function (resolve, reject) {
    if (token) {
      requestParams.wstoken = token
      requestParams.moodlewsrestformat = 'json'
      requestParams.wsfunction = func

      let requestUrl = `${process.env.MoodleAPI}?`

      Object.entries(requestParams).map(r => {
        const requestValue = r[1]
        const keyAndValueString = requestValue.length ? `${r[0]}=${r[1]}` : null
        if (keyAndValueString) { requestUrl = `${requestUrl}&${keyAndValueString}` }
      })

      var request = require('request');
      var options = {
        'method': method,
        'url': requestUrl,
        'headers': {
        }
      };
      request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log('MoodleManager - request response body: ', JSON.parse(body));
          resolve(JSON.parse(body));
        } else {
          console.log('MoodleManager - request response error: ', error);
          reject(error);
        }
      });
    }
  })

}

async function getUser(email) {
  console.log('MoodleM: getUser user email: ', email);
  const requestParams = {
    'criteria[0][key]': 'email',
    'criteria[0][value]': email,
  }
  return await requester('POST', 'core_user_get_users', requestParams)
}

async function createUser(email, firstName, lastName) {
  console.log('MoodleM: createUser user: ', email, firstName, lastName);
  const requestParams = {
    'users[0][username]': email,
    'users[0][email]': email,
    // 'users[0][password]': 'testusertester@testS1',
    'users[0][firstname]': `${firstName}`,
    'users[0][lastname]': `${lastName}`,
    'users[0][createpassword]': '1',
  }
  return await requester('POST', 'core_user_create_users', requestParams)
}

async function enrolUser(userId, courseId, roleId, unEnrol = false) {
  console.log(`MoodleM: ${unEnrol ? 'unE' : 'e'}nrolUser user: `, userId, `${unEnrol ? 'from' : 'to'} course: `, courseId, 'with role: ', roleId);
  const requestParams = {
    'enrolments[0][userid]': `${userId}`,
    'enrolments[0][courseid]': `${courseId}`,
    'enrolments[0][roleid]': `${roleId}`, // Roleid being users role in course (usually Student (in our Moodle, ID 5))
    'enrolments[0][suspend]': unEnrol === false ? '0' : '1'
  }
  return await requester('POST', 'enrol_manual_enrol_users', requestParams)
}

exports.getUser = getUser
exports.createUser = createUser
exports.enrolUser = enrolUser


// build_hoff.sh hoff.ee target screenings id  // info mida sh fail ootab
