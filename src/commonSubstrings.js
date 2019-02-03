/**
 * Created by Hanwen on 01.07.2014.
 * updated by Hanwen on 03.02.2019.
 */
import _ from 'lodash'

/**
 * Constructor
 * @param {Object} [options] config map
 * @param {Number}  options.minLength the shortest length of the fragment.
 * @param {Number}  options.minOccurrence the minimum occurrence of the fragment.
 * @constructor
 */
function SuffixTrie(
  options = {
    minLength: 3,
    minOccurrence: 2,
  }
) {
  this.structure = {};
  this.horizontalStructure = { horizontal: {} };
  this.array = null;
  this.minLength = options.minLength;
  this.minOccurrence = options.minOccurrence;
}

/**
 * the main function to list all the fragments
 * @param array {Array} adding word
 */
SuffixTrie.prototype.list = function(array) {
  this.buildTrie(array);
  this.accumulateVertically(this.structure);
  this.excludeDuplicateHorizontally(this.horizontalStructure);
  return this.listFragments(this.structure);
};

function addHorizontalPointer(node, name, pointer) {
  if (!node.hasOwnProperty('horizontal')) {
    node['horizontal'] = {};
  }
  if (name) {
    node['horizontal'][name] = pointer;
  }
}

/**
 * build the two dimension trie
 * @param array {Array} input strings
 */
SuffixTrie.prototype.buildTrie = function(array) {
  this.array = array;
  const root = this.structure;
  const minLength = this.minLength;
  
  array.forEach((word, index) => {
    //used to store the loop element, for connect the suffixes, e.g. 'foob' next is 'oob', by this connection, we get all the substrings.
    let lastSuffixPointerHorizontal = null;
  let lastSuffixNameHorizontal = null;
  //loop every suffix in one word, e.g. 'oss' in 'boss'
  for (let i = 0, l = word.length; i <= l - minLength; i++) {
    let pointer = root;
    const suffix = word.substring(i);
    const letters = suffix.split('');
    
    //loop every letter in the suffix, e.g. 'o' in 'oss'
    for (let j = 0; j < letters.length; j++) {
      const letter = letters[j];
      const currentNode = pointer[letter];
      
      if (j === letters.length - 1) {
        if (currentNode == null) {
          //create new node and add the information.
          pointer[letter] = { source: [index], listed: false };
        } else if (currentNode.hasOwnProperty('source')) {
          //just add occurrence
          currentNode['source'].push(index);
        } else {
          //node already existed, it is a branch node, add information.
          currentNode['source'] = [index];
          currentNode['listed'] = false;
          if (currentNode.hasOwnProperty('horizontal')) {
            console.warn('branch node should not be linked horizontal, check it');
          }
        }
        
        //link Horizontal pointer and constructor a virtual horizontal trie.
        addHorizontalPointer(
          pointer[letter],
          lastSuffixNameHorizontal,
          lastSuffixPointerHorizontal
        );
        if (j !== minLength - 1) {
          lastSuffixPointerHorizontal = pointer[letter];
          lastSuffixNameHorizontal = suffix[0];
        } else {
          this.horizontalStructure.horizontal[suffix] = pointer[letter];
        }
      } else if (currentNode == null) {
        //create node and change the pointer
        pointer[letter] = {};
      } else {
        //if node already existed, do nothing, loop to next node
      }
      pointer = pointer[letter];
    }
  }
});
};

/**
 * Accumulate all the origins from leaf to root vertically
 * add the origin for the node with branches, leafs.
 * @param {Object} root the start node
 * @param {Number} [rootLevel] the start level of the algorithm, should be -1
 * @returns {Array} array with the origin of the word
 *
 */
SuffixTrie.prototype.accumulateVertically = function(root, rootLevel = -1) {
  //self origin indexes
  let accumulatedOrigins = [];
  rootLevel++;
  //whether the word is long enough. ignored the short part.
  const validLength = rootLevel >= this.minLength;
  
  for (const child in root) {
    if (!root.hasOwnProperty(child) || child.length !== 1) continue;
    //Iterate to new child and combine the index information
    const currentNode = root[child];
    const leafOrigins = this.accumulateVertically(currentNode, rootLevel);
    if (!validLength) continue;
    accumulatedOrigins = accumulatedOrigins.concat(leafOrigins);
  }
  
  if (root.hasOwnProperty('source')) {
    accumulatedOrigins = accumulatedOrigins.concat(root.source);
  }
  accumulatedOrigins = _.uniq(accumulatedOrigins);
  const validOccurrence = accumulatedOrigins.length >= this.minOccurrence;
  if (validOccurrence) {
    // branch split node, and repeated node, and end node all has more than one keys.
    // These nodes are the nodes we care.
    root['source'] = accumulatedOrigins;
    root['level'] = rootLevel;
    root['listed'] = false;
    root['weight'] = accumulatedOrigins.length * rootLevel;
    accumulatedOrigins = []; //clear the array: this is important if we don't want the node with former indexes!
  } else if (!root.hasOwnProperty('horizontal')) {
    delete root['source'];
  }
  
  return accumulatedOrigins;
};

/**
 * exclude the duplicated origins in our horizontal virtual trie.
 * The feature of the horizontal trie is that root store all the occurrence of the leaf nodes,
 * so we need to exclude the duplicated listed occurrence.
 * That means the origins appears in the longer fragment will not appeared in the smaller one.
 * @param root {Object} The root node for iteration
 * @param rootSuffix {String} the node's
 * @param rootLevel {Number} also is the length of the rootSuffix
 * @returns {Array} return the origins already listed in the leaf nodes.
 */
SuffixTrie.prototype.excludeDuplicateHorizontally = function(
  root,
  rootSuffix = '',
  rootLevel = this.minLength - 2
) {
  rootLevel++;
  let listedOrigins = [];
  if (root.hasOwnProperty('horizontal')) {
    for (const child in root.horizontal) {
      if (!root.horizontal.hasOwnProperty(child)) continue;
      
      const currentNode = root.horizontal[child];
      const leafListedOrigins = this.excludeDuplicateHorizontally(
        currentNode,
        child + rootSuffix,
        rootLevel
      );
      listedOrigins = listedOrigins.concat(leafListedOrigins);
    }
  }
  
  listedOrigins = _.uniq(listedOrigins);
  const currentOrigins = _.xor(root.source, listedOrigins);
  const validOccurrence = currentOrigins.length >= this.minOccurrence;
  
  if (validOccurrence && root.source) {
    // return all the occurrence if the node should be listed
    listedOrigins = root.source;
    root['source'] = currentOrigins;
    root['weight'] = currentOrigins.length * rootLevel;
  } else {
    //else return children's listed fragments, and delete source here.
    delete root['source'];
    delete root['weight'];
  }
  return listedOrigins;
};

/**
 * final steps, list all the fragments from bottom to top, as the fastest way.
 * @param root {Object} the root trie
 * @param name {String} the fragment string
 * @returns {Array} the result fragments.
 */
SuffixTrie.prototype.listFragments = function(root, name = '') {
  let fragments = [];
  for (const child in root) {
    if (!root.hasOwnProperty(child) || child.length !== 1) continue;
    const leafFragments = this.listFragments(root[child], name + child);
    fragments = fragments.concat(leafFragments);
  }
  
  if (root.hasOwnProperty('source') && name !== '') {
    fragments.push({ name, source: root.source, weight: root.weight });
  }
  return fragments;
};

function listFragment(array, options) {
  const tree = new SuffixTrie(options);
  return tree.list(array);
}

export const trie = SuffixTrie;

export default listFragment;