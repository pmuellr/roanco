'use strict'

const specParser = require('../lib/spec-parser')

const utils = require('./lib/utils')

const runTest = utils.createTestRunner(__filename)

runTest(function testErrors (t) {
  let result

  result = specParser.parse(null)
  errMatch(t, result, 'spec is not a string')

  result = specParser.parse('')
  errMatch(t, result, 'spec has no lists')

  result = specParser.parse(`
  `)
  errMatch(t, result, 'spec has no lists')

  result = specParser.parse(`
    # just a comment
  `)
  errMatch(t, result, 'spec has no lists')

  result = specParser.parse(`
    main
  `)
  errMatch(t, result, 'parse error on line "main"')

  result = specParser.parse(`
    thing main
  `)
  errMatch(t, result, 'parse error on line "thing main"')

  result = specParser.parse(`
    row main ->
  `)
  errMatch(t, result, 'parse error on line "row main ->"')

  result = specParser.parse(`
    thing main -> cell
  `)
  errMatch(t, result, 'parse error on line "thing main -> cell"')

  result = specParser.parse(`
    row main bar -> cell
  `)
  errMatch(t, result, 'parse error on line "row main bar -> cell"')

  result = specParser.parse(`
    row main -> cell:foo
  `)
  errMatch(t, result, 'parse error on line "row main -> cell:foo"')

  t.end()
})

runTest(function testSimpleSpec (t) {
  const result = specParser.parse(`
    col main -> top mid:1 bot
  `)

  let root = result.tree
  t.ok(root, 'should be a tree property')

  nodeMatch(t, root, 'main', 100, 5)
  nodeMatch(t, root.children[0], 'top', undefined, 0)
  nodeMatch(t, root.children[1], undefined, undefined, 0)
  nodeMatch(t, root.children[2], 'mid', 100, 0)
  nodeMatch(t, root.children[3], undefined, undefined, 0)
  nodeMatch(t, root.children[4], 'bot', undefined, 0)

  t.ok(root.children[1].isDivider, 'child 1 should be a divider')
  t.ok(root.children[3].isDivider, 'child 3 should be a divider')

  t.end()
})

runTest(function testNestedSpec (t) {
  const result = specParser.parse(`
    col main -> head navs:1 body:2 foot
    row navs -> nav1:1 nav2:1
  `)

  let root = result.tree
  t.ok(root, 'should be a tree property')

  nodeMatch(t, root, 'main', 100, 7)
  nodeMatch(t, root.children[0], 'head', undefined, 0)
  nodeMatch(t, root.children[1], undefined, undefined, 0)
  nodeMatch(t, root.children[2], 'navs', 33, 3)
  nodeMatch(t, root.children[3], undefined, undefined, 0)
  nodeMatch(t, root.children[4], 'body', 67, 0)
  nodeMatch(t, root.children[5], undefined, undefined, 0)
  nodeMatch(t, root.children[6], 'foot', undefined, 0)

  t.ok(root.children[1].isDivider, 'child 1 should be a divider')
  t.ok(root.children[3].isDivider, 'child 3 should be a divider')
  t.ok(root.children[5].isDivider, 'child 5 should be a divider')

  t.ok(root.children[3].isSizer, 'child 3 should be a sizer')

  let navs = root.children[2].children
  nodeMatch(t, navs[0], 'nav1', 50, 0)
  nodeMatch(t, navs[1], undefined, undefined, 0)
  nodeMatch(t, navs[2], 'nav2', 50, 0)

  t.ok(navs[1].isDivider, 'navs 1 should be a divider')
  t.ok(navs[1].isSizer, 'navs 1 should be a sizer')

  t.end()
})

function errMatch (t, result, message) {
  if (result == null) return t.fail(`result was null, expecting message '${message}'`)
  if (result.err == null) return t.fail(`result.err was null, expecting message '${message}'`)
  t.equal(result.err, message, `result.err should match message '${message}'`)
}

function nodeMatch (t, cell, name, flex, children) {
  if (cell == null) return t.fail('cell is null')

  if (cell.name !== name) t.fail(`cell name should be "${name}" but was "${cell.name}"`)
  if (cell.flex !== flex) t.fail(`cell flex should be ${flex} but was ${cell.flex}`)

  const kids = cell.children ? cell.children.length : 0
  if (kids !== children) t.fail(`cell should have ${children} children, not ${kids} children`)

  t.pass(`cell matched expected value`)
}
