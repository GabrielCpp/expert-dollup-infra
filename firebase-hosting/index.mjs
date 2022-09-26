import admin from 'firebase-admin';
import fetch  from 'node-fetch';

function getAccessToken() {
  return admin.credential.applicationDefault().getAccessToken()
      .then(accessToken => {
        return accessToken.access_token;
      })
      .catch(err => {
        console.error('Unable to get access token');
        console.error(err);
      });
}

async function listProjects() {
  const accessToken = await getAccessToken();
  const uri = 'https://firebase.googleapis.com/v1beta1/projects';
  const options = {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
    },
  };

  try {
    const rawResponse = await fetch(uri, options);
    const resp = await rawResponse.json();
    const projects = resp['results'];
    const projectIds = []
    console.log('Project total: ' + projects.length);
    console.log('');
    for (let i in projects) {
      const project = projects[i];
      console.log('Project ' + i);
      console.log('ID: ' + project['projectId']);
      console.log('Display Name: ' + project['displayName']);
      console.log('');
      projectIds.push(project['projectId'])
    }
    return projectIds
  } catch(err) {
    console.error(err);
  }
}

async function addFirebase(projectId) {
  const accessToken = await getAccessToken();
  const uri = 'https://firebase.googleapis.com/v1beta1/projects/' + projectId + ':addFirebase';
  const options = {
    method: 'POST',
    // Use a manual access token here since explicit user access token is required.
    headers: {
      'Authorization': 'Bearer ' + accessToken,
    },
  };

  try {
    const rawResponse = await fetch(uri, options);
    const resp = await rawResponse.json();
    console.log(resp);
  } catch(err) {
    console.error(err['message']);
  }
}

async function addWebApp(projectId, displayName) {
  const accessToken = await getAccessToken();
  const uri = 'https://firebase.googleapis.com/v1beta1/projects/' + projectId + '/webApps';
  const options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
    },
    body: JSON.stringify({
      'displayName': displayName
    }),
  };

  try {
    const rawResponse = await fetch(uri, options);
    const resp = await rawResponse.json();
    console.log(resp);
  } catch(err) {
    console.error(err['message']);
  }
}

async function main(projectId) {
  console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  const projects = await listProjects()
  console.log(projects)

  if(!projects.includes(projectId)) {
    console.log(`Project '${projectId}' does not exists`)
    const newProject = await addFirebase('predyktv2')
    console.log(newProject)
  }

  await addWebApp(projectId, projectId)
}

main('predyktv2').catch(console.error)