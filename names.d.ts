import * as types from './types';
/**
Given a name represented by a single string, parse it into first name, middle
name, and last name.

makeName(['Leonardo', 'da', 'Vinci']) -> { first: 'Leonardo', last: 'da Vinci' }
makeName(['Chris', 'Callison-Burch']) -> { first: 'Chris', last: 'Callison-Burch' }
makeName(['Hanna', 'M', 'Wallach']) -> { first: 'Hanna', middle: 'M', last: 'Wallach' }
makeName(['Zhou']) -> { last: 'Zhou' }
makeName(['McCallum', 'Andrew']) -> { first: 'Andrew', last: 'McCallum' }

TODO: handle 'van', 'von', 'da', etc.
*/
export declare function parseName(parts: string[]): types.Name;
/**
Opinionated name formatting.
*/
export declare function formatName(name: types.Name): string;
export declare function formatNames(names: types.Name[]): string;
/**
1. Typical list of 3+
  'David Mimno, Hanna M Wallach, and Andrew McCallum' ->
    ['David Mimno', 'Hanna M Wallach', 'Andrew McCallum']
2. List of 3+ without the Oxford comma, in case that ever happens
  'Aravind K Joshi, Ben King and Steven Abney' ->
    ['David Mimno', 'Hanna M Wallach', 'Andrew McCallum']
3. Duo
  'Daniel Ramage and Chris Callison-Burch' ->
    ['David Mimno', 'Chris Callison-Burch']
4. Single author
  'David Sankofl' ->
    ['David Sankofl']
5. Et al. abbreviation
  'Zhao et al.' ->
    ['Zhao', 'al.']

TODO: handle last-name-first swaps, e.g.,
  'Levy, R., & Daumé III, H.' -> 'R. Levy, H. Daumé III' -> ['R. Levy', 'H. Daumé III']
Or:
  'Liu, F., Tian, F., & Zhu, Q.' -> 'F. Liu, F. Tian, & Q. Zhu' -> ['F. Liu', 'F. Tian', 'Q. Zhu']
Technically, this is ambiguous, since we could support lists of only last names
(e.g., 'Liu, Tian'; is this ['Tian Liu'] or ['Liu', 'Tian']?), but heuristics are better than nothing.

Example chunks:

[FIRST MIDDLE LAST] SEP
[FIRST LAST] SEP
[LAST SEP FIRST] SEP
[LAST SEP INITIAL] [LAST2 SEP INITIAL2]

*/
export declare function parseNames(input: string): types.Name[];
/**
Typically, in-paper citations (`Cite`s) only have the last names of the authors,
while the `Reference`s in the Bibliography have full names, or at least first
initials and last names.

This method determines whether a `Cite`'s names match a `Reference`'s authors.

    authorsMatch(['Joshi'], ['Aravind K Joshi']) -> true
    authorsMatch(['Diab', 'Kamboj'], ['Mona Diab', 'Ankit Kamboj']) -> true

'et al.' gets special treatment. 'et al.' is a match if and only if there are
more reference authors beyond the one parallel to the 'et al.' citation author.
In other words, 'et al.' cannot stand in for a single author.

    authorsMatch(['Blei', 'et al.'], ['David M Blei', 'Andrew Y Ng', 'Michael I Jordan']) -> true
*/
export declare function authorsMatch(citeAuthors: types.Name[], referenceAuthors: types.Name[]): boolean;
