/// <reference path="../type_declarations/index.d.ts" />
import * as fs from 'fs';
import * as stream from 'stream';
import * as chalk from 'chalk';
import * as yargs from 'yargs';

import types = require('../types');
import acl = require('../styles/acl');

function stderr(line: string) {
  process.stderr.write(chalk.magenta(line) + '\n');
}

function highlight(filename: string): string {
  stderr(`highlighting ${filename}`);
  var paper_json = fs.readFileSync(filename, {encoding: 'utf8'});
  var paper: types.Paper = JSON.parse(paper_json);

  return paper.sections
    .map(section => `# ${section.title}\n${section.paragraphs.join('\n')}`)
    .join('\n')
    // color the References section header/title magenta
    .replace(/# References?/g, group0 => {
      return chalk.blue(group0).toString();
    })
    // color each cite green
    .replace(acl.citeRegExp, group0 => {
      return chalk.green(group0).toString();
    });
}

function link(filename: string): types.Paper {
  var paper_json = fs.readFileSync(filename, {encoding: 'utf8'});
  var paper: types.Paper = JSON.parse(paper_json);
  // extract body and references from Paper object
  acl.linkPaper(paper);
  var linked_cites = paper.cites.filter(cite => cite.reference !== undefined);
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

export function main() {
  var argvparser = yargs
    .usage('Usage: academia <command> <file>')
    .command('highlight', 'highlight references in paper')
    .example('academia highlight P14-1148.pdf.json',
      'Print the Paper specified in P14-1148.pdf.json as plaintext with the references highlighted')
    .command('link', 'detect references, citations, and link citations to references as possible')
    .example('academia link P14-1148.pdf.json',
      'Detect cites and references, link them, and print the full enhanced Paper object')
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
    var command: string = argv._[0];
    var input_filename: string = argv._[1];
    // apply command to input
    var output: string;
    if (command === 'highlight') {
      output = highlight(input_filename);
    }
    else if (command === 'link') {
      var paper = link(input_filename);
      output = JSON.stringify(paper);
    }
    else {
      stderr(`Unrecognized command: "${command}"`);
      process.exit(1);
    }

    var outputStream = (argv.output == '-') ? process.stdout : fs.createWriteStream(argv.output, {encoding: 'utf8'});
    outputStream.write(output + '\n');
  }
}
