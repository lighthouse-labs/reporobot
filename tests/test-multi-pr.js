#!/usr/bin/env node

const pr = require(__dirname + '/test-onbehalfof.js')
const runParallel = require('run-parallel')

// const accounts = ['jllord', 'goldenrod', 'eviljlord', 'maxogden', 'reporobot']
const accounts = ['jllord', 'eviljlord', 'goldenrod']
const sourceAccount = 'jlord'
const n = 0
accounts.forEach(function(account) {
  n++
  console.log(n, 0, "Running for " + account)
  pr(sourceAccount, account, n)
})
