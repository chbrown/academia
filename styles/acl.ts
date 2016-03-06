import * as types from '../types';
import * as names from '../names';

const name = '[A-Z][^()\\s]+(?: [IV]+)?';
const year = '[0-9]{4}(?:[-–—][0-9]{4})?[a-z]?';

const citeSources = [
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
find the start indices and lengths of all non-overlapping substrings matching
`regExp` in `input`.
*/
function matchSpans(input: string, regExp: RegExp = citeRegExp): Array<[number, number]> {
  // reset the regex
  regExp.lastIndex = 0;
  // set up the iteration variables
  const previousLastIndex = regExp.lastIndex;
  const spans: Array<[number, number]> = [];
  let match: RegExpExecArray;
  while ((match = regExp.exec(input)) !== null) {
    spans.push([match.index, match[0].length]);
  }
  return spans;
}

export const referenceRegExp = new RegExp(`^(.+?)[.,]?\\s*\\(?(${year})\\)?\\.\\s*(.+?)\\.`);

/**
Given a string representing an individual reference in a bibliography, parse
it into a Reference structure.
*/
export function parseReference(reference: string): types.Reference {
  const match = reference.match(referenceRegExp);
  const authors = match ? names.parseNames(match[1]) : [];
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
  const authors = names.formatNames(reference.authors)
  const parts = [authors, reference.year, reference.title, reference.venue, reference.publisher, reference.pages];
  return parts.filter(part => part !== undefined && part !== null).join('. ') + '.';
}

/**
In-place modifies `cites` by setting the `reference` value of each one where
a unique match from `references` is found.

TODO: handle multiple matches somehow.
*/
export function linkCites(cites: types.AuthorYearCite[], references: types.Reference[]) {
  cites.forEach(cite => {
    cite.references = references
    .map((reference, reference_i) => ({reference, reference_i}))
    .filter(({reference, reference_i}) => {
      return names.authorsMatch(cite.authors, reference.authors) && (cite.year == reference.year);
    })
    .map(({reference, reference_i}) => `/references/${reference_i}`);
  });
}

/**
Given the text of some part of a paper, extract the `Cite`s using regular expressions.
*/
export function findCites(input: string, pointer: string): types.AuthorYearCite[] {
  return matchSpans(input, citeRegExp).map(([offset, length]) => {
    const text = input.slice(offset, offset + length);
    const year_match = text.match(yearRegExp);
    // we cull it down to just the names by removing parentheses, commas,
    // and years (with optional suffixes), and trimming any extra whitespace
    const names_string = text.replace(citeCleanRegExp, '').trim();
    return {
      style: types.CiteStyle.Textual,
      text,
      origin: {
        pointer,
        offset,
        length,
      },
      authors: names.parseNames(names_string),
      year: year_match ? year_match[0] : null,
      references: [],
    };
  });
}

/**
Join the papers sections into a single string, for searching, and find all cites
in that string. Parse references, and link the cites to them heuristically.

Extend the given paper with the parsed references and cites (linked or not),
and return it.
*/
export function linkPaper(paper: types.Paper, referencesTitleRegExp = /References?/) {
  const sections = paper.sections;
  const body_sections = sections.filter(section => !referencesTitleRegExp.test(section.title));
  const references = sections
    .filter(section => referencesTitleRegExp.test(section.title))
    .map(section => section.paragraphs.map(parseReference))
    .reduce((accumulator, references) => {
      accumulator.push(...references);
      return accumulator;
    }, []);

  const cites: types.AuthorYearCite[] = [];
  body_sections.forEach((section, section_i) => {
    section.paragraphs.forEach((paragraph, paragraph_i) => {
      cites.push(...findCites(paragraph, `/sections/${section_i}/paragraphs/${paragraph_i}`));
    });
  });

  linkCites(cites, references);
  return {sections, references, cites};
}
