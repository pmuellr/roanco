'use strict'

exports.parse = parse

// input:
//
// {
//   main: 'col: head navs@nav:1 body:3 foot',
//   navs: 'row: nav1:1 nav2:1'
// }
//
// output:
// { err: "an error message"}
// or
// {
//  "tree": { "name": "main", "flex": null, "el": null, "children":
//   [
//    { "name": "head", "flex": null, "el": null, "children": []},
//    { "name": "nav", "flex": 1, "el": null, "children":
//     [
//      { "name": "nav1", "flex": 1, "el": null, "children": [] },
//      { "name": "nav2", "flex": 1, "el": null, "children": [] }
//     ]
//    },
//    { "name": "body", "flex": 3, "el": null, "children": [] },
//    { "name": "foot", "flex": null, "el": null, "children": [] }
//   ]
//  }
// }

// returns { tree, err }
function parse (spec) {
  if (spec == null) return {err: 'spec is null'}

  const lists = new Map()
  for (let name in spec) {
    const result = parseList(name, spec[name])
    if (result.err != null) return result

    lists.set(name, result.list)
  }

  const err = validateLists(lists)
  if (err) return { err: err }

  return { tree: toTree(lists, 'main', null, lists.get('main')) }
}

function toTree (lists, name, flex, list) {
  let tree

  if (list.type === 'row') tree = new Row(name, flex)
  else if (list.type === 'col') tree = new Col(name, flex)

  for (let child of list.children) {
    if (child.type == null) {
      tree.children.push(new Cell(child.name, child.flex))
    } else {
      tree.children.push(toTree(lists, child.name, child.flex, lists.get(child.type)))
    }
  }

  return tree
}

function validateLists (lists) {
  if (!lists.has('main')) return `no list named "main"`

  // make sure the type exists for typed children
  for (let name of lists.keys()) {
    const list = lists.get(name)

    for (let child of list.children) {
      if (child.type == null) continue
      if (lists.get(child.type) == null) {
        return `in list ${name}, element type ${child.type} is not valid`
      }
    }
  }
}

//   main: 'col: head navs:1 body:3 foot',
const ListRegex = /^((row)|(col))\s*:\s*(.*)$/

function parseList (name, list) {
  if (list == null) {
    return { err: `list ${name} has a null value` }
  }

  list = `${list}`.trim()

  const match = list.match(ListRegex)
  if (match == null) {
    return { err: `list ${name} must start with "row:" or "col:"` }
  }

  const type = match[1]
  const parts = match[4].trim()
  if (parts === '') {
    return { err: `list ${name} has no child elements` }
  }

  const children = []
  for (let part of parts.split(/\s+/g)) {
    const element = parseElement(part)
    if (element == null) {
      return { err: `list ${name} has invalid child element "${part}"` }
    }

    children.push(element)
  }

  return {
    list: {
      name: name,
      type: type,
      children: children
    }
  }
}

const ElementRegex1 = /^(.+?)@(.+):(\d+)$/
const ElementRegex2 = /^(.+?):(\d+)$/
const ElementRegex3 = /^(.+?)@(.+)$/

// parse name, name:12, type@name, type@name:12
function parseElement (string) {
  const element = {
    name: null,
    flex: null,
    type: null
  }

  string = string.trim()
  let match

  match = string.match(ElementRegex1)
  if (match) {
    element.type = match[1]
    element.name = match[2]
    element.flex = parseInt(match[3])
    return element
  }

  match = string.match(ElementRegex2)
  if (match) {
    element.name = match[1]
    element.flex = parseInt(match[2])
    return element
  }

  match = string.match(ElementRegex3)
  if (match) {
    element.type = match[1]
    element.name = match[2]
    return element
  }

  element.name = string
  return element
}

class Cell {
  constructor (name, flex) {
    this.name = name
    this.flex = flex
    this.el = null
    this.children = []
  }

  get isCell () { return true }

  get isRow () { return false }

  get isCol () { return false }
}

class Row extends Cell {
  get isRow () { return true }

  get isCell () { return false }
}

class Col extends Cell {
  get isCol () { return true }

  get isCell () { return false }
}

if (require.main === module) test()

function test () {
  const spec = {
    main: 'col: head navs@nav:1 body:3 foot',
    navs: 'row: nav1:1 nav2:1'
  }

  const tree = parse(spec)
  console.log(JSON.stringify(tree, null, 1))
}
