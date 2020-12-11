(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getSubstrings(array, { minLength, minOccurrence } = {
        minLength: 3,
        minOccurrence: 2,
    }) {
        const root = generateNewNode('');
        const horizontalRoot = generateNewNode('');
        buildTrie(array, root, horizontalRoot, minLength);
        accumulateVertically(root, minLength, minOccurrence);
        accumulateHorizontally(horizontalRoot, minOccurrence);
        const resultArray = [];
        listing(root, resultArray);
        return resultArray;
    }
    exports.default = getSubstrings;
    function generateNewNode(label) {
        return {
            source: new Set(),
            listing: false,
            label,
            horizontal: new Map(),
            structure: new Map()
        };
    }
    function buildTrie(array, root, horizontalRoot, minLength) {
        array.forEach((word, originIndex) => {
            const lastSuffixPointers = [];
            for (let i = 0; i <= word.length - minLength; i++) {
                let pointer = root;
                const suffix = word.substring(i);
                const chars = suffix.split('');
                chars.reduce((currentNode, char, charIndexInSuffix) => {
                    const currentBranchLength = charIndexInSuffix + 1;
                    const label = word.substring(i, i + currentBranchLength);
                    if (currentNode.structure.has(char)) {
                        currentNode.structure.get(char).source.add(originIndex);
                    }
                    else {
                        const newNode = generateNewNode(label);
                        newNode.source.add(originIndex);
                        currentNode.structure.set(char, newNode);
                    }
                    currentNode = currentNode.structure.get(char);
                    if (currentBranchLength >= minLength) {
                        if (i > 0) {
                            const labelInLastSuffix = word.substring(i - 1, currentBranchLength + i);
                            const lastPointer = lastSuffixPointers.shift();
                            currentNode.horizontal.set(labelInLastSuffix, lastPointer);
                        }
                        if (currentBranchLength > minLength) {
                            lastSuffixPointers.push(currentNode);
                        }
                        else {
                            // if it is the last min length suffix of the whole word, then add it to root
                            horizontalRoot.horizontal.set(label, currentNode);
                        }
                    }
                    return currentNode;
                }, pointer);
            }
            console.assert(lastSuffixPointers.length === 0, 'the last suffix list should be cleared');
        });
    }
    function accumulateVertically(node, minLength, minOccurrences) {
        let childrenListedOccurrences = Array.from(node.structure.entries()).reduce((acc, [label, node]) => {
            const childSources = accumulateVertically(node, minLength, minOccurrences);
            if (node.label.length <= minLength)
                return acc;
            return new Set([...acc, ...childSources]);
        }, new Set());
        if (node.label.length < minLength) {
            return childrenListedOccurrences;
        }
        const remainedOccurrences = new Set([...node.source].filter(x => !childrenListedOccurrences.has(x)));
        if (remainedOccurrences.size >= minOccurrences) {
            node.listing = true;
            return node.source;
        }
        else {
            return childrenListedOccurrences;
        }
    }
    function accumulateHorizontally(node, minOccurrences) {
        let childrenListedOccurrences = Array.from(node.horizontal.entries()).reduce((acc, [label, node]) => {
            const childSources = accumulateHorizontally(node, minOccurrences);
            return new Set([...acc, ...childSources]);
        }, new Set());
        const remainedOccurrences = new Set([...node.source].filter(x => !childrenListedOccurrences.has(x)));
        if (remainedOccurrences.size >= minOccurrences) {
            return node.source;
        }
        else {
            node.listing = false;
            return childrenListedOccurrences;
        }
    }
    function listing(node, resultsSubstrings) {
        Array.from(node.structure.entries()).forEach(([label, childNode]) => {
            listing(childNode, resultsSubstrings);
            if (childNode.listing) {
                resultsSubstrings.push({
                    source: Array.from(childNode.source),
                    name: childNode.label,
                    weight: childNode.source.size * childNode.label.length
                });
            }
        });
    }
});
