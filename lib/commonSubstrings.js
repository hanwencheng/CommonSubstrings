var SuffixTrie;
SuffixTrie = (function() {

    /**
     * Constructor
     * @param {Object} [options] config map
     * @param {Number}  options.minLength the shortest length of the fragment.
     * @param {Number}  options.minOccurrence the minimum occurrence of the fragment.
     * @constructor
     */
    function SuffixTrie(options) {
        this.options = options || {};

        this.count = 0;
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
        if(this.debug) {
            this.minLENGTH = 3;
            this.minOccurrence = 2;
        }
    }

    /**
     * add fragment string to the trie
     * @param array {Array} adding word
     */
    SuffixTrie.prototype.build = function(array){
        this.buildLabelTrie(array);
        markTime('build end');
        this.optimize(this.structure); //
        markTime('optimize end');
        console.log('after optimization our label trie of array length ' + this.array.length + ' is ' + this.structure);
        this.listLabel();
        markTime('list end');
        console.log('get the compressed label array (without duplicate fragments ) of array length ' + this.array.length + ' is ' , this.labelArray);
        console.log('and fragments array of length ' + this.fragmentsArray.length  + ' is ' ,  this.fragmentsArray);

    };

    SuffixTrie.prototype.buildLabelTrie = function(array){
        this.array = array;
        var root = this.structure;
        var LENGTH = this.minLENGTH;
        var debug = this.debug;

        array.forEach(function(word, index){
            var first = true;
            //used to store the loop element, for connect the suffixes, e.g. 'foob' next is 'oob', by this connection, we get all the substrings.
            var last = {};
            if(debug) console.info('----start word :'+word);

            //loop every suffix in one word, e.g. 'oss' in 'boss'
            for ( var i = 0, l = word.length; i <= l- LENGTH; i++ ) {
                var cur = root;
                var suffix = word.substring(i);
                var letters = suffix.split("");
                if(debug) console.info('--start suffix:'+suffix);

                //loop every letter in the suffix, e.g. 'o' in 'oss'
                for ( var j = 0; j < letters.length; j++ ) {
                    var letter = letters[j], pos = cur[ letter ];

                    if(j === letters.length - 1){
                        if(pos == null){
                            cur[letter] = {$:[index],listed:false};
                            if(debug) console.log('  end--create new with flag :' + letter);
                        }else if(pos.hasOwnProperty('$')){
                            pos["$"].push(index);
                            if(debug) console.log('  end--add occurrence $ : '+letter);
                        }else {
                            cur[letter]['$'] = [index];
                            cur[letter]['listed'] = false;
                            if(debug) console.log('  end--create flag : ' + letter);
                        }
                        cur = cur[letter];

                        if(!first){
                            last['next']=suffix;
                        }else{
                            first = false;
                        }

                        last = cur;
                    } else if( pos == null ) {
                        cur = cur[letter] = {};
                        if(debug) console.log('  prefix--create new : '+letter);
                    } else {
                        cur = cur[ letter ];
                        if(debug) console.log('  prefix--no creation : '+letter);
                    }
                }
            }
        });

    };

    /**
     * add the origin for the split node and trunk node
     * @param {Object} root the start node
     * @param {Number} [rootLevel] the start level of the algorithm, should be -1
     * @returns {Array} array with the origin of the word
     *
     */
    SuffixTrie.prototype.optimize = function(root, rootLevel){
        var debug = this.debug;
        var occurrence = this.minOccurrence;
        //self origin indexes
        var self_save = [];
        rootLevel = rootLevel === undefined ? -1 : rootLevel;
        rootLevel++;
        //whether the word is long enough. ignored the short part.
        var is_allowed = rootLevel >= this.minLENGTH;

        for(var child in root){

            if(root.hasOwnProperty(child) ){ //&& child !== 'next' && child !== 'level'
                if(debug) console.info('loop to child : '+ child + ' of root : ' , root);

                if(child.length === 1 && child !=='$' ){

                    // returned indexes from children
                    var children_save = this.optimize(root[child],rootLevel) ;
                    if(is_allowed){
                        self_save = self_save.concat(children_save);
                    }
                }else if( child === '$' && is_allowed){
                    self_save = self_save.concat(root['$']);
                }
            }
        }

        // this part is to test if the fragment fulfil the occurrence requirement, delete if not, which reduce time significantly.
        self_save = uniqueArray(self_save);
        var isEnoughOccurred = self_save.length >= occurrence;
        is_allowed = is_allowed&& isEnoughOccurred;

        if(is_allowed ){
            //TODO leaf will at least has property of 'listed' and 'next'
            var is_SoleNode = Object.keys(root).length === 1;
            if(!is_SoleNode)
            {
                //add information include $ here
                root['$'] = self_save;   //update it
                root['level'] = rootLevel;
                root['listed'] = false;     //in case the split node do not have level property
                root['weight'] = self_save.length * rootLevel;

                if(debug) console.warn('-----this is a split node or a flaged node:' + rootLevel , root );
            }else{
                if(debug) console.warn('-----this is just a sole node with one child:' + rootLevel , root, self_save); // no escape situation
            }
        }
        else{
            delete root['$'];
            if(debug) console.log('!!------it is lower than the request level , or it is a leaf node, so not calculate here:' , root);
        }

        return self_save;

    };

    /**
     * list the repeat part with certain order
     * @param {Number} [start] start point in the array [0 - array.length]
     */
    SuffixTrie.prototype.listLabel = function(start){
        var array = this.array;
        var root = this.structure;
        var debug = this.debug;
        var label_array = [];
        var fragments_array = [];
        var length = this.minLENGTH;
        start = start === undefined ? 1 : start;

        //loop from the certain index
        for(var index = start-1, i = 0; i < array.length; index++, index = index%array.length,i++){
            var word = array[index];

            if(debug) console.info('--start word:'+word);

            var fragments = {};

            //skip the short word
            if(word.length < length ) {
                if(debug) console.log('word' + word +  'is too short');
                label_array.push(fragments);
                continue;
            }

            findFragments(word, fragments, root, length, false);

            //accumulate the fragment to another array.
            for(var fragment in fragments){
                if (fragments.hasOwnProperty(fragment)) {
                    var fragmentsArrayIndex = fragments_array.push(fragments[fragment]) - 1;
                    fragments_array[fragmentsArrayIndex]['name'] = fragment;
                }
            }

            //build another array to map each label and all of its fragments.
            label_array.push(fragments);
            if(debug) console.log('fragment for word ' + word + ' is ',fragments);
        }
        this.labelArray = label_array;
        this.fragmentsArray = fragments_array;
        return label_array;
    };

    /**
     * help function to find the all the fragment of one word from the root of the tree, and finally link to another suffix
     * @param word searching objects
     * @param fragments an object to store the sources of the common fragments in the path to find the word
     * @param root start point
     * @param length minimum length requirement
     * @param iterate {Boolean} whether it is the complete word or suffix
     */
    var findFragments = function(word, fragments, root, length, iterate){

        var cur = root;
        var letters = word.split("");
        //loop every letter in the suffix, e.g. 'o' in 'oss'
        for ( var j = 0; j < letters.length; j++ ) {
            var letter = letters[j], pos = cur[ letter ];
            if(j + 1 >= length ){

                var fragment = word.substring(0 , j + 1);

                if(pos.hasOwnProperty('listed')){
                    if(!pos['listed']) {
                        if(pos.hasOwnProperty('$')){
                            fragments[fragment] = {};
                            fragments[fragment]['$'] = pos['$'];
                            fragments[fragment]['weight'] = pos['weight'];
                            //debug whether we include all the situation.
                            if( pos['weight'] == null){
                                console.warn('escape case! fragment does not has weight property, node is ' , fragments[fragment]);
                            }
                        }
                        if(pos.hasOwnProperty('next') ){
                            findFragments(pos['next'],fragments, root, length, true);
                        }

                        //a judgement for deleting the repeat useless fragment.
                        if(iterate){
//                            if(j === letters.length - 1){
                                for(var property in fragments){
                                    if(property !== fragment && fragments.hasOwnProperty(property)&&fragments.hasOwnProperty(fragment)){
                                        if(property.indexOf(fragment)!== -1&& fragments[property]['$'].length === fragments[fragment]['$'].length){
//                                            console.log('delete ' + fragment +  ' cos repeat with ' + property + ' in the array' , fragments);
                                            delete fragments[fragment];

                                            break;
                                        }
                                    }
                                }
//                            }
                        }
                    }
                    pos['listed'] = true;
                }

            }

            cur = pos;
        }
    };


    /**
     * find certain fragment in the tree TODO
     * @param word object node
     * @param cur root node
     * @returns {Array} return all the previous element which direct to this word
     */
//    SuffixTrie.prototype.find = function(word , cur){
//        var result = [];
////        findNode(word, cur, result);
//        return result;
//    };


    /**
     * rebuild the label array, make sure every label has all of its own fragments
     */
    SuffixTrie.prototype.rebuild = function(){
//        var rebuildArray = this.labelArray.slice();
        var rebuildArray = JSON.parse(JSON.stringify(this.labelArray));//deep copy array
        rebuildArray.forEach(function(object, index){
           for(var fragment in object){
               if(object.hasOwnProperty(fragment)){
                   object[fragment]['$'].forEach(function(labelIndex){
                       if(labelIndex > index){
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
     */
    SuffixTrie.prototype.weightByAverage = function(){
        var fragmentsArray = this.fragmentsArray;
        fragmentsArray.sort(function(f1,f2){
            return f2['weight'] - f1['weight'];
        });
        console.log('weight by average:  result of length ' +fragmentsArray.length + ' is' , fragmentsArray);
    };

    /**
     * weight the fragments and order them by max label length.
     * @param {Number} [variable] decide how many fragments should be list here. Default is all.
     */
    SuffixTrie.prototype.weightByMax = function(variable){
        markTime('build trie for weight start');
        buildFragmentTrie(this.fragmentTrie, this.fragmentsArray);
        if(debug) console.log('our fragment dictionary Trie is', this.fragmentTrie);
        markTime('build trie for weight end');
//
//        markTime('deep copy array start');
//        var rebuildArray = jQuery.extend(true, {}, this.rebuildArray);
//        markTime('deep copy array end');
        var rebuildArray = this.rebuildArray;

        var debug = this.debug;
        var fragmentsArray = [];
        var fragmentsTrie = this.fragmentTrie;
        var fragments_Num = this.fragmentsArray.length;
        var label_Lengths = this.array.map(function(l){
            if(debug) console.log('length of' + l + ' is '+ l.length);
            return l.length;
        });
        if(debug) console.log('fragments number is' + fragments_Num);

//        var label_Tree = new BinTree(function(i1,i2){return label_Lengths[i2] - label_Lengths[i1];});
        var label_Tree = new BinarySearchTree();

        this.array.forEach(function(l,index){
            label_Tree.insert(label_Lengths[index], index);
//            if(!success)console.log("insert result is " + success + 'and total tree size is '+label_Tree.size) ;
        });
        if(debug) console.log(label_Tree.getNumberOfKeys() + 'our weight max RB tree is',label_Tree);

        if(variable) fragments_Num = variable < fragments_Num? variable : fragments_Num;

        while(fragmentsArray.length < fragments_Num){
//            var longest_Label = label_Tree.max();
            var maxKey = label_Tree.getMaxKey();

            if(maxKey == null){
                console.log(label_Tree.getNumberOfKeys());
                break;
            }

            var max_Des = label_Tree.getMaxKeyDescendant();
            var labels_In_Key = label_Tree.search(maxKey);
            var longest_Label = labels_In_Key.sort(function (a, b) { return b.length - a.length; })[0];
            if(debug) console.log('max key is:' + maxKey + ', and max descendant is : ' + max_Des + ', max key data is:' + longest_Label
             + ', labels in key is a array like : ' + labels_In_Key);
            if(debug) console.dir(max_Des);

            var fragments = Object.keys(rebuildArray[longest_Label]);
            fragments.sort(function(f1,f2){return f2.length - f1.length;});

            var fragment_Length = 0;
            var is_found = fragments.some(function(fragment){
                fragment_Length = removeTrie(fragment, fragmentsTrie, fragmentsArray);
                return fragment_Length;  //TODO what mutable variable in the closure?
            });

            if(debug) console.log('is_found is:' + is_found + ',fragmentsArray length is', fragmentsArray);
//            label_Tree.remove(longest_Label);

            label_Tree.delete(maxKey, longest_Label);

            if(is_found){
                label_Lengths[longest_Label] -= fragment_Length;
                label_Tree.insert(label_Lengths[longest_Label], longest_Label);
            }

        }

        this.fragmentsArray = fragmentsArray;
        console.log('weight by max:  result of length ' +fragmentsArray.length + ' is' , fragmentsArray);
    };

    /**
     * Helper function for build a dictionary trie for searching the fragment.
     * @param trie the fragment trie will be build in this variable.
     * @param array the fragment array used for building trie.
     */
    var buildFragmentTrie = function(trie, array){
        for ( var i = 0, l = array.length; i < l; i++ ) {
            var word = array[i]['name'], letters = word.split(""), cur = trie;

            // Loop through the letters
            for ( var j = 0; j < letters.length; j++ ) {
                var letter = letters[j];

                if ( !cur.hasOwnProperty(letter)) {
                    cur[ letter ] = {};
                }
                cur = cur[letter];
                if(j === letters.length - 1){
                    cur['$'] = array[i]['$'];
                    cur['name'] = array[i]['name'];
                    cur['weight'] = array[i]['weight'];
                    cur['list'] = false;
                }

            }
        }

    };

    /**
     * Helper function to remove the fragment from the trie and list it in the result array (fragmentsArray).
     * @param word the word to be searched for.
     * @param cur the node where the search start.
     * @param array the array to store the result fragment
     * @returns {Number|Boolean} if find return the length of fragment, else return false.
     */
    var removeTrie = function(word, cur, array){
        for ( var node in cur ) {
            if(cur.hasOwnProperty(node)&& node.length === 1 && node !== '$'){

                if ( word.indexOf( node ) === 0 ) {
                    if ( node.length === word.length && cur[node].hasOwnProperty('list') ) {
                        // Return 'true' only if we've reached a final leaf
                        array.push(cur[node]);
                        var length = cur[node]['name'].length;
                        delete cur[node]['list']; //warn : also delete the reference in the array
                        return length;
                    } else {
                        return removeTrie( word.slice( node.length ), cur[node], array );
                    }
                }

            }
        }

        return false;
    };


    //
    /**
     * Helper function to remove the repeat elements in an array
     * @param {Array} array
     * @returns {Array} the result array without duplicate elments
     */
    var uniqueArray = function(array){
        var a = array.concat();
        for(var i=0; i<a.length; ++i) {
            for(var j=i+1; j<a.length; ++j) {
                if(a[i] === a[j])
                    a.splice(j--, 1);
            }
        }
        return a;
    };

    return SuffixTrie;
}());
