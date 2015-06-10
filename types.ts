/**
Textual: Brown (2015)
Parenthetical: (Brown 2015)
Alternate: Brown 2015
*/
export enum CiteStyle {
  Textual, Parenthetical, Alternate
}

/**
Cite: in-paper reference to an article listed in the Bibliography.
*/
export interface Cite {
  /** the style of citation */
  style: CiteStyle;
  /** the location within the paper */
  range?: [number, number];
  /** the full reference it matches */
  reference?: Reference;
  /** the original text */
  source?: string;
}

export interface AuthorYearCite extends Cite {
  /** usually only last names, one of which may be 'al.' (from 'et al.') */
  authors: Name[];
  /** not necessarily a number, if there is a letter suffix */
  year: string;
}

export interface Name {
  first?: string;
  middle?: string;
  last: string;
}

/**
Reference: an article as listed in a Bibliography. This means that the authors
may be truncated, the year may include a suffix (for disambiguation), and other
fields may include abbreviations.
*/
export interface Reference {
  /** not always full names */
  authors: Name[];
  year: string;
  title: string;
  /** journal / specific conference / website; may be abbreviated */
  venue?: string;
  /** company name / conference */
  publisher?: string;
  pages?: [number, number];
  /** the original text */
  source?: string;
}

export interface Section {
  /** 'title' could also be called 'header' */
  title: string;
  paragraphs: string[];
}

/**
Paper: a representation of any kind of academic paper / conference
presentation / manuscript. This preserves no formatting beyond sections /
paragraph distinctions.

`sections` is a flat list; abstracts / subsections / references all count at
the same level.
*/
export interface Paper {
  // metadata
  title?: string;
  authors?: Name[];
  year?: number;
  // content
  sections: Section[];
  // analysis
  references?: Reference[];
  cites?: Cite[];
}
