<a href="https://www.npmjs.com/package/common-substrings">npm</a>

# common-substrings

a method for finding all common strings for Javascript and node.js, which is particularly quick for large string samples.

## Usage

#### Quickstart


The easiest way to start is:

```javascript
var substrings = require('common-substrings');
var result = substrings.weigh(stringArray);
```

Result is listed as an Object array, each element in the array include :
- `source` : the index of the labels which contain this fragment,
- `name` : the name of the fragment,
- `weight` : the product of the fragment length and the fragment occurrence

#### Configuration

Following options is supported.

```javascript
var substrings = require('common-substrings');
var result = substrings.weigh(stringArray , {
  minLength : 5, //the minimum length of fragment
  minOccurrence : 3 , //the minimin occurrence of fragment
  debug : false  //whether to show the console messages
  limit : 10 //the number of element return, return all if 0 or false
  byLength : false // weigh by max longest fragment in longest string first.
  });
```

the default values are:

- `minLength` : 3
- `minOccurrence` : 2
- `debug` : false
- `byLength` : false
- `limit` : 0

#### Optimizing Calculation

For large string sample, a detail method could be used.
 
First build the tree, then pass an array of strings to `tree.build()`, which is required only once. Then ask for results with different listing order.


```javascript
var SuffixTrie = require('common-substrings').trie;
var tree =  new SuffixTrie();
tree.build(stringArray);
var fragmentResult1 = tree.weightByAverage();
var fragmentResult2 = tree.weightByMax();
```

There are two methods for listing the result objects, which are the common substring fragments:
- `weightByAverage()` : rank the fragments by the product of the fragment length and fragment occurrence.
- `weightByMax()` : Rank the longest fragment in the longest string to the first.





#### Example Result
If we have the array `['java', 'javascript','pythonscript']`, using the default settings, we will get result array:

```json
  [
  {name : 'java', source : [0,1], weight : 8},
  {name : 'script', source : [1,2], weight : 10}
  ]
```

#### Demo
A practical demo is placed in demo folder, and I already download mongoose for windows here.
You may use mongoose server to have a quick look on how to make the algorithm into practical. Don't forget to use console to see all the informations.

If you have any questions, please contact my email: heawen.cheng@gmail.com, I will response as soon as possible :)

## External Libraries

This uses `Louis Chatriot`'s [binary search tree](https://github.com/louischatriot/node-binary-search-tree) as a dependency.

## License

The algorithm code is under The MIT License
