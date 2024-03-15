const hbs = require('handlebars')
const fs = require('fs')
const request = require('request')
const btoa = require('btoa')

const clearUser = require('./clearuser.js')

module.exports = function (callback) {
  if (process.env['CONTRIBUTORS']) {
    fs.readFile(process.env['CONTRIBUTORS'], function (err, data) {
      if (err) return callback(err, 'Error reading contribs file for building page.')
      organizeData(data)
    })
  } else {
    console.log('Making request for data...')
    const uri = 'https://da3e-23-16-39-44.ngrok-free.app/data'
    request({ url: uri, json: true }, function (err, res, body) {
      if (err) return callback(err, 'Fetching latest data for building page')
      organizeData(JSON.stringify(body))
    })
  }

  function organizeData (data) {
    const everyone = JSON.parse(data)
    const archiveCount = 12425
    const everyoneCount = everyone.length + archiveCount
    const everyoneCommas = everyoneCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    const newest = everyone[everyone.length - 1]
    const topHundred = everyone.reverse().slice(0, 100)
    const stats = { featured: newest, everyone: topHundred, total: everyoneCommas }
    return getTemplate(stats, everyone)
  }

  function getTemplate (stats, everyone) {
    fs.readFile('template.hbs', function (err, file) {
      if (err) return callback(err, 'Error reading template file.')
      file = file.toString()
      const template = hbs.compile(file)
      const HTML = template(stats)
      return writeRepo(HTML, stats, everyone)
    })
  }

  function writeRepo (HTML, stats, everyone) {
    const username = stats.featured.user
    const baseURL = 'https://api.github.com/repos/'

    const reqHeaders = {
      'User-Agent': 'request',
      'Authorization': 'token ' + process.env['REPOROBOT_TOKEN']
    }

    const options = {
      headers: reqHeaders,
      url: baseURL + 'lhl-reporobot/patchwork/contents/index.html',
      json: true,
      body: {
        'branch': 'gh-pages',
        'committer': {
          'name': 'reporobot',
          'email': '06cbd53a404d948263e9@cloudmailin.net'
        },
        'sha': '',
        'content': btoa(HTML),
        'message': 'Rebuilt index with ' + username
      }
    }

    request.get(options, function (err, res, body) {
      if (err) return callback(err, 'Error fetching SHA')
      options.body.sha = body.sha
      request.put(options, function (err, res, body) {
        if (err) return callback(err, 'Error writing new index to Patchwork')
        console.log(new Date(), 'Rebuilt index with ' + username)
        clearUser(username, callback)
      })
    })
  }
}
