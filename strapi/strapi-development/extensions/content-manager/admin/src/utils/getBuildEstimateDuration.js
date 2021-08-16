const strapiHost = 'https://dev.poff.ee'
// const strapiHost = 'http://localhost:1337'

const getBuildEstimateDuration = async (buildArgs) => {

  const noNotificationModels = [
    'person',
    'organisation',
    'hall',
    'label-group',
    'tag-genre',
    'country',
    'language'
  ]

  if (noNotificationModels.includes(buildArgs.split(' ')[0])) {
    return null
  }

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

    // Skip if not server build, do not skip if saved collection type is film as then cassette build log estimate shall be shown
    if (buildArgs.split(' ')[0] !== 'film' && buildArgs !== result.build_args) {
      // Not server build
      console.log('Not server build ', buildArgs, result.build_args);
      return null
    }

    console.log('Estimate shown for log id', result.id);

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
        timeout: 60000
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

export default getBuildEstimateDuration;
