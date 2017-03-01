var SuffixTrie= require('./lib/commonSubstrings.min');

function weigh (array, options){
    var tree =  new SuffixTrie(options);
    
    tree.build(array);
    
    return tree.weigh();
}

module.exports = {
    trie : SuffixTrie,
    weigh : weigh
};

