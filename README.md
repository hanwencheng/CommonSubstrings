CommonSubstrings
================

####a method for finding all common strings for node.js
===
###Usage

Give the array as input parameter.

    var tree = new SuffixTrie();
    tree.build(array);
    var fragmentResult1 = tree.weightByAverage();
    var fragmentResult2 = tree.weightByMax();

There are two method to get the fragments:
- one is `weightByAverage()` : which rank the fragment by the product of the fragment length and fragment occurrence.
- one is `weightByMax()` : the process is trival, but main idea is rank the longest fragment in the longest string to the first.

Both method return an Object array, each element in the array include :  
  `source` : the index of the labels which contais this fragment,  
  `name` : the name of the fragment,  
  `weight` : the product of the fragment length and the fragment occurrence  
  
You may set the qualification of the fragment when initialization.
    var tree = new SuffixTrie({
        minLength : 5, minOccurrence : 3
    });

The default standard for fragment:
`minLength` : 3
`minOccurrence` : 2


###Extenal Librarys

###License

The MIT License
