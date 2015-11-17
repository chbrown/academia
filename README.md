# academia

Tools for analyzing academic text.

    npm install academia --save


# Types

## `academia.CiteStyle`

An enum:

    Textual = 0
    Parenthetical = 1
    Alternate = 2

## `academia.Cite`

    {
      style: CiteStyle, // the citation style; 0, 1, or 2
      range?: [number, number], // the location of the citation within the paper
      reference?: Reference, // the full Reference that the Cite matches
    }

## `academia.AuthorYearCite`

Extends `academia.Cite`, and adds the following fields:

    {
      authors: Name[], // usually only last names
      year: string, // most often a number, but may have a letter suffix
    }

## `academia.Name`

    {
      first?: string,
      middle?: string,
      last: string,
    }

## `academia.Reference`

    {
      authors: Name[], // the first / middle names will often be initialized
      year: string, // most often a number, but may have a letter suffix
      title: string,
      venue?: string, // journal / specific conference / website; may be abbreviated
      publisher?: string, // company name / conference
      pages?: [number, number],
    }

## `academia.Paper`

    {
      sections: Section[],
      title?: string,
      authors?: Name[],
      year?: number,
      references?: Reference[],
      cites?: Cite[],
    }

## `academia.Section`

    {
      title: string,
      paragraphs: string[],
    }


## License

Copyright 2015 Christopher Brown. [MIT Licensed](http://chbrown.github.io/licenses/MIT/#2015).
