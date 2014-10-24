/**
 * Created by Hanwen on 01.07.2014.
 */
define(["bst"],function (BinarySearchTree) {
    /**
     * Constructor
     * @param {Object} [options] config map
     * @param {Number}  options.minLength the shortest length of the fragment.
     * @param {Number}  options.minOccurrence the minimum occurrence of the fragment.
     * @constructor
     */
    function SuffixTrie(options) {
        this.options = options || {};

        this.structure = {};
        this.minLENGTH = this.options.minLength === undefined ? 5 : options.minLength;
        this.minOccurrence = this.options.minOccurrence === undefined ? 5 : options.minOccurrence;
        this.debug = true; //TODO

        this.save = [];
        this.array = null;
        this.labelArray = null;
        this.fragmentsArray = null;
        this.fragmentTrie = {};
        this.rebuildArray;

        //default test environment
        if (this.debug) {
            this.minLENGTH = 3;
            this.minOccurrence = 2;
        }
    }

//    ======================================================================================================================
//    ==================================================== Public Functions ================================================
//    ======================================================================================================================
    /**
     * add fragment string to the trie
     * @param array {Array} adding word
     */
    SuffixTrie.prototype.build = function (array) {
        this.buildLabelTrie(array);
        this.optimize(this.structure);
        console.log('after optimization our label trie of array length ' + this.array.length + ' is ', this.structure);

        this.listLabel();
        console.log('get the compressed label array (without duplicate fragments ) of array length ' + this.array.length + ' is ', this.labelArray);
        console.log('and fragments array of length ' + this.fragmentsArray.length + ' is ', this.fragmentsArray);

        this.clearRedundantFragment();
        console.log('get the cleared label array (without duplicate fragments ) of array length ' + this.array.length + ' is ', this.labelArray);
        console.log('and cleared fragments array of length ' + this.fragmentsArray.length + ' is ', this.fragmentsArray);

        this.rebuild();
        console.log('rebuild ended' , this.rebuildArray);
    };

    SuffixTrie.prototype.buildLabelTrie = function (array) {
        this.array = array;
        var root = this.structure;
        var LENGTH = this.minLENGTH;

        array.forEach(function (word, index) {
            var first = true;
            //used to store the loop element, for connect the suffixes, e.g. 'foob' next is 'oob', by this connection, we get all the substrings.
            var last = {};

            //loop every suffix in one word, e.g. 'oss' in 'boss'
            for (var i = 0, l = word.length; i <= l - LENGTH; i++) {
                var cur = root;
                var suffix = word.substring(i);
                var letters = suffix.split("");

                //loop every letter in the suffix, e.g. 'o' in 'oss'
                for (var j = 0; j < letters.length; j++) {
                    var letter = letters[j], pos = cur[ letter ];

                    if (j === letters.length - 1) {
                        if (pos == null) {
                            //create new node and add the information.
                            cur[letter] = {source: [index], listed: false};
                        } else if (pos.hasOwnProperty('source')) {
                            //just add occurrence
                            pos["source"].push(index);
                        } else {
                            //node already existed, add information.
                            cur[letter]['source'] = [index];
                            cur[letter]['listed'] = false;
                        }
                        cur = cur[letter];

                        if (!first) {
                            last['next'] = suffix;
                        } else {
                            first = false;
                        }

                        last = cur;
                    } else if (pos == null) {
                        //create node
                        cur = cur[letter] = {};
                    } else {
                        //no creation, loop to next node
                        cur = cur[ letter ];
                    }
                }
            }
        });

    };

    /**
     * add the origin for the split node and trunk node && integrate prefix in each branch
     * @param {Object} root the start node
     * @param {Number} [rootLevel] the start level of the algorithm, should be -1
     * @returns {Array} array with the origin of the word
     *
     */
    SuffixTrie.prototype.optimize = function (root, rootLevel) {
        var occurrence = this.minOccurrence;
        //self origin indexes
        var self_save = [];
        rootLevel = rootLevel === undefined ? -1 : rootLevel;
        rootLevel++;
        //whether the word is long enough. ignored the short part.
        var is_allowed = rootLevel >= this.minLENGTH;

        for (var child in root) {

            if (root.hasOwnProperty(child)) { //&& child !== 'next' && child !== 'level'
                //loop to new child and combine the index information
                if (child.length === 1) {

                    // returned indexes from children (iterate from the leaf)
                    var children_save = this.optimize(root[child], rootLevel);
                    if (is_allowed) {
                        self_save = self_save.concat(children_save);
                    }
                } else if (child === 'source' && is_allowed) {
                    self_save = self_save.concat(root['source']);
                }
            }
        }

        // this part is to test if the fragment fulfil the occurrence requirement, delete if not, which reduce time significantly.
        self_save = uniqueArray(self_save);
        var isEnoughOccurred = self_save.length >= occurrence;
        is_allowed = is_allowed && isEnoughOccurred;

        if (is_allowed) {
            //leaf will at least has property of 'listed' and 'next'
            var is_SoleNode = Object.keys(root).length === 1;
            if (!is_SoleNode) {
                //this is a split node or a flaged node, add information include source here
                root['source'] = self_save;   //update it
                root['level'] = rootLevel;
                root['listed'] = false;     //indicate this node should be check
                root['weight'] = self_save.length * rootLevel;
                self_save = [];     //clear the array: this is important if we don't want the node with former indexes!
            } else {
                //this is just a sole node with one child, do nothing
            }
        }
        else {
            //it is lower than the request level , or it is a leaf node, so not calculate here
            delete root['source'];
        }

        return self_save;
    };

    /**
     * list the repeat part with certain order && integrate suffix in 'next' branch
     * @param {Number} [start] start point in the array [0 - array.length]
     */
    SuffixTrie.prototype.listLabel = function (start) {
        var array = this.array;
        var root = this.structure;
        var label_array = [];
        var fragments_array = [];
        var length = this.minLENGTH;
        var occurrence = this.minOccurrence;
        start = start === undefined ? 1 : start;

        //loop from the certain index, lead to different rebuild array.
        for (var index = start - 1, i = 0; i < array.length; index++, index = index % (array.length), i++) {
            var word = array[index];

            var fragments = {};
            //skip the short word, just push the empty object.
            if (word.length < length) {
                label_array.push(fragments);
                continue;
            }

            findFragments(word, fragments, root, length, occurrence, false);

            //accumulate the fragment to another array.
            for (var fragment in fragments) {
                if (fragments.hasOwnProperty(fragment)) {
                    //get all the origin label index and push them into fragment array with default order
                    var fragmentsArrayIndex = fragments_array.push(fragments[fragment]) - 1;
                    fragments_array[fragmentsArrayIndex]['name'] = fragment;
                }
            }

            //build another array to map each label and all of its fragments.
            label_array.push(fragments);
        }
        this.labelArray = label_array;
        this.fragmentsArray = fragments_array;
        return label_array;
    };

    /**
     * rebuild the label array, make sure every label has all of its own fragments
     */
    SuffixTrie.prototype.rebuild = function () {
        var rebuildArray = JSON.parse(JSON.stringify(this.labelArray));//deep copy array
        rebuildArray.forEach(function (object, index) {
            for (var fragment in object) {
                if (object.hasOwnProperty(fragment)) {
                    object[fragment]['source'].forEach(function (labelIndex) {
                        if (labelIndex > index) {
                            rebuildArray[labelIndex][fragment] = object[fragment];
                        }
                    });
                }
            }
        });
        this.rebuildArray = rebuildArray;
    };

    /**
     * weight the fragments and order them by the product of their occurrence and length,
     * should use this function after the build and rebuild.
     * @param {Number} [variable] return the first several fragments if set.
     */
    SuffixTrie.prototype.weightByAverage = function (variable) {

        var fragmentsArray = this.fragmentsArray;
        fragmentsArray.sort(function (f1, f2) {
            return f2['weight'] - f1['weight'];
        });
        console.log('weight by average:  result of length ' + fragmentsArray.length + ' is', fragmentsArray);

        variable = variable || fragmentsArray.length;
            return fragmentsArray.slice(0, variable);
    };

    /**
     * weight the fragments and order them by max label length.
     * @param {Number} [variable] decide how many fragments should be list here. Default is all.
     */
    SuffixTrie.prototype.weightByMax = function (variable) {

        buildFragmentTrie(this.fragmentTrie, this.fragmentsArray);

        var rebuildArray = JSON.parse(JSON.stringify(this.rebuildArray));
//        var rebuildArray = this.rebuildArray;
        var fragmentsArray = [];
        var fragmentsTrie = this.fragmentTrie;
        var fragments_Num = this.fragmentsArray.length;
        var label_Lengths = this.array.map(function (s) {
            return s.length;
        });

        var label_Tree = new BinarySearchTree();
        label_Lengths.forEach(function (length, index) {
            label_Tree.insert(length, index);
        });

        if (variable !== undefined) fragments_Num = variable < fragments_Num ? variable : fragments_Num;

        while (fragmentsArray.length < fragments_Num) {
            var maxKey = label_Tree.getMaxKey();

            var labels_In_Key = label_Tree.search(maxKey);

            if (labels_In_Key.length === 0) {
                label_Tree.delete(maxKey);
                continue;
            }
            //choose a random labels index with the biggest length
            var longest_Label = labels_In_Key[0];

            //get all the fragments in this label
            //in case the there is no fragments under it.
            var fragments = Object.keys(rebuildArray[longest_Label]);
            if (fragments.length > 0) {
                //then find the longest fragment
                fragments.sort(function (f1, f2) {
                    return f2.length - f1.length;
                });
                removeTrie(fragments[0], fragmentsTrie, fragmentsArray, label_Lengths, rebuildArray, label_Tree);
            }
            //in case there is no this label in fragments array -- which could be possible
            label_Tree.delete(maxKey, longest_Label);
        }

        this.fragmentsArray = fragmentsArray;
        console.log('weight by max:  result of length ' + fragmentsArray.length + ' is', fragmentsArray);

        return fragmentsArray.slice(0, fragments_Num);
    };

    /**
     *  delete the redundant fragment, always keep the longer one.
     */
    SuffixTrie.prototype.clearRedundantFragment = function () {
        var fragments = this.fragmentsArray;
        var occurrence = this.minOccurrence;
        var newFragmentArray = [];
        var labelArray = this.labelArray;
        //sort the fragments array from short to long.
        fragments.sort(function (a, b) {
            return a.name.length - b.name.length;
        });

        fragments.forEach(function (fragment, index) {
            //backup fragment's occurrence.
            var backupsource = fragment.source.slice();
            //check if the longer contain duplicated occurrence, filter such occurrence
            for (var i = index + 1; i < fragments.length; i++) {
                var longerFragment = fragments[i];
                if (longerFragment.name.indexOf(fragment.name) !== -1) {
                    fragment.source = fragment.source.filter(function (i) {
                        return this.indexOf(i) === -1;
                    }, longerFragment.source);
                }
            }

            //build the new fragment array with no duplication
            if (fragment.source.length >= occurrence) {
                newFragmentArray.push(fragment);
            }
            else {
                if (backupsource.length !== fragment.source.length) {
                    deleteFragmentInLabelArray(backupsource, fragment.name, labelArray);
                }
            }
        });
        this.fragmentsArray = newFragmentArray;
    };

//    ======================================================================================================================
//    ==================================================== Helper Functions ================================================
//    ======================================================================================================================

    /**
     * Most Important Helper function
     * help function to find the all the fragment of one word from the root of the tree, and finally link to another suffix
     * @param word searching objects
     * @param fragments an object to store the sources of the common fragments in the path to find the word
     * @param root start point
     * @param length minimum length requirement
     * @param occurrence minimum occurrence requirement
     * @param [iterate] {Boolean} whether it is the complete word or suffix
     */
    function findFragments(word, fragments, root, length, occurrence, iterate) {

        var cur = root;
        var letters = word.split("");
        //loop every letter in the suffix, e.g. 'o' in 'oss'
        for (var j = 0; j < letters.length; j++) {
            var letter = letters[j], pos = cur[ letter ];
            if (j + 1 >= length) {
                var fragment = word.substring(0, j + 1);

                if (pos.hasOwnProperty('listed')) {
                    if (!pos['listed']) {
                        //if it is a node fulfil our requirement
                        if (pos.hasOwnProperty('source')) {
                            fragments[fragment] = {};
                            fragments[fragment]['source'] = pos.source;
                            fragments[fragment]['weight'] = pos['weight'];

                            //debug whether we include all the situation.
                            if (pos['weight'] == null) {
                                console.warn('escape case! fragment does not has weight property, node is ', fragments[fragment]);
                            }
                            if (fragments.hasOwnProperty(fragment)) {
                                //if this is not the full word (but a suffix) we check the duplication
                                if (iterate) {
                                    for (var property in fragments) {
                                        if (property !== fragment && fragments.hasOwnProperty(property) && fragments.hasOwnProperty(fragment)) {
                                            if (property.indexOf(fragment) !== -1) {
                                                fragments[fragment]['source'] = fragments[fragment]['source'].filter(function (i) {
                                                    return this.indexOf(i) < 0
                                                }, fragments[property].source);
                                            }
                                        }
                                    }

                                    if (fragments[fragment]['source'].length < occurrence) {
                                        delete fragments[fragment];
                                    }
                                }
                            }
                            pos['listed'] = true;
                        }
                        //iterate to its suffix from root
                        if (pos.hasOwnProperty('next')) {
                            findFragments(pos['next'], fragments, root, length, occurrence, true);
                        }
                    }
                }
            }
            cur = pos;
        }
    }

    /**
     * A helper function to delete the reference in Label Array
     * @param {Array} source fragment.source
     * @param {String} name fragment.name
     * @param labelArray LabelArray
     */
    function deleteFragmentInLabelArray(source, name, labelArray) {
        var label = labelArray[source[0]];
        if (label.hasOwnProperty(name)) {
            delete label[name];
        }
    }

    /**
     * Helper function for build a dictionary trie for searching the fragment.
     * @param trie the fragment trie will be build in this variable.
     * @param array the fragment array used for building trie.
     */
    function buildFragmentTrie(trie, array) {
        for (var i = 0; i < array.length; i++) {

            var word = array[i]['name'], letters = word.split(""), cur = trie;

            // Loop through the letters
            for (var j = 0; j < letters.length; j++) {
                var letter = letters[j];

                if (!cur.hasOwnProperty(letter)) {
                    cur[ letter ] = {};
                }
                cur = cur[letter];
                if (j === letters.length - 1) {
                    cur['source'] = array[i]['source'];
                    cur['name'] = array[i]['name'];
                    cur['weight'] = array[i]['weight'];
                    cur['list'] = false;
                }

            }
        }
    }

    /**
     * Helper function to remove the fragment from the trie and list it in the result array (fragmentsArray).
     * @param word the word to be searched for.
     * @param cur the node where the search start.
     * @param array the array to store the result fragment
     * @param labelLengthArray the array map to the length of the label
     * @param rebuildArray this.rebuildArray
     * @param label_trie the binary search trie where store all the labels with their length.
     * @returns {Number|Boolean} if find return the length of fragment, else return false.
     */
    function removeTrie(word, cur, array, labelLengthArray, rebuildArray, label_trie) {
        for (var node in cur) {

            if (cur.hasOwnProperty(node) && node.length === 1) {

                if (word.indexOf(node) === 0) {
                    //if this is the leaf of the trie
                    if (word.length === 1) {
                        if (cur[node].hasOwnProperty('list')) {
                            var fragment = {};
                            fragment['source'] = cur[node]['source'];
                            var fragmentName = cur[node]['name'];
                            fragment['name'] = fragmentName;
                            fragment['weight'] = cur[node]['weight'];
                            delete cur[node]['list'];
                            //store it into our result
                            array.push(fragment);

                            //for other node who has same fragment
                            cur[node]['source'].forEach(function (indexLabel) {
                                //delete the fragment reference in the label
                                delete rebuildArray[indexLabel][fragmentName];
                                //update the label length in the trie
                                var labelLength = labelLengthArray[indexLabel];
                                label_trie.delete(labelLength, indexLabel);
                                labelLength -= fragmentName.length;
                                label_trie.insert(labelLength, indexLabel);
                            });
                        }
                    } else {
                        removeTrie(word.slice(1), cur[node], array, labelLengthArray, rebuildArray, label_trie);
                    }
                }

            }
        }
    }

    /**
     * Helper function to remove the repeat elements in an array
     * @param {Array} array
     * @returns {Array} the result array without duplicate elments
     */
    function uniqueArray(array) {
        var a = array.concat();
        for (var i = 0; i < a.length; ++i) {
            for (var j = i + 1; j < a.length; ++j) {
                if (a[i] === a[j])
                    a.splice(j--, 1);
            }
        }
        return a;
    }


//  A examine function to test if the fragment Array has name repeat fragment
//    function checkRepeat(fragmentArray) {
//        var nameArray = fragmentArray.map(function (object) {
//            return object['name'];
//        });
//        var sorted_arr = nameArray.sort();
//
//        // JS by default uses a crappy string compare.
//        var results = [];
//        for (var i = 0; i < nameArray.length - 1; i++) {
//            if (sorted_arr[i + 1] == sorted_arr[i]) {
//                results.push(sorted_arr[i]);
//            }
//        }
//        return(results);
//    }

    return SuffixTrie;
});
