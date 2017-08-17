'use strict'

const pkg = require('./package.json')

exports.version = pkg.version
exports.create = create

const document = typeof window !== 'undefined' ? window.document : null

function create (spec) {
  return new Roanco(spec)
}

class Roanco {
  constructor (spec, opts) {
    if (typeof spec !== 'object') throw new Error('expecting a spec argument')

    this._els = new Map()
    this._spec = spec
    this._opts = opts

    if (build(this) == null) return null
  }

  el (path) {
    return this._els.get(path)
  }
}

function build (roanco) {
  const spec = roanco._spec
  const els = roanco._els

  if (typeof spec !== 'object') throw new Error('expecting a spec argument')

  const rootEl = document.createElement('div')
  els.set(null, rootEl)

  return roanco
}
