common-substrings
================

####a method for finding all common strings for Javascript and node.js, which is particularly quick for large string samples.
================

###Usage

####Quickstart
Build the tree, then pass an array of strings to `tree.build()`. Then ask for a list of weighted results.

```javascript
var SuffixTrie= require('common-substrings');
var tree =  new SuffixTrie();
tree.build(array);
var fragmentResult1 = tree.weightByAverage();
var fragmentResult2 = tree.weightByMax();
```

####Methods
There are two methods to get the result fragments:
- `weightByAverage()` : rank the fragments by the product of the fragment length and fragment occurrence.
- `weightByMax()` : the process is trival, but main idea is to rank the longest fragment in the longest string to the first.

Both method return an Object array, each element in the array include :
- `source` : the index of the labels which contain this fragment,
- `name` : the name of the fragment,
- `weight` : the product of the fragment length and the fragment occurrence


####Configuration
You may set the options of the algorithm when initialization.

```javascript
var tree = new SuffixTrie({
  minLength : 5, //the minimum length of fragment
  minOccurrence : 3 , //the minimin occurrence of fragment
  debug : false  //whether to show the console messages
  });
```

  the default values are:
  - `minLength` : 3
  - `minOccurrence` : 2
  - `debug` : false

####Example Result
If we have the array `['java', 'javascript','pythonscript']`, using the default settings, we will get result array:

```json
  [
  {name : 'java', source : [0,1], weight : 8},
  {name : 'script', source : [1,2], weight : 10}
  ]
```

####Demo
A practical demo is placed in demo folder, and I already download mongoose for windows here.
You may use mongoose server to have a quick look on how to make the algorithm into practical. Don't forget to use console to see all the informations.

================

If you have any questions, please contact my email: heawen.cheng@gmail.com, I will response as soon as possible :)

###External Libraries

This uses Louis Chatriot's [binary search tree](https://github.com/louischatriot/node-binary-search-tree) as a dependency.

###License

The algorithm code is under The MIT License
