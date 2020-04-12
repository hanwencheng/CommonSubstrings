/**
 * Created by Hanwen on 01.07.2014.
 * updated 2.0 by Hanwen on 03.02.2019.
 * updated 3.0 by Hanwen on 11.04.2020
 */
import {Node, Substring} from './types';

export default function getSubstrings(array: string[], {minLength, minOccurrence} = {
	minLength: 3,
	minOccurrence: 2,
}): Substring[] {
	const root = generateNewNode('');
	const horizontalRoot = generateNewNode('');
	buildTrie(array, root, horizontalRoot, minLength);
	accumulateVertically(root, minLength, minOccurrence);
	accumulateHorizontally(horizontalRoot, minOccurrence);
	const resultArray: Substring[] = [];
	listing(root, resultArray);
	return resultArray;
}

function generateNewNode(label: string): Node {
	return {
		source: new Set<number>(),
		listing: false,
		label,
		horizontal: new Map<string, Node>(),
		structure: new Map<string, Node>()
	}
}

function buildTrie(array: string[], root: Node, horizontalRoot: Node, minLength: number): void {
	array.forEach((word: string, originIndex: number) => {
		const lastSuffixPointers: Node[] = [];
		for (let i = 0; i <= word.length - minLength; i++) {
			let pointer = root;
			const suffix = word.substring(i);
			const chars = suffix.split('');

			chars.reduce((currentNode, char, charIndexInSuffix) => {
				const currentBranchLength = charIndexInSuffix + 1;
				const label = word.substring(i, i + currentBranchLength);
				if (currentNode.structure.has(char)) {
					currentNode.structure.get(char)!.source.add(originIndex);
				} else {
					const newNode = generateNewNode(label);
					newNode.source.add(originIndex);
					currentNode.structure.set(char, newNode);
				}

				currentNode = currentNode.structure.get(char)!;

				if (currentBranchLength >= minLength) {
					if (i > 0) {
						const labelInLastSuffix = word.substring(i - 1, currentBranchLength + i);
						const lastPointer = lastSuffixPointers.shift();
						currentNode.horizontal.set(labelInLastSuffix, lastPointer!);
					}

					if (currentBranchLength > minLength) {
						lastSuffixPointers.push(currentNode)
					} else {
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

function accumulateVertically(node: Node, minLength: number, minOccurrences: number): Set<number> {
	let childrenListedOccurrences = Array.from(node.structure.entries()).reduce((acc: Set<number>, [label, node]) => {
		const childSources = accumulateVertically(node, minLength, minOccurrences);
		if (node.label.length <= minLength)
			return acc;

		return new Set([...acc, ...childSources]);
	}, new Set<number>());

	if (node.label.length < minLength) {
		return childrenListedOccurrences;
	}

	const remainedOccurrences = new Set(
		[...node.source].filter(x => !childrenListedOccurrences.has(x)));
	if (remainedOccurrences.size >= minOccurrences) {
		node.listing = true;
		return node.source;
	} else {
		return childrenListedOccurrences;
	}
}

function accumulateHorizontally(node: Node, minOccurrences: number): Set<number> {
	let childrenListedOccurrences = Array.from(node.horizontal.entries()).reduce((acc: Set<number>, [label, node]) => {
		const childSources = accumulateHorizontally(node, minOccurrences);
		return new Set([...acc, ...childSources]);
	}, new Set<number>());

	const remainedOccurrences = new Set(
		[...node.source].filter(x => !childrenListedOccurrences.has(x)));
	if (remainedOccurrences.size >= minOccurrences) {
		return node.source;
	} else {
		node.listing = false;
		return childrenListedOccurrences;
	}
}

function listing(node: Node, resultsSubstrings: Substring[]): void {
	Array.from(node.structure.entries()).forEach(([label, childNode]) => {
		listing(childNode, resultsSubstrings);

		if (childNode.listing) {
			resultsSubstrings.push({
				source: Array.from(childNode.source),
				name: childNode.label,
				weight: childNode.source.size * childNode.label.length
			})
		}
	})
}
