/**
 * Created by Hanwen on 01.07.2014.
 * as far there are no difference from the version 3.0
 */

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

        this.debug1 = false;

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
        console.log('after optimization our label trie of array length ' + this.array.length + ' is ' , this.structure);

        this.listLabel();
        markTime('list end');
        console.log('get the compressed label array (without duplicate fragments ) of array length ' + this.array.length + ' is ' , this.labelArray);
        console.log('and fragments array of length ' + this.fragmentsArray.length  + ' is ' ,  this.fragmentsArray);

        this.clearRedundantFragment();
        markTime('clear end');
        console.log('get the cleared label array (without duplicate fragments ) of array length ' + this.array.length + ' is ' , this.labelArray);
        console.log('and cleared fragments array of length ' + this.fragmentsArray.length  + ' is ' ,  this.fragmentsArray);
    };

    SuffixTrie.prototype.buildLabelTrie = function(array){
        this.array = array;
        var root = this.structure;
        var LENGTH = this.minLENGTH;
        var debug = this.debug1;

        array.forEach(function(word, index){
            var first = true;
            //used to store the loop element, for connect the suffixes, e.g. 'foob' next is 'oob', by this connection, we get all the substrings.
            var last = {};
            if(debug) {
                console.group('information in building trie');
                console.info('----start word :'+word);
            }

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
                            last['next'] = suffix;
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
            if(debug) console.groupEnd();
        });

    };

    /**
     * add the origin for the split node and trunk node && integrate prefix in each branch
     * @param {Object} root the start node
     * @param {Number} [rootLevel] the start level of the algorithm, should be -1
     * @returns {Array} array with the origin of the word
     *
     */
    SuffixTrie.prototype.optimize = function(root, rootLevel){
        var debug = this.debug1;
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

                    // returned indexes from children (iterate from the leaf)
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
        is_allowed = is_allowed && isEnoughOccurred;

        if(is_allowed ){
            //leaf will at least has property of 'listed' and 'next'
            var is_SoleNode = Object.keys(root).length === 1;
            if(!is_SoleNode)
            {
                //add information include $ here
                root['$'] = self_save;   //update it
                root['level'] = rootLevel;
                root['listed'] = false;     //indicate this node should be check
                root['weight'] = self_save.length * rootLevel;
                self_save = [];//TODO clear the array: this is important if we don't want the node with former indexes!
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
     * list the repeat part with certain order && integrate suffix in 'next' branch
     * @param {Number} [start] start point in the array [0 - array.length]
     */
    SuffixTrie.prototype.listLabel = function(start){
        var array = this.array;
        var root = this.structure;
        var debug = this.debug;
        var label_array = [];
        var fragments_array = [];
        var length = this.minLENGTH;
        var occurrence = this.minOccurrence;
        start = start === undefined ? 1 : start;

        //loop from the certain index TODO
        for(var index = start - 1, i = 0; i < array.length; index++, index = index%(array.length),i++){
            var word = array[index];

            if(debug) console.info('--start word:'+word);

            var fragments = {};

            //skip the short word, just push the empty object.
            if(word.length < length ) {
                if(debug) console.log('word' + word +  'is too short');
                label_array.push(fragments);
                continue;
            }

            findFragments(word, fragments, root, length, occurrence, false);

            //accumulate the fragment to another array.
            for(var fragment in fragments){
                if (fragments.hasOwnProperty(fragment)) {
                    //get all the origin label index and push them into fragment array with default order TODO sort them with a default order
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
     * @param occurrence minimum occurrence requirement
     * @param iterate {Boolean} whether it is the complete word or suffix
     */
    var findFragments = function(word, fragments, root, length, occurrence, iterate){

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
//                            if(!fragments.hasOwnProperty(fragment) &&  !pos['listed'] ){
                                fragments[fragment] = {};
                                fragments[fragment]['$'] = pos.$;
                                fragments[fragment]['weight'] = pos['weight'];
//                            }

                            //debug whether we include all the situation.
                            if( pos['weight'] == null){
                                console.warn('escape case! fragment does not has weight property, node is ' , fragments[fragment]);
                            }
                            if(fragments.hasOwnProperty(fragment)){

                                if(iterate){
                                    for(var property in fragments){
                                        if(property !== fragment && fragments.hasOwnProperty(property) && fragments.hasOwnProperty(fragment)){
                                            if(property.indexOf(fragment)!== -1){
                                                fragments[fragment]['$'] = fragments[fragment]['$'].filter(function(i){
                                                    return fragments[property]['$'].indexOf(i) < 0
                                                });
                                            }
                                        }
                                    }

                                    if (fragments[fragment]['$'].length < occurrence){
                                        delete fragments[fragment];
//                                        pos['listed'] = true;
                                    }
                                }
                            }
                            pos['listed'] = true;
                        }
                        if(pos.hasOwnProperty('next') ){
//                            var listedIndex =
//                            if(pos['$'])
                             findFragments(pos['next'],fragments, root, length, occurrence, true);
                        }

                    }

                }

            }

            cur = pos;
        }
    };


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
     * @param {Number} [variable] return the first several fragments if set.
     */
    SuffixTrie.prototype.weightByAverage = function(variable){

        var fragmentsArray = this.fragmentsArray;
        fragmentsArray.sort(function(f1,f2){
            return f2['weight'] - f1['weight'];
        });
        console.log('weight by average:  result of length ' +fragmentsArray.length + ' is' , fragmentsArray);

        if(variable !== undefined){
            return fragmentsArray.slice(0,variable);
        }
    };

    /**
     * weight the fragments and order them by max label length.
     * @param {Number} [variable] decide how many fragments should be list here. Default is all.
     */
    SuffixTrie.prototype.weightByMax = function(variable){

        buildFragmentTrie(this.fragmentTrie, this.fragmentsArray);
        console.log('our fragment dictionary Trie is', this.fragmentTrie , 'and fragment array is ', this.fragmentsArray);
        markTime('build trie for weight end');

        var rebuildArray = this.rebuildArray;
        var debug = this.debug;
        var fragmentsArray = [];
        var fragmentsTrie = this.fragmentTrie;
        var fragments_Num = this.fragmentsArray.length;
        var label_Lengths = this.array.map(function(s){
            return s.length;
        });

        var label_Tree = new BinarySearchTree();
        label_Lengths.forEach(function(length, index){
            label_Tree.insert(length, index);
        });

        if(variable !== undefined) fragments_Num = variable < fragments_Num ? variable : fragments_Num;

        while(fragmentsArray.length < fragments_Num){
            var maxKey = label_Tree.getMaxKey();

            var labels_In_Key = label_Tree.search(maxKey);

            if(labels_In_Key.length === 0  ){
                label_Tree.delete(maxKey);
                continue;
            }
            //choose a random labels index with the biggest length
            var longest_Label = labels_In_Key[0]; //TODO choose a random labels index

            //get all the fragments in this label
            //in case the there is no fragments under it.
            var fragments = Object.keys(rebuildArray[longest_Label]);
            if(fragments.length > 0){
                //then find the longest fragment
                fragments.sort(function(f1,f2){return f2.length - f1.length;});
//                console.log('sorted fragments for the label is' , fragments);
                removeTrie(fragments[0], fragmentsTrie, fragmentsArray, label_Lengths, rebuildArray, label_Tree);
            }
            //in case there is no this label in fragments array -- which could be possible
            label_Tree.delete(maxKey, longest_Label);
        }

        this.fragmentsArray = fragmentsArray;

        if(debug)console.log('weight by max:  result of length ' + fragmentsArray.length + ' is' , fragmentsArray);
        console.log('rebuild tree should be empty now' , rebuildArray);
    };

    function deleteFragmentInLabelArray($, name, labelArray){
        var label = labelArray[$[0]];
        if(label.hasOwnProperty(name)){
            delete label[name];
        }
    }

    SuffixTrie.prototype.clearRedundantFragment = function(){
        var fragments = this.fragmentsArray;
        var occurrence = this.minOccurrence;
        var newFragmentArray = [];
        var labelArray = this.labelArray;

        fragments.sort(function(a,b){
            return a.name.length - b.name.length ;   //TODO not right sorted
        });
        console.dir( fragments);

        var count = 0;
        fragments.forEach(function(fragment, index){
            var backup$ = fragment.$.slice();
            for(var i = index + 1; i < fragments.length; i ++){
                var longerFragment = fragments[i];
                if(longerFragment.name.indexOf(fragment.name) !== -1){
                    fragment.$ = fragment.$.filter(function(i){
                        return longerFragment.$.indexOf(i) === -1;
                    });
                }
            }

            if(fragment.$.length >= occurrence){ //TODO not called
                count ++;
                newFragmentArray.push(fragment);
            }
            else{
                if(backup$.length !== fragment.$.length){
                    deleteFragmentInLabelArray(backup$, fragment.name, labelArray);
                }
            }
        });
        console.log('clear' + count + ' redundant fragments');
        console.log('new fragment array is' , newFragmentArray);

        this.fragmentsArray = newFragmentArray;
    };

    /**
     * Helper function for build a dictionary trie for searching the fragment.
     * @param trie the fragment trie will be build in this variable.
     * @param array the fragment array used for building trie.
     */
    var buildFragmentTrie = function(trie, array){
        for ( var i = 0 ; i < array.length; i++ ) {

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
    var removeTrie = function(word, cur, array, labelLengthArray, rebuildArray, label_trie){
        for ( var node in cur ) {

            if(cur.hasOwnProperty(node)&& node.length === 1 && node !== '$'){

                if ( word.indexOf( node ) === 0 ) {
                    if ( word.length === 1  ) {
//                        console.assert(cur[node].hasOwnProperty('list'), 'the node has been visited again');
                        if(cur[node].hasOwnProperty('list')){
                            var fragmentName = cur[node]['name'];

                            var fragment = {};
                            fragment['$'] = cur[node]['$'];
                            fragment['name'] = fragmentName;
                            fragment['weight'] = cur[node]['weight'];
                            delete cur[node]['list'];
                            array.push(fragment);

                            cur[node]['$'].forEach(function(indexLabel){
//                                console.assert(rebuildArray[indexLabel].hasOwnProperty(fragmentName), 'does not has such property');
                                delete rebuildArray[indexLabel][fragmentName];  //TODO should make a new array for deleting stuff

                                //update the label length in the trie
                                var labelLength = labelLengthArray[indexLabel];
                                label_trie.delete(labelLength, indexLabel);
                                labelLength -= fragmentName.length;
                                label_trie.insert(labelLength, indexLabel);

                            });

                            return true;
                        }

                    } else {
                        return removeTrie( word.slice( 1 ), cur[node], array, labelLengthArray, rebuildArray, label_trie );
                    }
                }

            }
        }

        return false;
    };

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


//  A examine function to test if the fragment Array has name repeat fragment
    var checkRepeat = function(fragmentArray){
        var nameArray = fragmentArray.map(function(object){
            return object['name'];
        });
        var sorted_arr = nameArray.sort();

        // JS by default uses a crappy string compare.
        var results = [];
        for (var i = 0; i < nameArray.length - 1; i++) {
            if (sorted_arr[i + 1] == sorted_arr[i]) {
                results.push(sorted_arr[i]);
            }
        }

        return(results);
    };

    return SuffixTrie;
}());
