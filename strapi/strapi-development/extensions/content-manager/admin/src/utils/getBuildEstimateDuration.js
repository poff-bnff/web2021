'use strict';

// module.exports = getBuildEstimateDuration = async (buildArgs) => {
const getBuildEstimateDuration = async (buildArgs) => {
  const token = await getToken()

  if (token) {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token}`);

    var requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'
    };

    let result = await fetch(`${strapiHost}/publisher/my-started-build-log/`, requestOptions)
      .then(response => response.text())
      .then(result => result)
      .catch(error => console.log('error', error));

    result = JSON.parse(result)

    if (buildArgs !== result.build_args) {
      // Not server build
      return null
    }

    let s = result.queue_est_duration
    const ms = s % 1000;
    s = (s - ms) / 1000;
    const secs = s % 60;
    s = (s - secs) / 60;
    const mins = s % 60;
    const hrs = (s - mins) / 60;

    if (result.site) {
      let notifyMessage
      if (result.queue_est_duration > 0) {
        notifyMessage = `Queue length: ${result.in_queue}. Estimate build finish in: ${hrs > 0 ? `${hrs} h `: ''} ${mins} m ${secs} s`
      } else {
        notifyMessage = `Queue length: ${result.in_queue}. Estimate build finish time unknown`
      }

      strapi.notification.toggle({
        type: 'success',
        message: notifyMessage,
        // blockTransition: true
        timeout: 15000
      });
    }
  }
}

const getToken = () => {
  const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken')
  if (token) {
    return token.replace(/"/g, '')
  } else {
    return null
  }
}

module.exports = buildArgs => getBuildEstimateDuration(buildArgs)

