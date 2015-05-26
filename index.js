/// <reference path="./type_declarations/index.d.ts" />
var lexing = require('lexing');
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
            var name = '[A-Z][^()\\s]+(?: [IV]+)?';
            var year = '[0-9]{4}(?:[-–—][0-9]{4})?[a-z]?';
            var citeSources = [
                // et al., duo, and single, with year in parens
                (name + "\\s+et\\s+al.\\s+\\(" + year + "\\)"),
                (name + "\\s+(?:and|&)\\s+" + name + "\\s+\\(" + year + "\\)"),
                (name + "\\s+\\(" + year + "\\)"),
                // et al., duo, and single, with year not in parens (note the commas)
                (name + "\\s+et\\s+al.,\\s+" + year + "\\b"),
                (name + "\\s+(?:and|&)\\s+" + name + ",\\s+" + year + "\\b"),
                (name + ",\\s+" + year + "\\b"),
            ];
            acl.citeRegExp = new RegExp(citeSources.join('|'), 'g');
            acl.yearRegExp = new RegExp(year);
            var citeCleanRegExp = new RegExp("[(),]|" + year, 'g');
            /**
            Given the text of a paper, extract the `Cite`s using regular expressions.
            */
            function parseCites(body) {
                // when String.prototype.match is called with a RegExp with the 'g' (global)
                // flag set, the result will ignore any capture groups and return an Array of
                // strings, or null if the RegExp matched nothing.
                return (body.match(acl.citeRegExp) || []).map(function (cite) {
                    var year_match = cite.match(acl.yearRegExp);
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
            acl.parseCites = parseCites;
            acl.referenceRegExp = new RegExp("^(.+?)[.,]?\\s*\\(?(" + year + ")\\)?\\.\\s*(.+?)\\.");
            /**
            Given a string representing an individual reference in a bibliography, parse
            it into a Reference structure.
            */
            function parseReference(reference) {
                var match = reference.match(acl.referenceRegExp);
                var authors = match ? names.parseNames(match[1]) : [];
                return {
                    authors: authors,
                    year: match ? match[2] : undefined,
                    title: match ? match[3] : undefined,
                };
            }
            acl.parseReference = parseReference;
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
    (function (names_1) {
        var Token = lexing.Token;
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
        function makeName(parts) {
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
        var default_rules = [
            [/^$/, function (match) { return Token('EOF'); }],
            [/^\s+/, function (match) { return null; }],
            [/^,\s+/, function (match) { return Token('SEPARATOR', match[0]); }],
            [/^(and|et|&)/, function (match) { return Token('CONJUNCTION', match[0]); }],
            [/^[A-Z](\.|\s)/, function (match) { return Token('INITIAL', match[0].trim()); }],
            [/^((van|von|da|de)\s+)?[A-Z][^,\s]+(\s+[IVX]+\b)?/i, function (match) { return Token('NAME', match[0]); }],
            // pretty much a catch-all:
            [/^[^,\s]+/i, function (match) { return Token('NAME', match[0]); }],
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
        function parseNames(input) {
            var input_iterable = new lexing.StringIterator(input);
            var tokenizer = new lexing.Tokenizer(default_rules);
            var token_iterator = tokenizer.map(input_iterable);
            var names = [];
            var buffer = [];
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
                    }
                }
            }
            // finish up
            if (buffer.length > 0) {
                flush();
            }
            return names;
        }
        names_1.parseNames = parseNames;
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
        names_1.authorsMatch = authorsMatch;
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
