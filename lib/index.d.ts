export declare type Node = {
	source: Set<number>;
	label: string;
	listing: boolean;
	structure: Map<string, Node>;
	horizontal: Map<string, Node>;
};
export declare type Substring = {
	source: number[];
	name: string;
	weight: number;
};

export default function getSubstrings (input: string[], options?: {
	minLength?: 3,
	minOccurrence?: 2,
}): Substring[];
