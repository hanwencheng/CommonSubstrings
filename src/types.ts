export type Node = {
	source: Set<number>;
	label: string;
	listing: boolean;
	structure:  Map<string, Node>;
	horizontal: Map<string, Node>;
}

export type Substring = {
	source: number[],
	name: string,
	weight: number
}
