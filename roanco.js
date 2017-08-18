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
