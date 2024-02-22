const messages = require('../messages.json')
const debug = require('debug')('TEST')
const Github = require('github-api')
const request = require('request')
const tape = require('tape')

const github = new Github({
  auth: 'oauth',
  token: process.env['REPOROBOT_TOKEN']
})

const reqHeaders = {
  'User-Agent': 'request',
  'Authorization': 'token ' + process.env['REPOROBOT_TOKEN']
}

const fork = github.getRepo('reporobot', 'patchwork')
const upstream = github.getRepo('jlord', 'patchwork')
const baseURL = 'https://api.github.com/repos/'
const prnum

// Create a branch on RR's fork of Patchwork. Then create a file on that
// branch, then another! Then create a PR. Check to see if RR
// commented on that PR. Delete branch when finished (or have failed).

tape("Test too many files", function(t) {

  createBranch()

  function createBranch() {
    debug("⬢ Creating branch")
    fork.branch('gh-pages', 'add-reporobot', function(err) {
      if (err) {
        t.error(err, "Error creating branch on RRs fork")
        return t.end()
      }
      setTimeout(createFirstFile(), 5000)
    })
  }

  function createFirstFile() {
    const options = {
      headers: reqHeaders,
      url: baseURL + "reporobot/patchwork/contents/file_one.md",
      json: true,
      body: {
        "path": "file_one.md",
        "branch": "add-reporobot",
        "message": "TEST add first file",
        "content": "bXkgbmV3IGZpbGUgY29udGVudHM=",
        "committer": {
          "name": "reporobot",
          "email": "60ebe73fdad8ee59d45c@cloudmailin.net"
        }
      }
    }

    request.put(options, function(err, res, body) {
      debug("⬢ Creating first file")
      if (err) {
        t.error(err, "Error making first new file", body)
        return t.end()
      }
      // Give GitHub some time
      setTimeout(function() { createSecondFile() }, 3000)
    })
  }

  function createSecondFile() {
    const options = {
      headers: reqHeaders,
      url: baseURL + "reporobot/patchwork/contents/file_two.md",
      json: true,
      body: {
        "path": "file_two.md",
        "branch": "add-reporobot",
        "message": "TEST add second file",
        "content": "bXkgbmV3IGZpbGUgY29udGVudHM=",
        "committer": {
          "name": "reporobot",
          "email": "60ebe73fdad8ee59d45c@cloudmailin.net"
        }
      }
    }

    request.put(options, function(err, res, body) {
      debug("⬢ Creating second file")
      if (err) {
        t.error(err, "Error making second new file", body)
        return t.end()
      }
      // Give GitHub some time
      setTimeout(function() { makePR() }, 5000)
    })
  }

  function makePR() {
    debug("⬢ Creating PR")
    const pull = {
      title: "[TESTING] Too many files",
      body: "Running a test on a PR with a too many files",
      base: "gh-pages",
      head: "reporobot:" + "add-reporobot"
    }

    upstream.createPullRequest(pull, function(err, pr) {
      if (err) {
        t.error(err, "error creating PR")
        return t.end()
      }
      prnum = pr.number
      // Give GitHub some time
      setTimeout(function() { makePR() }, 5000)
    })
  }

  function fetchPR() {
    debug("⬢ Fetching PR")
    const prURL = baseURL + 'jlord/patchwork/issues/' + prnum + '/comments'
    const options = { headers: reqHeaders, json: true, url: prURL }

    request(options, function(err, res, body) {
      if (err) {
        t.error(err, "error fetching PR")
        return t.end()
      }
      if (res.length === 0) {
        t.fail("No PR created")
        return t.end()
      }
      getComment(res,body)
    })
  }

  function getComment(res, body) {
    debug("⬢ Getting comment")
    if (body.length < 1) {
      t.fail("Less than one comment")
      return t.end()
    }
    const lastComment = body[body.length - 1]
    t.equal(lastComment.user.login, "reporobot")
    t.equal(lastComment.body, messages.multi_files)
    t.end()
  }
})

tape("Test cleanup", function(t) {

  deleteViaBranch()

  function deleteViaBranch() {
    debug("⬢ Deleting branch")
    fork.deleteRef('heads/add-reporobot', function(err) {
      if (err && err.error != '422') {
        t.error(err, "Error deleting branch")
        return t.end()
      }
      debug("⬢ Branch deleted on RR fork.")
      t.end()
    })
  }
})
