/// <reference path="../type_declarations/index.d.ts" />
var fs = require('fs');
var chalk = require('chalk');
var yargs = require('yargs');
var acl = require('../styles/acl');
function stderr(line) {
    process.stderr.write(chalk.magenta(line) + '\n');
}
function stdout(line) {
    process.stdout.write(line + '\n');
}
function highlight(filename) {
    stderr("highlighting " + filename);
    var paper_json = fs.readFileSync(filename, { encoding: 'utf8' });
    var paper = JSON.parse(paper_json);
    var content = paper.sections
        .map(function (section) { return ("# " + section.title + "\n" + section.paragraphs.join('\n')); })
        .join('\n')
        .replace(/# References/g, function (group0) {
        return chalk.blue(group0).toString();
    })
        .replace(acl.citeRegExp, function (group0) {
        return chalk.green(group0).toString();
    });
    stdout(content);
}
function link(filename) {
    stderr("linking " + filename);
    var paper_json = fs.readFileSync(filename, { encoding: 'utf8' });
    var paper = JSON.parse(paper_json);
    // extract body and references from Paper object
    var body = paper.sections
        .filter(function (section) { return !section.title.match(/References/); })
        .map(function (section) { return ("# " + section.title + "\n" + section.paragraphs.join('\n')); })
        .join('\n');
    var references = paper.sections
        .filter(function (section) { return !!section.title.match(/References/); })
        .map(function (section) { return section.paragraphs.map(acl.parseReference); })[0] || [];
    // parse cites from body and link them when possible
    var cites = acl.parseCites(body);
    acl.linkCites(cites, references);
    var linked_cites = cites.filter(function (cite) { return cite.reference !== undefined; });
    // report
    stderr("found " + references.length + " references, linked " + linked_cites.length + "/" + cites.length + " cites");
    // add analysis to original paper
    paper.references = references;
    paper.cites = cites;
    stdout(JSON.stringify(paper));
}
function main() {
    var argvparser = yargs
        .usage('Usage: academia <command> <arguments>')
        .command('highlight', 'highlight references in paper')
        .example('academia highlight P14-1148.pdf.json', 'Print the Paper specified in P14-1148.pdf.json as plaintext with the references highlighted')
        .command('link', 'detect references, citations, and link citations to references as possible')
        .example('academia link P14-1148.pdf.json', 'Print the ')
        .describe({
        help: 'print this help message',
        verbose: 'print debug messages',
        version: 'print version',
    })
        .alias({
        help: 'h',
        verbose: 'v',
    })
        .boolean([
        'help',
        'verbose',
    ]);
    var argv = argvparser.argv;
    if (argv.help) {
        argvparser.showHelp();
    }
    else if (argv.version) {
        stdout(require('../package').version);
    }
    else {
        argv = argvparser.demand(1).argv;
        var command = argv._[0];
        if (command === 'highlight') {
            argv._.slice(1).forEach(function (arg) { return highlight(arg); });
        }
        else if (command === 'link') {
            argv._.slice(1).forEach(function (arg) { return link(arg); });
        }
        else {
            stderr("Unrecognized command: \"" + command + "\"");
            process.exit(1);
        }
    }
}
exports.main = main;
