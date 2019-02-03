# common-substrings

[![npm version](https://badge.fury.io/js/common-substrings.svg)](https://badge.fury.io/js/common-substrings)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg?maxAge=2592000)](https://opensource.org/licenses/MIT)

a method for finding all common strings for Javascript and node.js, particularly quick for large string samples.
**It works in both web and node environment**.

In version 2.0, the algorithms have been updated, now it uses a two dimension trie to get all the fragment.
The vertical one is the standard suffix trie, but all the node of the last word in each suffix is linked,
which I call them virtually horizontally linked.

With new algorithms, previous bugs are fixed, speed is improved dramatically.
The code is rewritten with ES6 module, easier to maintain.
If you work with large samples, you may copy the source code instead of using npm packages to get the benefit of `var` optimization.

## Usage


#### Quickstart


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


#### Example Result
If we have the array `['java', 'javascript','pythonscript']`, using the default options, we will get result array:

```json
  [
    {name : 'java', source : [0,1], weight : 8},
    {name : 'script', source : [1,2], weight : 10}
  ]
```

the default options are:

- `minLength` : 3
- `minOccurrence` : 2

#### Backward Compatibility
Since there is some algorithms error in version 1.0, I do not offer support for it,
anyway, for using it, the change is minor.

#### Demo
The demo works only with version 1, but it will still can be a good demo for the purpose of the library.
A practical demo is placed in demo folder, and I already download mongoose for windows here.

If you have any questions, please contact my email: heawen.cheng@gmail.com, I will response as soon as possible :)

## License

The algorithm code is under The MIT License
