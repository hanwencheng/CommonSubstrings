const substrings = require('../lib/commonSubstrings');
describe("Common Substrings Test", () => {
	it("get substrings correctly", () => {
		const stringArray = [
			"science", "typescript", "crisis", "kept", "javascript", "java"
		];
		const result = substrings(stringArray, {
			minOccurrence: 2,
			minLength: 4,
		});
		expect(result).toEqual([
				{ source: [ 1, 4 ], name: 'script', weight: 12 },
				{ source: [ 4, 5 ], name: 'java', weight: 8 }
			]
		);
	});

	it("get substrings correctly", () => {
		const stringArray = [
			"science", "typescript", "crisis", "kept", "java"
		];
		const result = substrings(stringArray, {
			minOccurrence: 2,
			minLength: 2,
		});
		expect(result).toEqual([
			{ source: [ 0, 1 ], name: 'sc', weight: 4 },
			{ source: [ 1, 2 ], name: 'cri', weight: 6 },
			{ source: [ 1, 3 ], name: 'pt', weight: 4 }
		]);
	});
});
