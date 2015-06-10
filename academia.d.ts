declare module "academia" {
    module styles {
        module acl {
            const citeRegExp: RegExp;
            const yearRegExp: RegExp;
            /**
            Given the text of a paper, extract the `Cite`s using regular expressions.
            */
            function parseCites(body: string): types.AuthorYearCite[];
            const referenceRegExp: RegExp;
            /**
            Given a string representing an individual reference in a bibliography, parse
            it into a Reference structure.
            */
            function parseReference(reference: string): types.Reference;
            /**
            Given a Reference, format it as a string.
            */
            function formatReference(reference: types.Reference): string;
            /**
            In-place modifies `cites` by setting the `reference` value of each one where
            a unique match from `references` is found.

            TODO: handle multiple matches somehow.
            */
            function linkCites(cites: types.AuthorYearCite[], references: types.Reference[]): void;
            /**
            Join the papers sections into a single string, for searching, and find all cites
            in that string. Parse references, and link the cites to them heuristically.

            Extend the given paper with the parsed references and cites (linked or not),
            and return it.
            */
            function linkPaper(paper: types.Paper, referencesTitleRegExp?: RegExp): types.Paper;
        }
    }
    module names {
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
        function parseName(parts: string[]): types.Name;
        /**
        Opinionated name formatting.
        */
        function formatName(name: types.Name): string;
        function formatNames(names: types.Name[]): string;
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
        function parseNames(input: string): types.Name[];
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
        function authorsMatch(citeAuthors: types.Name[], referenceAuthors: types.Name[]): boolean;
    }
    module types {
        /**
        Textual: Brown (2015)
        Parenthetical: (Brown 2015)
        Alternate: Brown 2015
        */
        enum CiteStyle {
            Textual = 0,
            Parenthetical = 1,
            Alternate = 2,
        }
        /**
        Cite: in-paper reference to an article listed in the Bibliography.
        */
        interface Cite {
            /** the style of citation */
            style: CiteStyle;
            /** the location within the paper */
            range?: [number, number];
            /** the full reference it matches */
            reference?: Reference;
            /** the original text */
            source?: string;
        }
        interface AuthorYearCite extends Cite {
            /** usually only last names, one of which may be 'al.' (from 'et al.') */
            authors: Name[];
            /** not necessarily a number, if there is a letter suffix */
            year: string;
        }
        interface Name {
            first?: string;
            middle?: string;
            last: string;
        }
        /**
        Reference: an article as listed in a Bibliography. This means that the authors
        may be truncated, the year may include a suffix (for disambiguation), and other
        fields may include abbreviations.
        */
        interface Reference {
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
        interface Section {
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
        interface Paper {
            title?: string;
            authors?: Name[];
            year?: number;
            sections: Section[];
            references?: Reference[];
            cites?: Cite[];
        }
    }
}
