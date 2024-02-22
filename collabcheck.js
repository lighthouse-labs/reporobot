const request = require('request')

// With username parsed from query, check to see if @RR has read/write access
// to user's fork of Patchwork. This means they have been added as a collab.
// Pass boolean on to callback.
// Called by:
// checkCollab(username, function(err, collab) { collabStatus(r, e, collab) })

module.exports = function (username, callback) {
  const options = {
    url: `https://api.github.com/repos/${username}/patchwork/collaborators/reporobot/permission`,
    json: true,
    headers: { 'User-Agent': 'request',
               'Authorization': 'token ' + process.env['REPOROBOT_TOKEN'],
               'Accept': 'application/vnd.github.swamp-thing-preview+json'
    }
}
  const collab = false

  request(options, function (err, response, body) {
    if (err) return callback(err.error)

    const permissions = body.permission
    if (permissions === 'admin' || permissions === 'write') {
      collab = true
      callback(null, collab)
    } else {
      collab = false
      callback(null, collab)
    }
  })
}
