const https = require('https');

function getStatuses(commitSha) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/mehtadairy/mehta/commits/${commitSha}/status`,
      headers: {
        'User-Agent': 'NodeJS-Script'
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    }).on('error', reject);
  });
}

async function check() {
  const sha = 'a961bd2267b14441584db2ce5ee040ea4d026362'; // a961bd2
  console.log("Fetching status checks for commit", sha, "...");
  try {
    const res = await getStatuses(sha);
    console.log("State:", res.state);
    console.log("Statuses:", res.statuses ? res.statuses.map(s => ({
      context: s.context,
      state: s.state,
      description: s.description,
      target_url: s.target_url
    })) : "None");
  } catch (err) {
    console.error("Failed:", err);
  }
}

check();
