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
