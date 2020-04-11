/**
 * Created by Hanwen on 01.07.2014.
 * updated 2.0 by Hanwen on 03.02.2019.
 * updated 3.0 by Hanwen on 11.04.2020
 */
import { Substring } from './types';
export default function getSubstrings(array: string[], { minLength, minOccurrence }?: {
    minLength: number;
    minOccurrence: number;
}): Substring[];
