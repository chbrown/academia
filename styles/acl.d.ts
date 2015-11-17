import * as types from '../types';
export declare const citeRegExp: RegExp;
export declare const yearRegExp: RegExp;
export declare const referenceRegExp: RegExp;
/**
Given a string representing an individual reference in a bibliography, parse
it into a Reference structure.
*/
export declare function parseReference(reference: string): types.Reference;
/**
Given a Reference, format it as a string.
*/
export declare function formatReference(reference: types.Reference): string;
/**
In-place modifies `cites` by setting the `reference` value of each one where
a unique match from `references` is found.

TODO: handle multiple matches somehow.
*/
export declare function linkCites(cites: types.AuthorYearCite[], references: types.Reference[]): void;
/**
Given the text of some part of a paper, extract the `Cite`s using regular expressions.
*/
export declare function findCites(input: string, pointer: string): types.AuthorYearCite[];
/**
Join the papers sections into a single string, for searching, and find all cites
in that string. Parse references, and link the cites to them heuristically.

Extend the given paper with the parsed references and cites (linked or not),
and return it.
*/
export declare function linkPaper(paper: types.Paper, referencesTitleRegExp?: RegExp): {
    sections: types.Section[];
    references: types.Reference[];
    cites: types.AuthorYearCite[];
};
