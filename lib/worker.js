'use strict'

const path = require('path')
const _ = require('lodash')
const fs = require('fs')

const getJSONConf = (env, type, path) => {
  const conf = JSON.parse(fs.readFileSync(path, 'utf8'))
  if (!_.isObject(conf)) {
    return {}
  }

  let res = {}

  if (type) {
    _.set(res, type, conf[env] ? conf[env] : conf)
  } else {
    res = conf
  }

  return res
}

process.env.TZ = 'UTC'

function worker (cmd) {
  const wtype = cmd.wtype
  const env = cmd.env
  const debug = cmd.debug
  const serviceRoot = cmd.serviceRoot || path.dirname(require.main.filename)

  // eslint-disable-next-line no-unused-vars
  let heapdump
  if (debug) {
    heapdump = require('heapdump')
  }

  const conf = _.merge(
    {},
    getJSONConf(env, null, `${serviceRoot}/config/common.json`)
  )

  const wref = wtype.split('-').reverse()
  const workerFile = path.join(serviceRoot, '/workers/', wref.join('.'))

  const ctx = {
    root: serviceRoot,
    wtype: wtype,
    env: env,
    worker: workerFile
  }

  _.each(cmd, (v, k) => {
    ctx[_.camelCase(k)] = v
  })

  const pname = [wtype]
  pname.push(process.pid)
  process.title = pname.join('-')

  const HandlerClass = require(workerFile)
  const hnd = new HandlerClass(conf, ctx)

  return hnd
}

module.exports = worker
