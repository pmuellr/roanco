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
