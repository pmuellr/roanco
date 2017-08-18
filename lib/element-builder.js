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
