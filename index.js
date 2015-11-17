var fs_1 = require('fs');
var chalk = require('chalk');
var yargs = require('yargs');
var acl_1 = require('./styles/acl');
function stderr(line) {
    process.stderr.write(chalk.magenta(line) + '\n');
}
function highlight(filename) {
    stderr("highlighting " + filename);
    var paper_json = fs_1.readFileSync(filename, { encoding: 'utf8' });
    var paper = JSON.parse(paper_json);
    return paper.sections
        .map(function (section) { return ("# " + section.title + "\n" + section.paragraphs.join('\n')); })
        .join('\n')
        .replace(/# References?/g, function (group0) {
        return chalk.blue(group0).toString();
    })
        .replace(acl_1.citeRegExp, function (group0) {
        return chalk.green(group0).toString();
    });
}
function link(filename) {
    var paper_json = fs_1.readFileSync(filename, { encoding: 'utf8' });
    var original_paper = JSON.parse(paper_json);
    // extract body and references from Paper object
    var paper = acl_1.linkPaper(original_paper);
    var linked_cites = paper.cites.filter(function (cite) { return cite.references.length > 0; });
    // report
    var report = {
        filename: filename,
        references: paper.references.length,
        cites: paper.cites.length,
        linked: linked_cites.length,
        linking_success: (100 * linked_cites.length / paper.cites.length).toFixed(0) + '%'
    };
    // report
    stderr(JSON.stringify(report));
    // output analysis
    return paper;
}
function main() {
    var argvparser = yargs
        .usage('Usage: academia <command> <file>')
        .command('highlight', 'highlight references in paper')
        .example('academia highlight P14-1148.pdf.json', 'Print the Paper specified in P14-1148.pdf.json as plaintext with the references highlighted')
        .command('link', 'detect references, citations, and link citations to references as possible')
        .example('academia link P14-1148.pdf.json', 'Detect cites and references, link them, and print the full enhanced Paper object')
        .describe({
        output: 'output file (- for STDOUT)',
        help: 'print this help message',
        verbose: 'print debug messages',
        version: 'print version',
    })
        .alias({
        o: 'output',
        h: 'help',
        v: 'verbose',
    })
        .boolean([
        'help',
        'verbose',
    ])
        .default({
        output: '-',
    });
    var argv = argvparser.argv;
    if (argv.help) {
        argvparser.showHelp();
    }
    else if (argv.version) {
        console.log(require('../package').version);
    }
    else {
        argv = argvparser.demand(2).argv;
        // pull off positional arguments
        var command = argv._[0];
        var input_filename = argv._[1];
        // apply command to input
        var output;
        if (command === 'highlight') {
            output = highlight(input_filename);
        }
        else if (command === 'link') {
            var paper = link(input_filename);
            output = JSON.stringify(paper);
        }
        else {
            stderr("Unrecognized command: \"" + command + "\"");
            process.exit(1);
        }
        var outputStream = (argv.output == '-') ? process.stdout : fs_1.createWriteStream(argv.output, { encoding: 'utf8' });
        outputStream.write(output + '\n');
    }
}
exports.main = main;
