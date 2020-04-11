# common-substrings

![npm](https://img.shields.io/npm/dw/common-substrings.svg)
[![npm version](https://badge.fury.io/js/common-substrings.svg)](https://badge.fury.io/js/common-substrings)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg?maxAge=2592000)](https://opensource.org/licenses/MIT)

A method written in Typescript, used for finding all common strings for Javascript and node.js, particularly quick for large string samples.
**It works in both web and node environment and it has no dependencies**.

## Usage

### Quickstart


The easiest way to start is:

```javascript
import substrings from 'common-substrings';
const result = substrings(stringArray, {
  minOccurrence: 3,
  minLength: 5,
});
```

Result is listed as an Object array, each element in the array include :
- `source` : the index of the labels which contain this fragment,
- `name` : the name of the fragment,
- `weight` : the product of the fragment length and the fragment occurrence


### Example Result
If we have the array `['java', 'javascript','pythonscript']`, using the default options, we will get result array:

```javascript
  [
    {name : 'java', source : [0,1], weight : 8},
    {name : 'script', source : [1,2], weight : 10}
  ]
```

The default options are:

- `minLength` : 3
- `minOccurrence` : 2

Result is fetched from leaf to node of the trie, so it is not sorted, but it will be quite easy with lodash [sortBy](https://lodash.com/docs/4.17.11#sortBy) function , for example:
```javascript
    const resultSortByWeight = _.sortBy(result, ['weight']);
    const resultSortByLength = _.sortBy(result, substring => substring.name.length);
```

## Algorithm

Explanation [here](https://github.com/hanwencheng/gists/blob/master/find-all-common-substrings.md)

## Implementation in Other Language

* [Rust](https://github.com/hanwencheng/common_substrings_rust)

## License

The algorithm code is under The MIT License
