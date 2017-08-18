variations on input spec for DOM tree
================================================================================

```js
{
  main: 'col: head navs@nav:1 body:3 foot',
  navs: 'row: nav1:1 nav2:1'
}
```

```js
[
  'col:1',
  'head',
  [ 'row:1', 'navL:1', 'navR:1' ],
  'body:3',
  'foot'
]
```

```js
{ col_1: [
  'head',
  { row_1: [ 'navL:1', 'navR:1' ]},
  'body:3',
  'foot'
]}
```

```js
const b = roanco.builder

const tree = b.col('main:1', [
  'head',
  b.row('navs:1', [ 'navL:1', 'navR:1' ])
  'body:3',
  'foot'
])
```

```js
`
  col main -> head navs:1 body:3 foot
  row navs -> navL:1 navR:1
`
```

```js
`
col main
- head
- navs 1
- body 3
- foot

navs row
- navL 1
- navR 1
`
```
