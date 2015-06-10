import types = require('../types');
import names = require('../names');

function pushAll<T>(array: T[], items: T[]): void {
  return Array.prototype.push.apply(array, items);
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
  var cites: string[] = body.match(citeRegExp) || [];
  return cites.map(cite => {
    var year_match = cite.match(yearRegExp);
    // we cull it down to just the names by removing parentheses, commas,
    // and years (with optional suffixes), and trimming any extra whitespace
    var names_string = cite.replace(citeCleanRegExp, '').trim();
    return {
      authors: names.parseNames(names_string),
      year: year_match ? year_match[0] : null,
      style: types.CiteStyle.Textual,
      source: cite,
    };
  });
}

export const referenceRegExp = new RegExp(`^(.+?)[.,]?\\s*\\(?(${year})\\)?\\.\\s*(.+?)\\.`);

/**
Given a string representing an individual reference in a bibliography, parse
it into a Reference structure.
*/
export function parseReference(reference: string): types.Reference {
  var match = reference.match(referenceRegExp);
  var authors = match ? names.parseNames(match[1]) : [];
  return {
    authors: authors,
    year: match ? match[2] : undefined,
    title: match ? match[3] : undefined,
    source: reference,
  };
}

/**
Given a Reference, format it as a string.
*/
export function formatReference(reference: types.Reference): string {
  var authors = names.formatNames(reference.authors)
  var parts = [authors, reference.year, reference.title, reference.venue, reference.publisher, reference.pages];
  return parts.filter(part => part !== undefined && part !== null).join('. ') + '.';
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

/**
Join the papers sections into a single string, for searching, and find all cites
in that string. Parse references, and link the cites to them heuristically.

Extend the given paper with the parsed references and cites (linked or not),
and return it.
*/
export function linkPaper(paper: types.Paper, referencesTitleRegExp = /References?/) {
  var body = paper.sections
    .filter(section => !referencesTitleRegExp.test(section.title))
    .map(section => `# ${section.title}\n${section.paragraphs.join('\n')}`)
    .join('\n');
  paper.references = paper.sections
    .filter(section => referencesTitleRegExp.test(section.title))
    .map(section => section.paragraphs.map(parseReference))
    .reduce((accumulator, references) => {
      pushAll(accumulator, references);
      return accumulator;
    }, []);
  var cites = parseCites(body);
  linkCites(cites, paper.references);
  paper.cites = cites;
  return paper;
}
