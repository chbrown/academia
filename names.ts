/// <reference path="./type_declarations/index.d.ts" />
import lexing = require('lexing');
var Token = lexing.Token;

import types = require('./types');

/**
Given a name represented by a single string, parse it into first name, middle
name, and last name.

makeName('Leonardo da Vinci') -> { first: 'Leonardo', last: 'da Vinci' }
makeName('Chris Callison-Burch') -> { first: 'Chris', last: 'Callison-Burch' }
makeName('Hanna M Wallach') -> { first: 'Hanna', middle: 'M', last: 'Wallach' }
makeName('Zhou') -> { last: 'Zhou' }
makeName('McCallum, Andrew') -> { first: 'Andrew', last: 'McCallum' }

TODO: handle 'van', 'von', 'da', etc.
*/
function makeName(parts: string[]): types.Name {
  var n = parts.length;
  if (n >= 3) {
    return {
      first: parts[0],
      middle: parts.slice(1, n - 1).join(' '),
      last: parts[n - 1],
    };
  }
  else if (n == 2) {
    return {
      first: parts[0],
      last: parts[1],
    };
  }
  return {
    last: parts[0]
  };
}

var default_rules: lexing.RegexRule<string>[] = [
  [/^$/, match => Token('EOF') ],
  [/^\s+/, match => null ],
  [/^,\s+/, match => Token('SEPARATOR', match[0]) ],
  [/^(and|et|&)/, match => Token('CONJUNCTION', match[0]) ],
  [/^[A-Z](\.|\s)/, match => Token('INITIAL', match[0].trim()) ],
  [/^((van|von|da|de)\s+)?[A-Z][^,\s]+(\s+[IVX]+)?/i, match => Token('NAME', match[0]) ],
];

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
export function parseNames(input: string): types.Name[] {
  var input_iterable = new lexing.StringIterator(input);

  var tokenizer = new lexing.Tokenizer(default_rules);
  var token_iterator = tokenizer.map(input_iterable);

  var names: types.Name[] = [];

  var buffer: string[] = [];
  var buffer_swap = false;
  function flush() {
    if (buffer_swap) {
      // move the first item to the last item
      buffer.push(buffer.shift());
    }
    var name = makeName(buffer);
    names.push(name);
    // reset
    buffer = [];
    buffer_swap = false;
  }

  while (1) {
    var token = token_iterator.next();
    // console.error('%s=%s', token.name, token.value);

    // tokens: EOF NAME INITIAL SEPARATOR CONJUNCTION
    if (token.name === 'EOF') {
      break;
    }
    else if (token.name === 'NAME') {
      // the first long name after
      if (buffer.length > 0 && buffer_swap) {
        flush();
      }
      buffer.push(token.value);
    }
    else if (token.name === 'INITIAL') {
      // console.log('INITIAL=%s', token.value);
      buffer.push(token.value);
    }
    else if (token.name === 'SEPARATOR' || token.name === 'CONJUNCTION') {
      if (buffer.length === 1) {
        buffer_swap = true;
      }
      else if (buffer.length > 1) {
        flush();
      }
      else {
        // a second separator without anything to separate
      }
    }
  }

  // finish up
  if (buffer.length > 0) {
    flush();
  }

  return names;
}

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
export function authorsMatch(citeAuthors: types.Name[], referenceAuthors: types.Name[]) {
  for (var i = 0, l = Math.max(citeAuthors.length, referenceAuthors.length); i < l; i++) {
    var citeAuthor = citeAuthors[i];
    var referenceAuthor = referenceAuthors[i];
    // the et al. handling has to precede the normal name-checking conditional below
    if (citeAuthor && citeAuthor.last === 'al.' && referenceAuthors.length > (i + 1)) {
      // early exit: ignore the rest of the reference authors
      return true;
    }
    if (citeAuthor === undefined || referenceAuthor === undefined || citeAuthor.last !== referenceAuthor.last) {
      return false;
    }
  }
  return true;
}
