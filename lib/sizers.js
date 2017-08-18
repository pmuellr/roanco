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
