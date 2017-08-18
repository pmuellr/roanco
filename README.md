roanco - ROws ANd COlumns for the web
================================================================================

Creates HTML elements which are nested rows and columns, where row and column
elements can either be sized based on their content, or set to a ratio of
remaining size.

usage
================================================================================

```js
const roanco = require('roanco')

// this spec describes a set of rows: header/navs/body/footer, where:
// * header and footer are sized to fit their content
// * navs and body fill to fit the container, navs: 1/4, body: 3/4

// the navs element is a set of columns nav1/nav2, where:
// * both nav elements fill to fit the container, and are the same size
const spec = {
  main: { type: 'rows', header: -1, navs: 1, body: 3, footer: -1 },
  navs: { type: 'cols', nav1: 1, nav2: 1 }
}

const spec = {
  main: { col: 'head navs:1 body:3 foot' },
  navs: { row: 'nav1:1 nav2:1' }
}

const spec = {
  main: 'col: head navs:1 body:3 foot',
  navs: 'row: nav1:1 nav2:1'
}

const spec = roanco`
  col: main - head navs:1 body:3 foot
  row: navs - nav1:1 nav2:1
`

// create the elements
const container = roanco.create(spec)

// set the content of the elements
container.el('header').innerHTML = 'header'
container.el('body').innerHTML = 'body'
container.el('footer').innerHTML = 'footer'
container.el('navs.nav1').innerHTML = 'nav 1'
container.el('navs.nav2').innerHTML = 'nav 2'

// other styling here ...

// display the elements
document.getElementById('container').appendChild(container.el())
```

![result of running example code](test/fixtures/prototype/screen-cap.gif)

install
================================================================================

    npm install pmuellr/roanco


api
================================================================================

## module exports

The module exports the following properties and functions:

### `version`

The version of the package

### `create(spec)`

Creates a new `Roanco` object, given the supplied `spec` argument.

## `Roanco` objects

`Roanco` objects are created from ...

### `el(path)`

Returns a ...


license
================================================================================

This package is licensed under the MIT license.  See the
[LICENSE.md](LICENSE.md) file for more information.


contributing
================================================================================

Awesome!  We're happy that you want to contribute.

Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for more information.
