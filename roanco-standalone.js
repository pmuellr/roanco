(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

exports.build = build

const sizers = require('./sizers')

const document = getDocument()

// take input from spec-parser, build elements
function build (node, opts) {
  if (opts == null) opts = {}
  if (opts.classPrefix == null) opts.classPrefix = 'roanco-'

  const classNodeName = node.name == null ? null : `${opts.classPrefix}${node.name}`
  const classDivider = `${opts.classPrefix}divider`
  const classDividerHor = `${opts.classPrefix}divider-hor`
  const classDividerVer = `${opts.classPrefix}divider-ver`
  const classSizer = `${opts.classPrefix}sizer`
  const classSizerHor = `${opts.classPrefix}sizer-hor`
  const classSizerVer = `${opts.classPrefix}sizer-ver`

  node.el = document.createElement('div')

  const styles = []
  const classes = []

  if (classNodeName != null) classes.push(classNodeName)

  if (node.isRow) styles.push('display: flex', 'flex-direction: row')
  if (node.isCol) styles.push('display: flex', 'flex-direction: column')
  if (node.isFlex) styles.push(`flex-grow: ${node.flex}`)

  if (node.isDivider) {
    classes.push(classDivider)
    if (node.parent.isRow) classes.push(classDividerVer)
    if (node.parent.isCol) classes.push(classDividerHor)
  }

  if (node.isSizer) {
    classes.push(classSizer)
    if (node.parent.isRow) classes.push(classSizerVer)
    if (node.parent.isCol) classes.push(classSizerHor)
  }

  node.el.setAttribute('style', styles.join('; '))
  node.el.setAttribute('class', classes.join(' '))

  if (node.isSizer) {
    node.sizer = sizers.create(node)
  }

  if (node.children == null) return

  for (let child of node.children) {
    build(child, opts)
    node.el.appendChild(child.el)
  }
}

// get window.document or stub if not in browser
function getDocument () {
  if (typeof window !== 'undefined') return window.document

  return { createElement: function () {} }
}

},{"./sizers":3}],2:[function(require,module,exports){
'use strict'

exports.createCell = createCell
exports.createRow = createRow
exports.createCol = createCol
exports.createDivider = createDivider
exports.createSizer = createSizer

function createCell (parent, name, flex) { return new Cell(parent, name, flex) }
function createRow (parent, name, flex) { return new Row(parent, name, flex) }
function createCol (parent, name, flex) { return new Col(parent, name, flex) }
function createDivider (parent, name, flex) { return new Divider(parent) }
function createSizer (parent, name, flex) { return new Sizer(parent) }

// -----------------------------------------------------------------------------
class Node {
  constructor (parent, name, flex) {
    this.parent = parent
    if (name != null) this.name = name
    if (flex != null) this.flex = flex
    this.el = null
    this.children = []
  }

  get isFlex () { return this.flex != null }
  get isCell () { return false }
  get isRow () { return false }
  get isCol () { return false }
  get isRowOrCol () { return false }
  get isDivider () { return false }
  get isSizer () { return false }

  get prevSib () {
    if (this.parent == null) return null
    const index = this.parent.children.indexOf(this)
    return this.parent.children[index - 1]
  }

  get nextSib () {
    if (this.parent == null) return null
    const index = this.parent.children.indexOf(this)
    return this.parent.children[index + 1]
  }

  get prevFlexSib () {
    let sib = this.prevSib

    while (sib != null) {
      if (sib.isFlex) break
      sib = sib.prevSib
    }

    return sib
  }

  get nextFlexSib () {
    let sib = this.nextSib

    while (sib != null) {
      if (sib.isFlex) break
      sib = sib.nextSib
    }

    return sib
  }
}

class Cell extends Node { get isCell () { return true } }
class RowCol extends Node { get isRowOrCol () { return true } }
class Row extends RowCol { get isRow () { return true } }
class Col extends RowCol { get isCol () { return true } }
class Divider extends Node { get isDivider () { return true } }
class Sizer extends Divider { get isSizer () { return true } }

},{}],3:[function(require,module,exports){
'use strict'

exports.create = create

function create (node) {
  return new Sizer(node)
}

class Sizer {
  constructor (node) {
    this.node = node
    this.el = this.node.el
    this.prevNode = this.node.prevFlexSib
    this.nextNode = this.node.nextFlexSib
    this.vertical = this.node.parent.isRow
    this.root = this.el.ownerDocument
    this.dragging = false
    this.installHandlers()
  }

  installHandlers () {
    this.mouseDown = this.mouseDown.bind(this)
    this.mouseMove = this.mouseMove.bind(this)
    this.mouseOut = this.mouseOut.bind(this)
    this.mouseLeave = this.mouseLeave.bind(this)

    this.el.addEventListener('mousedown', this.mouseDown, false)
  }

  mouseMove (event) {
    if (event == null) event = window.event
    // console.log('mouseMove:', event)
    event.preventDefault()
    event.stopPropagation()

    if (!this.dragging) return
    if ((event.buttons & 1) === 0) return this.dragDone(event)

    const dragCurr = this.vertical ? event.pageX : event.pageY
    const diff = dragCurr - this.dragLast
    this.dragLast = dragCurr

    const prevFlex = Number(this.prevNode.el.style.flexGrow)
    const nextFlex = Number(this.nextNode.el.style.flexGrow)
    this.prevNode.el.style.flexGrow = prevFlex + 2 * diff
    this.nextNode.el.style.flexGrow = nextFlex - 2 * diff

    console.log(`drag: ${diff}`)
    console.log(`update prev flex value: ${this.prevNode.name}: ${this.prevNode.el.style.flexGrow}`)
    console.log(`update next flex value: ${this.nextNode.name}: ${this.nextNode.el.style.flexGrow}`)
  }

  mouseDown (event) {
    if (event == null) event = window.event
    // console.log('mouseDown:', event)
    event.preventDefault()
    event.stopPropagation()

    if (this.dragging) return
    this.dragging = true

    this.dragLast = this.vertical ? event.pageX : event.pageY

    this.root.addEventListener('mousemove', this.mouseMove, false)
    this.root.addEventListener('mouseout', this.mouseOut, false)
    this.root.addEventListener('mouseleave', this.mouseLeave, false)

    this.resetFlexValues()
  }

  // change all the flex values for this node's peers to be their actual size
  resetFlexValues () {
    const flexPeers = this.node.parent.children
      .filter(child => child.isFlex)

    // get the existing lengths
    const lengths = new Map()
    for (let peer of flexPeers) {
      const length = this.vertical ? peer.el.clientWidth : peer.el.clientHeight
      lengths.set(peer, length)
    }

    // set as flexGrow
    for (let peer of flexPeers) {
      peer.el.style.flexGrow = lengths.get(peer)
      console.log(`reset       flex value: ${peer.name}: ${peer.el.style.flexGrow}`)
    }
  }

  dragDone (event) {
    console.log('dragDone:', event)
    event.preventDefault()
    event.stopPropagation()

    if (!this.dragging) return
    this.dragging = false

    this.root.removeEventListener('mousemove', this.mouseMove, false)
    this.root.removeEventListener('mouseout', this.mouseOut, false)
    this.root.removeEventListener('mouseleave', this.mouseLeave, false)
  }

  mouseOut (event) {
    if (event == null) event = window.event
    // console.log('mouseOut:', event)

    if (event.target !== this.root) return

    this.dragDone(event)
  }

  mouseLeave (event) {
    if (event == null) event = window.event
    // console.log('mouseLeave:', event)

    if (event.target !== this.root) return

    this.dragDone(event)
  }
}

},{}],4:[function(require,module,exports){
'use strict'

exports.parse = parse

const Nodes = require('./nodes')

// input:
//
// `
//   col main -> head navs:1 body:3 foot
//   row navs -> navL:1 navR:1
// `
//
// output:
// { err: "an error message"}
// or
// { tree: theTree }

// returns { tree, err }
function parse (spec) {
  if (typeof spec !== 'string') return {err: 'spec is not a string'}

  // sanitize input lines
  const lines = `${spec}`.split('\n')
    // remove comments and leading/trailing whitespace
    .map(line => line.split('#')[0].trim())
    // remove empty lines
    .filter(line => line !== '')

  if (lines.length === 0) return {err: 'spec has no lists'}

  // parse each line into a list, add lists to map by name
  const lists = new Map()
  let head = null
  for (let line of lines) {
    const list = parseList(line)
    if (list == null) return { err: `parse error on line "${line}"` }

    if (head == null) head = list
    lists.set(list.name, list)
  }

  // convert lists into tree
  const tree = toTree(lists, null, head.name, 100)

  // convert dividers to sizers
  setSizers(tree)

  return { tree: tree }
}

function setSizers (tree) {
  if (!tree.isRowOrCol) return

  // convert dividers to sizers as appropriate
  for (let index = 0; index < tree.children.length; index++) {
    const child = tree.children[index]
    setSizers(child)
    if (!child.isDivider) continue
    if (child.prevFlexSib == null) continue
    if (child.nextFlexSib == null) continue

    // replace divider with sizer
    tree.children[index] = Nodes.createSizer(child.parent)
  }
}

function toTree (lists, parent, name, flex) {
  const list = lists.get(name)

  let node
  switch (list.type) {
    case 'row': node = Nodes.createRow(parent, name, flex); break
    case 'col': node = Nodes.createCol(parent, name, flex); break
  }

  let first = true
  for (let child of list.children) {
    let childNode
    if (lists.has(child.name)) {
      childNode = toTree(lists, node, child.name, child.flex)
    } else {
      childNode = Nodes.createCell(node, child.name, child.flex)
    }

    if (first) {
      first = false
    } else {
      node.children.push(Nodes.createDivider(node))
    }

    node.children.push(childNode)
  }

  return node
}

// input: 'row main -> head navs:1 body:3 foot'
// output { type: 'row', name: 'main', children: ['head', 'navs:1', ...]}
function parseList (line) {
  line = line.trim()
  const match = line.match(/^(.+)->(.+)$/)
  if (match == null) return null

  const def = match[1]
    .split(/\s+/)
    .filter(s => s !== '')

  const children = match[2]
    .split(/\s+/)
    .filter(s => s !== '')

  if (def.length !== 2) return null

  const result = {
    type: def[0],
    name: def[1],
    children: []
  }

  if (result.type !== 'row' && result.type !== 'col') return null

  let flexTotal = 0
  for (let child of children) {
    const node = parseNode(child)
    if (node == null) return null

    result.children.push(node)

    flexTotal += (node.flex == null ? 0 : node.flex)
  }

  // normalize child flex values
  for (let node of result.children) {
    if (node.flex == null) continue

    node.flex = Math.round(100 * node.flex / flexTotal)
  }

  return result
}

// parse name:1 into [ 'name', 1 ]
function parseNode (string) {
  if (string.indexOf(':') === -1) return { name: string }
  const match = string.match(/^(.+):(.+)$/)
  if (match == null) return null

  const name = match[1]
  const flex = parseFloat(match[2])

  if (isNaN(flex)) return null

  return { name: name, flex: flex }
}

if (require.main === module) test()

function test () {
  const spec = `
    col main -> head navs:1 body:3 foot
    row navs -> navL:1 navR:1
  `

  const tree = parse(spec)
  console.log(JSON.stringify(tree, null, 1))
}

},{"./nodes":2}],5:[function(require,module,exports){
'use strict'

// used with a bundler to build a standalone script which adds the roanco
// module exports as a global objbect

window.roanco = require('..')

},{"..":7}],6:[function(require,module,exports){
module.exports={
  "name": "roanco",
  "version": "0.0.1",
  "description": "ROws ANd COlumns for the web",
  "license": "MIT",
  "author": "Patrick Mueller <pmuellr@apache.org> (https://github.com/pmuellr)",
  "homepage": "https://github.com/pmuellr/roanco",
  "main": "roanco.js",
  "repository": {
    "type": "git",
    "url": "https://github.com/pmuellr/roanco.git"
  },
  "bugs": {
    "url": "https://github.com/pmuellr/roanco/issues"
  },
  "scripts": {
    "build": "make build",
    "standard": "make standard",
    "test": "make test",
    "watch": "nodemon --exec 'make build || true'"
  },
  "standard": {
    "ignore": [
      "/tmp/",
      "/docs/",
      "/node_modules/",
      "/roanco-standalone.js"
    ]
  },
  "dependencies": {},
  "devDependencies": {
    "browserify": "~14.4.0",
    "cat-source-map": "~0.1.2",
    "nodemon": "~1.11.0",
    "standard": "~10.0.3",
    "tap-spec": "~4.1.1",
    "tape": "~4.7.0"
  }
}

},{}],7:[function(require,module,exports){
'use strict'

const pkg = require('./package.json')

exports.version = pkg.version
exports.create = create

const specParser = require('./lib/spec-parser')
const elementBuilder = require('./lib/element-builder')

// given a spec and options, return a Roanco object
function create (spec, opts) {
  const result = specParser.parse(spec, opts)
  if (result.err) throw new Error(result.err)

  return new Roanco(spec, result.tree, opts)
}

// class of object returned from the create() api
class Roanco {
  constructor (spec, tree, opts) {
    this._spec = spec
    this._tree = tree
    this._opts = opts || {}

    elementBuilder.build(this._tree, this._opts)

    this._paths = new Map()
    buildPaths(this._paths, this._tree, [])
  }

  // given a path, return the element in the tree
  el (path) {
    const node = this._paths.get(path)
    if (node == null) return null

    return node.el
  }

  // return the paths to all the nodes in the tree
  get paths () {
    return Array.from(this._paths.keys())
  }

  // return the current mapping of element paths -> flex values
  get flexMap () {
    const result = {}

    for (let path of this.paths) {
      const node = this._paths.get(path)
      if (node.flex == null) continue

      result[path] = node.flex
    }

    return result
  }

  // return a spec for the current object
  get spec () {
    return this._spec
  }
}

// given a tree, populate a map of paths of nodes -> node
function buildPaths (map, tree, currentPath) {
  const thisPath = currentPath.concat(tree.name)

  map.set(thisPath.join('/'), tree)
  if (tree.children == null) return

  for (let child of tree.children) {
    buildPaths(map, child, thisPath)
  }
}

},{"./lib/element-builder":1,"./lib/spec-parser":4,"./package.json":6}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvZWxlbWVudC1idWlsZGVyLmpzIiwibGliL25vZGVzLmpzIiwibGliL3NpemVycy5qcyIsImxpYi9zcGVjLXBhcnNlci5qcyIsImxpYi9zdGFuZGFsb25lLmpzIiwicGFja2FnZS5qc29uIiwicm9hbmNvLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnXG5cbmV4cG9ydHMuYnVpbGQgPSBidWlsZFxuXG5jb25zdCBzaXplcnMgPSByZXF1aXJlKCcuL3NpemVycycpXG5cbmNvbnN0IGRvY3VtZW50ID0gZ2V0RG9jdW1lbnQoKVxuXG4vLyB0YWtlIGlucHV0IGZyb20gc3BlYy1wYXJzZXIsIGJ1aWxkIGVsZW1lbnRzXG5mdW5jdGlvbiBidWlsZCAobm9kZSwgb3B0cykge1xuICBpZiAob3B0cyA9PSBudWxsKSBvcHRzID0ge31cbiAgaWYgKG9wdHMuY2xhc3NQcmVmaXggPT0gbnVsbCkgb3B0cy5jbGFzc1ByZWZpeCA9ICdyb2FuY28tJ1xuXG4gIGNvbnN0IGNsYXNzTm9kZU5hbWUgPSBub2RlLm5hbWUgPT0gbnVsbCA/IG51bGwgOiBgJHtvcHRzLmNsYXNzUHJlZml4fSR7bm9kZS5uYW1lfWBcbiAgY29uc3QgY2xhc3NEaXZpZGVyID0gYCR7b3B0cy5jbGFzc1ByZWZpeH1kaXZpZGVyYFxuICBjb25zdCBjbGFzc0RpdmlkZXJIb3IgPSBgJHtvcHRzLmNsYXNzUHJlZml4fWRpdmlkZXItaG9yYFxuICBjb25zdCBjbGFzc0RpdmlkZXJWZXIgPSBgJHtvcHRzLmNsYXNzUHJlZml4fWRpdmlkZXItdmVyYFxuICBjb25zdCBjbGFzc1NpemVyID0gYCR7b3B0cy5jbGFzc1ByZWZpeH1zaXplcmBcbiAgY29uc3QgY2xhc3NTaXplckhvciA9IGAke29wdHMuY2xhc3NQcmVmaXh9c2l6ZXItaG9yYFxuICBjb25zdCBjbGFzc1NpemVyVmVyID0gYCR7b3B0cy5jbGFzc1ByZWZpeH1zaXplci12ZXJgXG5cbiAgbm9kZS5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cbiAgY29uc3Qgc3R5bGVzID0gW11cbiAgY29uc3QgY2xhc3NlcyA9IFtdXG5cbiAgaWYgKGNsYXNzTm9kZU5hbWUgIT0gbnVsbCkgY2xhc3Nlcy5wdXNoKGNsYXNzTm9kZU5hbWUpXG5cbiAgaWYgKG5vZGUuaXNSb3cpIHN0eWxlcy5wdXNoKCdkaXNwbGF5OiBmbGV4JywgJ2ZsZXgtZGlyZWN0aW9uOiByb3cnKVxuICBpZiAobm9kZS5pc0NvbCkgc3R5bGVzLnB1c2goJ2Rpc3BsYXk6IGZsZXgnLCAnZmxleC1kaXJlY3Rpb246IGNvbHVtbicpXG4gIGlmIChub2RlLmlzRmxleCkgc3R5bGVzLnB1c2goYGZsZXgtZ3JvdzogJHtub2RlLmZsZXh9YClcblxuICBpZiAobm9kZS5pc0RpdmlkZXIpIHtcbiAgICBjbGFzc2VzLnB1c2goY2xhc3NEaXZpZGVyKVxuICAgIGlmIChub2RlLnBhcmVudC5pc1JvdykgY2xhc3Nlcy5wdXNoKGNsYXNzRGl2aWRlclZlcilcbiAgICBpZiAobm9kZS5wYXJlbnQuaXNDb2wpIGNsYXNzZXMucHVzaChjbGFzc0RpdmlkZXJIb3IpXG4gIH1cblxuICBpZiAobm9kZS5pc1NpemVyKSB7XG4gICAgY2xhc3Nlcy5wdXNoKGNsYXNzU2l6ZXIpXG4gICAgaWYgKG5vZGUucGFyZW50LmlzUm93KSBjbGFzc2VzLnB1c2goY2xhc3NTaXplclZlcilcbiAgICBpZiAobm9kZS5wYXJlbnQuaXNDb2wpIGNsYXNzZXMucHVzaChjbGFzc1NpemVySG9yKVxuICB9XG5cbiAgbm9kZS5lbC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgc3R5bGVzLmpvaW4oJzsgJykpXG4gIG5vZGUuZWwuc2V0QXR0cmlidXRlKCdjbGFzcycsIGNsYXNzZXMuam9pbignICcpKVxuXG4gIGlmIChub2RlLmlzU2l6ZXIpIHtcbiAgICBub2RlLnNpemVyID0gc2l6ZXJzLmNyZWF0ZShub2RlKVxuICB9XG5cbiAgaWYgKG5vZGUuY2hpbGRyZW4gPT0gbnVsbCkgcmV0dXJuXG5cbiAgZm9yIChsZXQgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgIGJ1aWxkKGNoaWxkLCBvcHRzKVxuICAgIG5vZGUuZWwuYXBwZW5kQ2hpbGQoY2hpbGQuZWwpXG4gIH1cbn1cblxuLy8gZ2V0IHdpbmRvdy5kb2N1bWVudCBvciBzdHViIGlmIG5vdCBpbiBicm93c2VyXG5mdW5jdGlvbiBnZXREb2N1bWVudCAoKSB7XG4gIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgcmV0dXJuIHdpbmRvdy5kb2N1bWVudFxuXG4gIHJldHVybiB7IGNyZWF0ZUVsZW1lbnQ6IGZ1bmN0aW9uICgpIHt9IH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnRzLmNyZWF0ZUNlbGwgPSBjcmVhdGVDZWxsXG5leHBvcnRzLmNyZWF0ZVJvdyA9IGNyZWF0ZVJvd1xuZXhwb3J0cy5jcmVhdGVDb2wgPSBjcmVhdGVDb2xcbmV4cG9ydHMuY3JlYXRlRGl2aWRlciA9IGNyZWF0ZURpdmlkZXJcbmV4cG9ydHMuY3JlYXRlU2l6ZXIgPSBjcmVhdGVTaXplclxuXG5mdW5jdGlvbiBjcmVhdGVDZWxsIChwYXJlbnQsIG5hbWUsIGZsZXgpIHsgcmV0dXJuIG5ldyBDZWxsKHBhcmVudCwgbmFtZSwgZmxleCkgfVxuZnVuY3Rpb24gY3JlYXRlUm93IChwYXJlbnQsIG5hbWUsIGZsZXgpIHsgcmV0dXJuIG5ldyBSb3cocGFyZW50LCBuYW1lLCBmbGV4KSB9XG5mdW5jdGlvbiBjcmVhdGVDb2wgKHBhcmVudCwgbmFtZSwgZmxleCkgeyByZXR1cm4gbmV3IENvbChwYXJlbnQsIG5hbWUsIGZsZXgpIH1cbmZ1bmN0aW9uIGNyZWF0ZURpdmlkZXIgKHBhcmVudCwgbmFtZSwgZmxleCkgeyByZXR1cm4gbmV3IERpdmlkZXIocGFyZW50KSB9XG5mdW5jdGlvbiBjcmVhdGVTaXplciAocGFyZW50LCBuYW1lLCBmbGV4KSB7IHJldHVybiBuZXcgU2l6ZXIocGFyZW50KSB9XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBOb2RlIHtcbiAgY29uc3RydWN0b3IgKHBhcmVudCwgbmFtZSwgZmxleCkge1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50XG4gICAgaWYgKG5hbWUgIT0gbnVsbCkgdGhpcy5uYW1lID0gbmFtZVxuICAgIGlmIChmbGV4ICE9IG51bGwpIHRoaXMuZmxleCA9IGZsZXhcbiAgICB0aGlzLmVsID0gbnVsbFxuICAgIHRoaXMuY2hpbGRyZW4gPSBbXVxuICB9XG5cbiAgZ2V0IGlzRmxleCAoKSB7IHJldHVybiB0aGlzLmZsZXggIT0gbnVsbCB9XG4gIGdldCBpc0NlbGwgKCkgeyByZXR1cm4gZmFsc2UgfVxuICBnZXQgaXNSb3cgKCkgeyByZXR1cm4gZmFsc2UgfVxuICBnZXQgaXNDb2wgKCkgeyByZXR1cm4gZmFsc2UgfVxuICBnZXQgaXNSb3dPckNvbCAoKSB7IHJldHVybiBmYWxzZSB9XG4gIGdldCBpc0RpdmlkZXIgKCkgeyByZXR1cm4gZmFsc2UgfVxuICBnZXQgaXNTaXplciAoKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgZ2V0IHByZXZTaWIgKCkge1xuICAgIGlmICh0aGlzLnBhcmVudCA9PSBudWxsKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5wYXJlbnQuY2hpbGRyZW4uaW5kZXhPZih0aGlzKVxuICAgIHJldHVybiB0aGlzLnBhcmVudC5jaGlsZHJlbltpbmRleCAtIDFdXG4gIH1cblxuICBnZXQgbmV4dFNpYiAoKSB7XG4gICAgaWYgKHRoaXMucGFyZW50ID09IG51bGwpIHJldHVybiBudWxsXG4gICAgY29uc3QgaW5kZXggPSB0aGlzLnBhcmVudC5jaGlsZHJlbi5pbmRleE9mKHRoaXMpXG4gICAgcmV0dXJuIHRoaXMucGFyZW50LmNoaWxkcmVuW2luZGV4ICsgMV1cbiAgfVxuXG4gIGdldCBwcmV2RmxleFNpYiAoKSB7XG4gICAgbGV0IHNpYiA9IHRoaXMucHJldlNpYlxuXG4gICAgd2hpbGUgKHNpYiAhPSBudWxsKSB7XG4gICAgICBpZiAoc2liLmlzRmxleCkgYnJlYWtcbiAgICAgIHNpYiA9IHNpYi5wcmV2U2liXG4gICAgfVxuXG4gICAgcmV0dXJuIHNpYlxuICB9XG5cbiAgZ2V0IG5leHRGbGV4U2liICgpIHtcbiAgICBsZXQgc2liID0gdGhpcy5uZXh0U2liXG5cbiAgICB3aGlsZSAoc2liICE9IG51bGwpIHtcbiAgICAgIGlmIChzaWIuaXNGbGV4KSBicmVha1xuICAgICAgc2liID0gc2liLm5leHRTaWJcbiAgICB9XG5cbiAgICByZXR1cm4gc2liXG4gIH1cbn1cblxuY2xhc3MgQ2VsbCBleHRlbmRzIE5vZGUgeyBnZXQgaXNDZWxsICgpIHsgcmV0dXJuIHRydWUgfSB9XG5jbGFzcyBSb3dDb2wgZXh0ZW5kcyBOb2RlIHsgZ2V0IGlzUm93T3JDb2wgKCkgeyByZXR1cm4gdHJ1ZSB9IH1cbmNsYXNzIFJvdyBleHRlbmRzIFJvd0NvbCB7IGdldCBpc1JvdyAoKSB7IHJldHVybiB0cnVlIH0gfVxuY2xhc3MgQ29sIGV4dGVuZHMgUm93Q29sIHsgZ2V0IGlzQ29sICgpIHsgcmV0dXJuIHRydWUgfSB9XG5jbGFzcyBEaXZpZGVyIGV4dGVuZHMgTm9kZSB7IGdldCBpc0RpdmlkZXIgKCkgeyByZXR1cm4gdHJ1ZSB9IH1cbmNsYXNzIFNpemVyIGV4dGVuZHMgRGl2aWRlciB7IGdldCBpc1NpemVyICgpIHsgcmV0dXJuIHRydWUgfSB9XG4iLCIndXNlIHN0cmljdCdcblxuZXhwb3J0cy5jcmVhdGUgPSBjcmVhdGVcblxuZnVuY3Rpb24gY3JlYXRlIChub2RlKSB7XG4gIHJldHVybiBuZXcgU2l6ZXIobm9kZSlcbn1cblxuY2xhc3MgU2l6ZXIge1xuICBjb25zdHJ1Y3RvciAobm9kZSkge1xuICAgIHRoaXMubm9kZSA9IG5vZGVcbiAgICB0aGlzLmVsID0gdGhpcy5ub2RlLmVsXG4gICAgdGhpcy5wcmV2Tm9kZSA9IHRoaXMubm9kZS5wcmV2RmxleFNpYlxuICAgIHRoaXMubmV4dE5vZGUgPSB0aGlzLm5vZGUubmV4dEZsZXhTaWJcbiAgICB0aGlzLnZlcnRpY2FsID0gdGhpcy5ub2RlLnBhcmVudC5pc1Jvd1xuICAgIHRoaXMucm9vdCA9IHRoaXMuZWwub3duZXJEb2N1bWVudFxuICAgIHRoaXMuZHJhZ2dpbmcgPSBmYWxzZVxuICAgIHRoaXMuaW5zdGFsbEhhbmRsZXJzKClcbiAgfVxuXG4gIGluc3RhbGxIYW5kbGVycyAoKSB7XG4gICAgdGhpcy5tb3VzZURvd24gPSB0aGlzLm1vdXNlRG93bi5iaW5kKHRoaXMpXG4gICAgdGhpcy5tb3VzZU1vdmUgPSB0aGlzLm1vdXNlTW92ZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5tb3VzZU91dCA9IHRoaXMubW91c2VPdXQuYmluZCh0aGlzKVxuICAgIHRoaXMubW91c2VMZWF2ZSA9IHRoaXMubW91c2VMZWF2ZS5iaW5kKHRoaXMpXG5cbiAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMubW91c2VEb3duLCBmYWxzZSlcbiAgfVxuXG4gIG1vdXNlTW92ZSAoZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQgPT0gbnVsbCkgZXZlbnQgPSB3aW5kb3cuZXZlbnRcbiAgICAvLyBjb25zb2xlLmxvZygnbW91c2VNb3ZlOicsIGV2ZW50KVxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICAgaWYgKCF0aGlzLmRyYWdnaW5nKSByZXR1cm5cbiAgICBpZiAoKGV2ZW50LmJ1dHRvbnMgJiAxKSA9PT0gMCkgcmV0dXJuIHRoaXMuZHJhZ0RvbmUoZXZlbnQpXG5cbiAgICBjb25zdCBkcmFnQ3VyciA9IHRoaXMudmVydGljYWwgPyBldmVudC5wYWdlWCA6IGV2ZW50LnBhZ2VZXG4gICAgY29uc3QgZGlmZiA9IGRyYWdDdXJyIC0gdGhpcy5kcmFnTGFzdFxuICAgIHRoaXMuZHJhZ0xhc3QgPSBkcmFnQ3VyclxuXG4gICAgY29uc3QgcHJldkZsZXggPSBOdW1iZXIodGhpcy5wcmV2Tm9kZS5lbC5zdHlsZS5mbGV4R3JvdylcbiAgICBjb25zdCBuZXh0RmxleCA9IE51bWJlcih0aGlzLm5leHROb2RlLmVsLnN0eWxlLmZsZXhHcm93KVxuICAgIHRoaXMucHJldk5vZGUuZWwuc3R5bGUuZmxleEdyb3cgPSBwcmV2RmxleCArIDIgKiBkaWZmXG4gICAgdGhpcy5uZXh0Tm9kZS5lbC5zdHlsZS5mbGV4R3JvdyA9IG5leHRGbGV4IC0gMiAqIGRpZmZcblxuICAgIGNvbnNvbGUubG9nKGBkcmFnOiAke2RpZmZ9YClcbiAgICBjb25zb2xlLmxvZyhgdXBkYXRlIHByZXYgZmxleCB2YWx1ZTogJHt0aGlzLnByZXZOb2RlLm5hbWV9OiAke3RoaXMucHJldk5vZGUuZWwuc3R5bGUuZmxleEdyb3d9YClcbiAgICBjb25zb2xlLmxvZyhgdXBkYXRlIG5leHQgZmxleCB2YWx1ZTogJHt0aGlzLm5leHROb2RlLm5hbWV9OiAke3RoaXMubmV4dE5vZGUuZWwuc3R5bGUuZmxleEdyb3d9YClcbiAgfVxuXG4gIG1vdXNlRG93biAoZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQgPT0gbnVsbCkgZXZlbnQgPSB3aW5kb3cuZXZlbnRcbiAgICAvLyBjb25zb2xlLmxvZygnbW91c2VEb3duOicsIGV2ZW50KVxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICAgaWYgKHRoaXMuZHJhZ2dpbmcpIHJldHVyblxuICAgIHRoaXMuZHJhZ2dpbmcgPSB0cnVlXG5cbiAgICB0aGlzLmRyYWdMYXN0ID0gdGhpcy52ZXJ0aWNhbCA/IGV2ZW50LnBhZ2VYIDogZXZlbnQucGFnZVlcblxuICAgIHRoaXMucm9vdC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlTW92ZSwgZmFsc2UpXG4gICAgdGhpcy5yb290LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0JywgdGhpcy5tb3VzZU91dCwgZmFsc2UpXG4gICAgdGhpcy5yb290LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLm1vdXNlTGVhdmUsIGZhbHNlKVxuXG4gICAgdGhpcy5yZXNldEZsZXhWYWx1ZXMoKVxuICB9XG5cbiAgLy8gY2hhbmdlIGFsbCB0aGUgZmxleCB2YWx1ZXMgZm9yIHRoaXMgbm9kZSdzIHBlZXJzIHRvIGJlIHRoZWlyIGFjdHVhbCBzaXplXG4gIHJlc2V0RmxleFZhbHVlcyAoKSB7XG4gICAgY29uc3QgZmxleFBlZXJzID0gdGhpcy5ub2RlLnBhcmVudC5jaGlsZHJlblxuICAgICAgLmZpbHRlcihjaGlsZCA9PiBjaGlsZC5pc0ZsZXgpXG5cbiAgICAvLyBnZXQgdGhlIGV4aXN0aW5nIGxlbmd0aHNcbiAgICBjb25zdCBsZW5ndGhzID0gbmV3IE1hcCgpXG4gICAgZm9yIChsZXQgcGVlciBvZiBmbGV4UGVlcnMpIHtcbiAgICAgIGNvbnN0IGxlbmd0aCA9IHRoaXMudmVydGljYWwgPyBwZWVyLmVsLmNsaWVudFdpZHRoIDogcGVlci5lbC5jbGllbnRIZWlnaHRcbiAgICAgIGxlbmd0aHMuc2V0KHBlZXIsIGxlbmd0aClcbiAgICB9XG5cbiAgICAvLyBzZXQgYXMgZmxleEdyb3dcbiAgICBmb3IgKGxldCBwZWVyIG9mIGZsZXhQZWVycykge1xuICAgICAgcGVlci5lbC5zdHlsZS5mbGV4R3JvdyA9IGxlbmd0aHMuZ2V0KHBlZXIpXG4gICAgICBjb25zb2xlLmxvZyhgcmVzZXQgICAgICAgZmxleCB2YWx1ZTogJHtwZWVyLm5hbWV9OiAke3BlZXIuZWwuc3R5bGUuZmxleEdyb3d9YClcbiAgICB9XG4gIH1cblxuICBkcmFnRG9uZSAoZXZlbnQpIHtcbiAgICBjb25zb2xlLmxvZygnZHJhZ0RvbmU6JywgZXZlbnQpXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICBpZiAoIXRoaXMuZHJhZ2dpbmcpIHJldHVyblxuICAgIHRoaXMuZHJhZ2dpbmcgPSBmYWxzZVxuXG4gICAgdGhpcy5yb290LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMubW91c2VNb3ZlLCBmYWxzZSlcbiAgICB0aGlzLnJvb3QucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCB0aGlzLm1vdXNlT3V0LCBmYWxzZSlcbiAgICB0aGlzLnJvb3QucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMubW91c2VMZWF2ZSwgZmFsc2UpXG4gIH1cblxuICBtb3VzZU91dCAoZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQgPT0gbnVsbCkgZXZlbnQgPSB3aW5kb3cuZXZlbnRcbiAgICAvLyBjb25zb2xlLmxvZygnbW91c2VPdXQ6JywgZXZlbnQpXG5cbiAgICBpZiAoZXZlbnQudGFyZ2V0ICE9PSB0aGlzLnJvb3QpIHJldHVyblxuXG4gICAgdGhpcy5kcmFnRG9uZShldmVudClcbiAgfVxuXG4gIG1vdXNlTGVhdmUgKGV2ZW50KSB7XG4gICAgaWYgKGV2ZW50ID09IG51bGwpIGV2ZW50ID0gd2luZG93LmV2ZW50XG4gICAgLy8gY29uc29sZS5sb2coJ21vdXNlTGVhdmU6JywgZXZlbnQpXG5cbiAgICBpZiAoZXZlbnQudGFyZ2V0ICE9PSB0aGlzLnJvb3QpIHJldHVyblxuXG4gICAgdGhpcy5kcmFnRG9uZShldmVudClcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmV4cG9ydHMucGFyc2UgPSBwYXJzZVxuXG5jb25zdCBOb2RlcyA9IHJlcXVpcmUoJy4vbm9kZXMnKVxuXG4vLyBpbnB1dDpcbi8vXG4vLyBgXG4vLyAgIGNvbCBtYWluIC0+IGhlYWQgbmF2czoxIGJvZHk6MyBmb290XG4vLyAgIHJvdyBuYXZzIC0+IG5hdkw6MSBuYXZSOjFcbi8vIGBcbi8vXG4vLyBvdXRwdXQ6XG4vLyB7IGVycjogXCJhbiBlcnJvciBtZXNzYWdlXCJ9XG4vLyBvclxuLy8geyB0cmVlOiB0aGVUcmVlIH1cblxuLy8gcmV0dXJucyB7IHRyZWUsIGVyciB9XG5mdW5jdGlvbiBwYXJzZSAoc3BlYykge1xuICBpZiAodHlwZW9mIHNwZWMgIT09ICdzdHJpbmcnKSByZXR1cm4ge2VycjogJ3NwZWMgaXMgbm90IGEgc3RyaW5nJ31cblxuICAvLyBzYW5pdGl6ZSBpbnB1dCBsaW5lc1xuICBjb25zdCBsaW5lcyA9IGAke3NwZWN9YC5zcGxpdCgnXFxuJylcbiAgICAvLyByZW1vdmUgY29tbWVudHMgYW5kIGxlYWRpbmcvdHJhaWxpbmcgd2hpdGVzcGFjZVxuICAgIC5tYXAobGluZSA9PiBsaW5lLnNwbGl0KCcjJylbMF0udHJpbSgpKVxuICAgIC8vIHJlbW92ZSBlbXB0eSBsaW5lc1xuICAgIC5maWx0ZXIobGluZSA9PiBsaW5lICE9PSAnJylcblxuICBpZiAobGluZXMubGVuZ3RoID09PSAwKSByZXR1cm4ge2VycjogJ3NwZWMgaGFzIG5vIGxpc3RzJ31cblxuICAvLyBwYXJzZSBlYWNoIGxpbmUgaW50byBhIGxpc3QsIGFkZCBsaXN0cyB0byBtYXAgYnkgbmFtZVxuICBjb25zdCBsaXN0cyA9IG5ldyBNYXAoKVxuICBsZXQgaGVhZCA9IG51bGxcbiAgZm9yIChsZXQgbGluZSBvZiBsaW5lcykge1xuICAgIGNvbnN0IGxpc3QgPSBwYXJzZUxpc3QobGluZSlcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4geyBlcnI6IGBwYXJzZSBlcnJvciBvbiBsaW5lIFwiJHtsaW5lfVwiYCB9XG5cbiAgICBpZiAoaGVhZCA9PSBudWxsKSBoZWFkID0gbGlzdFxuICAgIGxpc3RzLnNldChsaXN0Lm5hbWUsIGxpc3QpXG4gIH1cblxuICAvLyBjb252ZXJ0IGxpc3RzIGludG8gdHJlZVxuICBjb25zdCB0cmVlID0gdG9UcmVlKGxpc3RzLCBudWxsLCBoZWFkLm5hbWUsIDEwMClcblxuICAvLyBjb252ZXJ0IGRpdmlkZXJzIHRvIHNpemVyc1xuICBzZXRTaXplcnModHJlZSlcblxuICByZXR1cm4geyB0cmVlOiB0cmVlIH1cbn1cblxuZnVuY3Rpb24gc2V0U2l6ZXJzICh0cmVlKSB7XG4gIGlmICghdHJlZS5pc1Jvd09yQ29sKSByZXR1cm5cblxuICAvLyBjb252ZXJ0IGRpdmlkZXJzIHRvIHNpemVycyBhcyBhcHByb3ByaWF0ZVxuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgdHJlZS5jaGlsZHJlbi5sZW5ndGg7IGluZGV4KyspIHtcbiAgICBjb25zdCBjaGlsZCA9IHRyZWUuY2hpbGRyZW5baW5kZXhdXG4gICAgc2V0U2l6ZXJzKGNoaWxkKVxuICAgIGlmICghY2hpbGQuaXNEaXZpZGVyKSBjb250aW51ZVxuICAgIGlmIChjaGlsZC5wcmV2RmxleFNpYiA9PSBudWxsKSBjb250aW51ZVxuICAgIGlmIChjaGlsZC5uZXh0RmxleFNpYiA9PSBudWxsKSBjb250aW51ZVxuXG4gICAgLy8gcmVwbGFjZSBkaXZpZGVyIHdpdGggc2l6ZXJcbiAgICB0cmVlLmNoaWxkcmVuW2luZGV4XSA9IE5vZGVzLmNyZWF0ZVNpemVyKGNoaWxkLnBhcmVudClcbiAgfVxufVxuXG5mdW5jdGlvbiB0b1RyZWUgKGxpc3RzLCBwYXJlbnQsIG5hbWUsIGZsZXgpIHtcbiAgY29uc3QgbGlzdCA9IGxpc3RzLmdldChuYW1lKVxuXG4gIGxldCBub2RlXG4gIHN3aXRjaCAobGlzdC50eXBlKSB7XG4gICAgY2FzZSAncm93Jzogbm9kZSA9IE5vZGVzLmNyZWF0ZVJvdyhwYXJlbnQsIG5hbWUsIGZsZXgpOyBicmVha1xuICAgIGNhc2UgJ2NvbCc6IG5vZGUgPSBOb2Rlcy5jcmVhdGVDb2wocGFyZW50LCBuYW1lLCBmbGV4KTsgYnJlYWtcbiAgfVxuXG4gIGxldCBmaXJzdCA9IHRydWVcbiAgZm9yIChsZXQgY2hpbGQgb2YgbGlzdC5jaGlsZHJlbikge1xuICAgIGxldCBjaGlsZE5vZGVcbiAgICBpZiAobGlzdHMuaGFzKGNoaWxkLm5hbWUpKSB7XG4gICAgICBjaGlsZE5vZGUgPSB0b1RyZWUobGlzdHMsIG5vZGUsIGNoaWxkLm5hbWUsIGNoaWxkLmZsZXgpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNoaWxkTm9kZSA9IE5vZGVzLmNyZWF0ZUNlbGwobm9kZSwgY2hpbGQubmFtZSwgY2hpbGQuZmxleClcbiAgICB9XG5cbiAgICBpZiAoZmlyc3QpIHtcbiAgICAgIGZpcnN0ID0gZmFsc2VcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZS5jaGlsZHJlbi5wdXNoKE5vZGVzLmNyZWF0ZURpdmlkZXIobm9kZSkpXG4gICAgfVxuXG4gICAgbm9kZS5jaGlsZHJlbi5wdXNoKGNoaWxkTm9kZSlcbiAgfVxuXG4gIHJldHVybiBub2RlXG59XG5cbi8vIGlucHV0OiAncm93IG1haW4gLT4gaGVhZCBuYXZzOjEgYm9keTozIGZvb3QnXG4vLyBvdXRwdXQgeyB0eXBlOiAncm93JywgbmFtZTogJ21haW4nLCBjaGlsZHJlbjogWydoZWFkJywgJ25hdnM6MScsIC4uLl19XG5mdW5jdGlvbiBwYXJzZUxpc3QgKGxpbmUpIHtcbiAgbGluZSA9IGxpbmUudHJpbSgpXG4gIGNvbnN0IG1hdGNoID0gbGluZS5tYXRjaCgvXiguKyktPiguKykkLylcbiAgaWYgKG1hdGNoID09IG51bGwpIHJldHVybiBudWxsXG5cbiAgY29uc3QgZGVmID0gbWF0Y2hbMV1cbiAgICAuc3BsaXQoL1xccysvKVxuICAgIC5maWx0ZXIocyA9PiBzICE9PSAnJylcblxuICBjb25zdCBjaGlsZHJlbiA9IG1hdGNoWzJdXG4gICAgLnNwbGl0KC9cXHMrLylcbiAgICAuZmlsdGVyKHMgPT4gcyAhPT0gJycpXG5cbiAgaWYgKGRlZi5sZW5ndGggIT09IDIpIHJldHVybiBudWxsXG5cbiAgY29uc3QgcmVzdWx0ID0ge1xuICAgIHR5cGU6IGRlZlswXSxcbiAgICBuYW1lOiBkZWZbMV0sXG4gICAgY2hpbGRyZW46IFtdXG4gIH1cblxuICBpZiAocmVzdWx0LnR5cGUgIT09ICdyb3cnICYmIHJlc3VsdC50eXBlICE9PSAnY29sJykgcmV0dXJuIG51bGxcblxuICBsZXQgZmxleFRvdGFsID0gMFxuICBmb3IgKGxldCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgIGNvbnN0IG5vZGUgPSBwYXJzZU5vZGUoY2hpbGQpXG4gICAgaWYgKG5vZGUgPT0gbnVsbCkgcmV0dXJuIG51bGxcblxuICAgIHJlc3VsdC5jaGlsZHJlbi5wdXNoKG5vZGUpXG5cbiAgICBmbGV4VG90YWwgKz0gKG5vZGUuZmxleCA9PSBudWxsID8gMCA6IG5vZGUuZmxleClcbiAgfVxuXG4gIC8vIG5vcm1hbGl6ZSBjaGlsZCBmbGV4IHZhbHVlc1xuICBmb3IgKGxldCBub2RlIG9mIHJlc3VsdC5jaGlsZHJlbikge1xuICAgIGlmIChub2RlLmZsZXggPT0gbnVsbCkgY29udGludWVcblxuICAgIG5vZGUuZmxleCA9IE1hdGgucm91bmQoMTAwICogbm9kZS5mbGV4IC8gZmxleFRvdGFsKVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vLyBwYXJzZSBuYW1lOjEgaW50byBbICduYW1lJywgMSBdXG5mdW5jdGlvbiBwYXJzZU5vZGUgKHN0cmluZykge1xuICBpZiAoc3RyaW5nLmluZGV4T2YoJzonKSA9PT0gLTEpIHJldHVybiB7IG5hbWU6IHN0cmluZyB9XG4gIGNvbnN0IG1hdGNoID0gc3RyaW5nLm1hdGNoKC9eKC4rKTooLispJC8pXG4gIGlmIChtYXRjaCA9PSBudWxsKSByZXR1cm4gbnVsbFxuXG4gIGNvbnN0IG5hbWUgPSBtYXRjaFsxXVxuICBjb25zdCBmbGV4ID0gcGFyc2VGbG9hdChtYXRjaFsyXSlcblxuICBpZiAoaXNOYU4oZmxleCkpIHJldHVybiBudWxsXG5cbiAgcmV0dXJuIHsgbmFtZTogbmFtZSwgZmxleDogZmxleCB9XG59XG5cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkgdGVzdCgpXG5cbmZ1bmN0aW9uIHRlc3QgKCkge1xuICBjb25zdCBzcGVjID0gYFxuICAgIGNvbCBtYWluIC0+IGhlYWQgbmF2czoxIGJvZHk6MyBmb290XG4gICAgcm93IG5hdnMgLT4gbmF2TDoxIG5hdlI6MVxuICBgXG5cbiAgY29uc3QgdHJlZSA9IHBhcnNlKHNwZWMpXG4gIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRyZWUsIG51bGwsIDEpKVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbi8vIHVzZWQgd2l0aCBhIGJ1bmRsZXIgdG8gYnVpbGQgYSBzdGFuZGFsb25lIHNjcmlwdCB3aGljaCBhZGRzIHRoZSByb2FuY29cbi8vIG1vZHVsZSBleHBvcnRzIGFzIGEgZ2xvYmFsIG9iamJlY3Rcblxud2luZG93LnJvYW5jbyA9IHJlcXVpcmUoJy4uJylcbiIsIm1vZHVsZS5leHBvcnRzPXtcbiAgXCJuYW1lXCI6IFwicm9hbmNvXCIsXG4gIFwidmVyc2lvblwiOiBcIjAuMC4xXCIsXG4gIFwiZGVzY3JpcHRpb25cIjogXCJST3dzIEFOZCBDT2x1bW5zIGZvciB0aGUgd2ViXCIsXG4gIFwibGljZW5zZVwiOiBcIk1JVFwiLFxuICBcImF1dGhvclwiOiBcIlBhdHJpY2sgTXVlbGxlciA8cG11ZWxsckBhcGFjaGUub3JnPiAoaHR0cHM6Ly9naXRodWIuY29tL3BtdWVsbHIpXCIsXG4gIFwiaG9tZXBhZ2VcIjogXCJodHRwczovL2dpdGh1Yi5jb20vcG11ZWxsci9yb2FuY29cIixcbiAgXCJtYWluXCI6IFwicm9hbmNvLmpzXCIsXG4gIFwicmVwb3NpdG9yeVwiOiB7XG4gICAgXCJ0eXBlXCI6IFwiZ2l0XCIsXG4gICAgXCJ1cmxcIjogXCJodHRwczovL2dpdGh1Yi5jb20vcG11ZWxsci9yb2FuY28uZ2l0XCJcbiAgfSxcbiAgXCJidWdzXCI6IHtcbiAgICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9wbXVlbGxyL3JvYW5jby9pc3N1ZXNcIlxuICB9LFxuICBcInNjcmlwdHNcIjoge1xuICAgIFwiYnVpbGRcIjogXCJtYWtlIGJ1aWxkXCIsXG4gICAgXCJzdGFuZGFyZFwiOiBcIm1ha2Ugc3RhbmRhcmRcIixcbiAgICBcInRlc3RcIjogXCJtYWtlIHRlc3RcIixcbiAgICBcIndhdGNoXCI6IFwibm9kZW1vbiAtLWV4ZWMgJ21ha2UgYnVpbGQgfHwgdHJ1ZSdcIlxuICB9LFxuICBcInN0YW5kYXJkXCI6IHtcbiAgICBcImlnbm9yZVwiOiBbXG4gICAgICBcIi90bXAvXCIsXG4gICAgICBcIi9kb2NzL1wiLFxuICAgICAgXCIvbm9kZV9tb2R1bGVzL1wiLFxuICAgICAgXCIvcm9hbmNvLXN0YW5kYWxvbmUuanNcIlxuICAgIF1cbiAgfSxcbiAgXCJkZXBlbmRlbmNpZXNcIjoge30sXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcImJyb3dzZXJpZnlcIjogXCJ+MTQuNC4wXCIsXG4gICAgXCJjYXQtc291cmNlLW1hcFwiOiBcIn4wLjEuMlwiLFxuICAgIFwibm9kZW1vblwiOiBcIn4xLjExLjBcIixcbiAgICBcInN0YW5kYXJkXCI6IFwifjEwLjAuM1wiLFxuICAgIFwidGFwLXNwZWNcIjogXCJ+NC4xLjFcIixcbiAgICBcInRhcGVcIjogXCJ+NC43LjBcIlxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxuY29uc3QgcGtnID0gcmVxdWlyZSgnLi9wYWNrYWdlLmpzb24nKVxuXG5leHBvcnRzLnZlcnNpb24gPSBwa2cudmVyc2lvblxuZXhwb3J0cy5jcmVhdGUgPSBjcmVhdGVcblxuY29uc3Qgc3BlY1BhcnNlciA9IHJlcXVpcmUoJy4vbGliL3NwZWMtcGFyc2VyJylcbmNvbnN0IGVsZW1lbnRCdWlsZGVyID0gcmVxdWlyZSgnLi9saWIvZWxlbWVudC1idWlsZGVyJylcblxuLy8gZ2l2ZW4gYSBzcGVjIGFuZCBvcHRpb25zLCByZXR1cm4gYSBSb2FuY28gb2JqZWN0XG5mdW5jdGlvbiBjcmVhdGUgKHNwZWMsIG9wdHMpIHtcbiAgY29uc3QgcmVzdWx0ID0gc3BlY1BhcnNlci5wYXJzZShzcGVjLCBvcHRzKVxuICBpZiAocmVzdWx0LmVycikgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5lcnIpXG5cbiAgcmV0dXJuIG5ldyBSb2FuY28oc3BlYywgcmVzdWx0LnRyZWUsIG9wdHMpXG59XG5cbi8vIGNsYXNzIG9mIG9iamVjdCByZXR1cm5lZCBmcm9tIHRoZSBjcmVhdGUoKSBhcGlcbmNsYXNzIFJvYW5jbyB7XG4gIGNvbnN0cnVjdG9yIChzcGVjLCB0cmVlLCBvcHRzKSB7XG4gICAgdGhpcy5fc3BlYyA9IHNwZWNcbiAgICB0aGlzLl90cmVlID0gdHJlZVxuICAgIHRoaXMuX29wdHMgPSBvcHRzIHx8IHt9XG5cbiAgICBlbGVtZW50QnVpbGRlci5idWlsZCh0aGlzLl90cmVlLCB0aGlzLl9vcHRzKVxuXG4gICAgdGhpcy5fcGF0aHMgPSBuZXcgTWFwKClcbiAgICBidWlsZFBhdGhzKHRoaXMuX3BhdGhzLCB0aGlzLl90cmVlLCBbXSlcbiAgfVxuXG4gIC8vIGdpdmVuIGEgcGF0aCwgcmV0dXJuIHRoZSBlbGVtZW50IGluIHRoZSB0cmVlXG4gIGVsIChwYXRoKSB7XG4gICAgY29uc3Qgbm9kZSA9IHRoaXMuX3BhdGhzLmdldChwYXRoKVxuICAgIGlmIChub2RlID09IG51bGwpIHJldHVybiBudWxsXG5cbiAgICByZXR1cm4gbm9kZS5lbFxuICB9XG5cbiAgLy8gcmV0dXJuIHRoZSBwYXRocyB0byBhbGwgdGhlIG5vZGVzIGluIHRoZSB0cmVlXG4gIGdldCBwYXRocyAoKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5fcGF0aHMua2V5cygpKVxuICB9XG5cbiAgLy8gcmV0dXJuIHRoZSBjdXJyZW50IG1hcHBpbmcgb2YgZWxlbWVudCBwYXRocyAtPiBmbGV4IHZhbHVlc1xuICBnZXQgZmxleE1hcCAoKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge31cblxuICAgIGZvciAobGV0IHBhdGggb2YgdGhpcy5wYXRocykge1xuICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuX3BhdGhzLmdldChwYXRoKVxuICAgICAgaWYgKG5vZGUuZmxleCA9PSBudWxsKSBjb250aW51ZVxuXG4gICAgICByZXN1bHRbcGF0aF0gPSBub2RlLmZsZXhcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICAvLyByZXR1cm4gYSBzcGVjIGZvciB0aGUgY3VycmVudCBvYmplY3RcbiAgZ2V0IHNwZWMgKCkge1xuICAgIHJldHVybiB0aGlzLl9zcGVjXG4gIH1cbn1cblxuLy8gZ2l2ZW4gYSB0cmVlLCBwb3B1bGF0ZSBhIG1hcCBvZiBwYXRocyBvZiBub2RlcyAtPiBub2RlXG5mdW5jdGlvbiBidWlsZFBhdGhzIChtYXAsIHRyZWUsIGN1cnJlbnRQYXRoKSB7XG4gIGNvbnN0IHRoaXNQYXRoID0gY3VycmVudFBhdGguY29uY2F0KHRyZWUubmFtZSlcblxuICBtYXAuc2V0KHRoaXNQYXRoLmpvaW4oJy8nKSwgdHJlZSlcbiAgaWYgKHRyZWUuY2hpbGRyZW4gPT0gbnVsbCkgcmV0dXJuXG5cbiAgZm9yIChsZXQgY2hpbGQgb2YgdHJlZS5jaGlsZHJlbikge1xuICAgIGJ1aWxkUGF0aHMobWFwLCBjaGlsZCwgdGhpc1BhdGgpXG4gIH1cbn1cbiJdfQ==
