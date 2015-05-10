import types = require('../types');
import names = require('../names');

export function stringifyNames(names: string[]): string {
  if (names.length < 3) {
    return names.join(' and ');
  }
  // use the Oxford comma
  var parts = names.slice(0, -2); // might be []
  parts.push(names.slice(-2).join(', and '));
  return parts.join(', ');
}

const name = '[A-Z][^()\\s]+(?: [IV]+)?';
const year = '[0-9]{4}(?:[-–—][0-9]{4})?[a-z]?';

var citeSources = [
  // et al., duo, and single, with year in parens
  `${name}\\s+et\\s+al.\\s+\\(${year}\\)`,
  `${name}\\s+(?:and|&)\\s+${name}\\s+\\(${year}\\)`,
  `${name}\\s+\\(${year}\\)`,
  // et al., duo, and single, with year not in parens (note the commas)
  `${name}\\s+et\\s+al.,\\s+${year}\\b`,
  `${name}\\s+(?:and|&)\\s+${name},\\s+${year}\\b`,
  `${name},\\s+${year}\\b`,
];

export const citeRegExp = new RegExp(citeSources.join('|'), 'g');
export const yearRegExp = new RegExp(year);
const citeCleanRegExp = new RegExp(`[(),]|${year}`, 'g');

/**
Given the text of a paper, extract the `Cite`s using regular expressions.
*/
export function parseCites(body: string): types.AuthorYearCite[] {
  // when String.prototype.match is called with a RegExp with the 'g' (global)
  // flag set, the result will ignore any capture groups and return an Array of
  // strings, or null if the RegExp matched nothing.
  return (body.match(citeRegExp) || []).map(cite => {
    var year_match = cite.match(yearRegExp);
    // we cull it down to just the names by removing parentheses, commas,
    // and years (with optional suffixes), and trimming any extra whitespace
    var names_string = cite.replace(citeCleanRegExp, '').trim();
    return {
      authors: names.parseNames(names_string),
      year: year_match ? year_match[0] : null,
      style: types.CiteStyle.Textual,
    };
  });
}

export const referenceRegExp = new RegExp(`^(.+?)[.,]\\s*\\(?(${year})\\)?\\.\\s*(.+?)\\.`);

/**
Given a list of strings representing individual references in a bibliography,
parse each one into a Reference structure.
*/
export function parseReferences(references: string[]): types.Reference[] {
  return references.map(reference => {
    var match = reference.match(referenceRegExp);
    var authors = match ? names.parseNames(match[1]) : [];
    return {
      authors: authors,
      year: match ? match[2] : undefined,
      title: match ? match[3] : undefined,
    };
  });
}

/**
In-place modifies `cites` by setting the `reference` value of each one where
a unique match from `references` is found.

TODO: handle multiple matches somehow.
*/
export function linkCites(cites: types.AuthorYearCite[], references: types.Reference[]) {
  cites.forEach(cite => {
    var matching_references = references.filter(reference => {
      return names.authorsMatch(cite.authors, reference.authors) && (cite.year == reference.year);
    });
    if (matching_references.length === 1) {
      cite.reference = matching_references[0];
    }
  });
}
