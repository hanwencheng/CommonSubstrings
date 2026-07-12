import { Substring } from './types';
export type { Substring } from './types';
export type CommonSubstringsOptions = {
    minLength?: number;
    minOccurrence?: number;
};
export default function getSubstrings(strings: string[], options?: CommonSubstringsOptions): Substring[];
