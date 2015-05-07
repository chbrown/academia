var academia;
(function (academia) {
    var styles;
    (function (styles) {
        var acl;
        (function (acl) {
            function stringifyNames(names) {
                if (names.length < 3) {
                    return names.join(' and ');
                }
                // use the Oxford comma
                var parts = names.slice(0, -2); // might be []
                parts.push(names.slice(-2).join(', and '));
                return parts.join(', ');
            }
            acl.stringifyNames = stringifyNames;
            var name = '[A-Z][^()\\s]+';
            var year = '[0-9]{4}(?:[-–—][0-9]{4})?[a-z]?';
            var citeSources = [
                // et al., duo, and single, with year in parens
                (name + " et al. \\(" + year + "\\)"),
                (name + " and " + name + " \\(" + year + "\\)"),
                (name + " \\(" + year + "\\)"),
                // et al., duo, and single, with year not in parens (note the commas)
                (name + " et al., " + year + "\\b"),
                (name + " and " + name + ", " + year + "\\b"),
                (name + ", " + year + "\\b"),
            ];
            acl.citeRegExp = new RegExp(citeSources.join('|'), 'g');
            var yearRegExp = new RegExp(year);
            var citeCleanRegExp = new RegExp("[(),]|" + year, 'g');
            /**
            Given the text of a paper, extract the `Cite`s using regular expressions.
            */
            function parseCites(body) {
                // when String.prototype.match is called with a RegExp with the 'g' (global)
                // flag set, the result will ignore any capture groups and return an Array of
                // strings, or null if the RegExp matched nothing.
                return (body.match(acl.citeRegExp) || []).map(function (cite) {
                    var year_match = cite.match(yearRegExp);
                    // we cull it down to just the names by removing parentheses, commas,
                    // and years (with optional suffixes), and trimming any extra whitespace
                    var names_string = cite.replace(citeCleanRegExp, '').trim();
                    return {
                        authors: names.splitNames(names_string).map(names.parseName),
                        year: year_match ? year_match[0] : null,
                        style: types.CiteStyle.Textual,
                    };
                });
            }
            acl.parseCites = parseCites;
            var referenceRegExp = new RegExp("^(.+?)\\.\\s*(" + year + ")\\.\\s*(.+?)\\.");
            /**
            Given a list of strings representing individual references in a bibliography,
            parse each one into a Reference structure.
            */
            function parseReferences(references) {
                return references.map(function (reference) {
                    var match = reference.match(referenceRegExp);
                    var authors = match ? names.splitNames(match[1]).map(names.parseName) : [];
                    return {
                        authors: authors,
                        year: match ? match[2] : undefined,
                        title: match ? match[3] : undefined,
                    };
                });
            }
            acl.parseReferences = parseReferences;
            /**
            In-place modifies `cites` by setting the `reference` value of each one where
            a unique match from `references` is found.
            
            TODO: handle multiple matches somehow.
            */
            function linkCites(cites, references) {
                cites.forEach(function (cite) {
                    var matching_references = references.filter(function (reference) {
                        return names.authorsMatch(cite.authors, reference.authors) && (cite.year == reference.year);
                    });
                    if (matching_references.length === 1) {
                        cite.reference = matching_references[0];
                    }
                });
            }
            acl.linkCites = linkCites;
        })(acl = styles.acl || (styles.acl = {}));
    })(styles = academia.styles || (academia.styles = {}));
    var names;
    (function (names) {
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
            ['Zhao', 'et al.']
        */
        function splitNames(input) {
            // three split options: (, and ) or ( and ) or (, )
            // TODO: fix the 'et al.' hack
            return input.replace(/\s+et al\./, ', et al.').split(/,\s*and\s+|\s*and\s+|,\s*/);
        }
        names.splitNames = splitNames;
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
        function authorsMatch(citeAuthors, referenceAuthors) {
            return citeAuthors.every(function (citeAuthor, i) {
                if (referenceAuthors[i] && citeAuthor.last === referenceAuthors[i].last) {
                    return true;
                }
                if (citeAuthor.last === 'et al.' && referenceAuthors.length > (i + 1)) {
                    return true;
                }
                return false;
            });
        }
        names.authorsMatch = authorsMatch;
        /**
        Given a name represented by a single string, parse it into first name, middle
        name, and last name.
        
        parseAuthor('Leonardo da Vinci') -> { first: 'Leonardo', last: 'da Vinci' }
        parseAuthor('Chris Callison-Burch') -> { first: 'Chris', last: 'Callison-Burch' }
        parseAuthor('Hanna M Wallach') -> { first: 'Hanna', middle: 'M', last: 'Wallach' }
        parseAuthor('Zhou') -> { last: 'Zhou' }
        parseAuthor('McCallum, Andrew') -> { first: 'Andrew', last: 'McCallum' }
        */
        function parseName(input) {
            // 0. 'et al.' is a special case
            if (input === 'et al.') {
                return { last: input };
            }
            // 1. normalize the comma out
            input = input.split(/,\s*/).reverse().join(' ');
            // 2. split on whitespace
            var parts = input.split(/\s+/);
            var n = parts.length;
            // 3. TODO: handle 'van', 'von', 'da', etc.
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
        names.parseName = parseName;
    })(names = academia.names || (academia.names = {}));
    var types;
    (function (types) {
        /**
        Textual: Brown (2015)
        Parenthetical: (Brown 2015)
        Alternate: Brown 2015
        */
        (function (CiteStyle) {
            CiteStyle[CiteStyle["Textual"] = 0] = "Textual";
            CiteStyle[CiteStyle["Parenthetical"] = 1] = "Parenthetical";
            CiteStyle[CiteStyle["Alternate"] = 2] = "Alternate";
        })(types.CiteStyle || (types.CiteStyle = {}));
        var CiteStyle = types.CiteStyle;
    })(types = academia.types || (academia.types = {}));
})(academia || (academia = {}));
module.exports = academia;
