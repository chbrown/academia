/// <reference path="../type_declarations/index.d.ts" />
import * as fs from 'fs';
import * as chalk from 'chalk';
import * as yargs from 'yargs';

import types = require('../types');
import acl = require('../styles/acl');

function stderr(line: string) {
  process.stderr.write(chalk.magenta(line) + '\n');
}
function stdout(line: string) {
  process.stdout.write(line + '\n');
}

function highlight(filename: string) {
  stderr(`highlighting ${filename}`);
  var paper_json = fs.readFileSync(filename, {encoding: 'utf8'});
  var paper: types.Paper = JSON.parse(paper_json);

  var content = paper.sections
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

  stdout(content);
}

function link(filename: string) {
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
  stdout(JSON.stringify(paper));
}

export function main() {
  var argvparser = yargs
    .usage('Usage: academia <command> <arguments>')
    .command('highlight', 'highlight references in paper')
    .example('academia highlight P14-1148.pdf.json',
      'Print the Paper specified in P14-1148.pdf.json as plaintext with the references highlighted')
    .command('link', 'detect references, citations, and link citations to references as possible')
    .example('academia link P14-1148.pdf.json',
      'Detect cites and references, link them, and print the full enhanced Paper object')
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
      argv._.slice(1).forEach(arg => highlight(arg));
    }
    else if (command === 'link') {
      argv._.slice(1).forEach(arg => link(arg));
    }
    else {
      stderr(`Unrecognized command: "${command}"`);
      process.exit(1);
    }
  }
}
