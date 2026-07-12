const substrings = require('../lib/commonSubstrings');

describe('Common Substrings', () => {
	it('finds four-character common substrings', () => {
		const stringArray = [
			'science', 'typescript', 'crisis', 'kept', 'javascript', 'java',
		];
		const result = substrings(stringArray, {
			minOccurrence: 2,
			minLength: 4,
		});
		expect(result).toEqual([
			{source: [1, 4], name: 'script', weight: 12},
			{source: [4, 5], name: 'java', weight: 8},
		]);
	});

	it('finds two-character common substrings', () => {
		const stringArray = [
			'science', 'typescript', 'crisis', 'kept', 'java',
		];
		const result = substrings(stringArray, {
			minOccurrence: 2,
			minLength: 2,
		});
		expect(result).toEqual([
			{source: [0, 1], name: 'sc', weight: 4},
			{source: [1, 2], name: 'cri', weight: 6},
			{source: [1, 3], name: 'pt', weight: 4},
		]);
	});

	it('applies defaults to omitted option properties', () => {
		const result = substrings(['typescript', 'javascript'], {minLength: 4});
		expect(result).toEqual([
			{source: [0, 1], name: 'script', weight: 12},
		]);
	});

	it('returns no result when minOccurrence exceeds the input size', () => {
		const result = substrings(['javascript', 'typescript'], {minOccurrence: 3});
		expect(result).toEqual([]);
	});

	it('treats Unicode code points as characters', () => {
		const result = substrings(['go😀team', 'hi😀team'], {
			minLength: 5,
			minOccurrence: 2,
		});
		expect(result).toEqual([
			{source: [0, 1], name: '😀team', weight: 10},
		]);
	});

	it('rejects non-positive thresholds', () => {
		expect(() => substrings(['one', 'two'], {minLength: 0})).toThrowError(RangeError);
		expect(() => substrings(['one', 'two'], {minOccurrence: 0})).toThrowError(RangeError);
	});
});
