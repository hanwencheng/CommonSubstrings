import {Node, Substring} from './types';

export type {Substring} from './types';

export type CommonSubstringsOptions = {
	minLength?: number;
	minOccurrence?: number;
};

export default function getSubstrings(
	strings: string[],
	options: CommonSubstringsOptions = {},
): Substring[] {
	const {minLength = 3, minOccurrence = 2} = options;
	validateThreshold('minLength', minLength);
	validateThreshold('minOccurrence', minOccurrence);

	const root = generateNewNode('');
	const horizontalRoot = generateNewNode('');
	buildTrie(strings, root, horizontalRoot, minLength);
	accumulateVertically(root, minLength, minOccurrence);
	accumulateHorizontally(horizontalRoot, minOccurrence);

	const resultSubstrings: Substring[] = [];
	listSubstrings(root, resultSubstrings);
	return resultSubstrings;
}

function validateThreshold(optionName: string, optionValue: number): void {
	if (!Number.isInteger(optionValue) || optionValue < 1) {
		throw new RangeError(`${optionName} must be a positive integer`);
	}
}

function generateNewNode(label: string): Node {
	return {
		source: new Set<number>(),
		listing: false,
		label,
		horizontal: new Map<string, Node>(),
		structure: new Map<string, Node>(),
	};
}

function buildTrie(strings: string[], root: Node, horizontalRoot: Node, minLength: number): void {
	strings.forEach((word, originIndex) => {
		const wordCharacters = Array.from(word);
		const lastSuffixPointers: Node[] = [];

		for (
			let suffixStartIndex = 0;
			suffixStartIndex <= wordCharacters.length - minLength;
			suffixStartIndex++
		) {
			const suffixCharacters = wordCharacters.slice(suffixStartIndex);

			suffixCharacters.reduce((currentNode, character, characterIndexInSuffix) => {
				const currentBranchLength = characterIndexInSuffix + 1;
				const label = wordCharacters
					.slice(suffixStartIndex, suffixStartIndex + currentBranchLength)
					.join('');
				let nextNode = currentNode.structure.get(character);

				if (nextNode) {
					nextNode.source.add(originIndex);
				} else {
					nextNode = generateNewNode(label);
					nextNode.source.add(originIndex);
					currentNode.structure.set(character, nextNode);
				}

				if (currentBranchLength >= minLength) {
					if (suffixStartIndex > 0) {
						const labelInLastSuffix = wordCharacters
							.slice(suffixStartIndex - 1, suffixStartIndex + currentBranchLength)
							.join('');
						const lastPointer = lastSuffixPointers.shift();
						if (!lastPointer) {
							throw new Error('suffix trie invariant violated');
						}
						nextNode.horizontal.set(labelInLastSuffix, lastPointer);
					}

					if (currentBranchLength > minLength) {
						lastSuffixPointers.push(nextNode);
					} else {
						horizontalRoot.horizontal.set(label, nextNode);
					}
				}

				return nextNode;
			}, root);
		}

		if (lastSuffixPointers.length !== 0) {
			throw new Error('suffix trie invariant violated');
		}
	});
}

function accumulateVertically(
	node: Node,
	minLength: number,
	minOccurrences: number,
): Set<number> {
	const childListedOccurrences = Array.from(node.structure.values()).reduce(
		(accumulatedSources, childNode) => {
			const childSources = accumulateVertically(childNode, minLength, minOccurrences);
			if (Array.from(childNode.label).length <= minLength) {
				return accumulatedSources;
			}

			return new Set([...accumulatedSources, ...childSources]);
		},
		new Set<number>(),
	);

	if (Array.from(node.label).length < minLength) {
		return childListedOccurrences;
	}

	const remainingOccurrences = new Set(
		[...node.source].filter(sourceIndex => !childListedOccurrences.has(sourceIndex)),
	);
	if (remainingOccurrences.size >= minOccurrences) {
		node.listing = true;
		return node.source;
	}

	return childListedOccurrences;
}

function accumulateHorizontally(node: Node, minOccurrences: number): Set<number> {
	const childListedOccurrences = Array.from(node.horizontal.values()).reduce(
		(accumulatedSources, childNode) => {
			const childSources = accumulateHorizontally(childNode, minOccurrences);
			return new Set([...accumulatedSources, ...childSources]);
		},
		new Set<number>(),
	);

	const remainingOccurrences = new Set(
		[...node.source].filter(sourceIndex => !childListedOccurrences.has(sourceIndex)),
	);
	if (remainingOccurrences.size >= minOccurrences) {
		return node.source;
	}

	node.listing = false;
	return childListedOccurrences;
}

function listSubstrings(node: Node, resultSubstrings: Substring[]): void {
	for (const childNode of node.structure.values()) {
		listSubstrings(childNode, resultSubstrings);

		if (childNode.listing) {
			resultSubstrings.push({
				source: Array.from(childNode.source),
				name: childNode.label,
				weight: childNode.source.size * Array.from(childNode.label).length,
			});
		}
	}
}

module.exports = getSubstrings;
module.exports.default = getSubstrings;
