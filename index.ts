import {readFileSync, createWriteStream} from 'fs';
import * as chalk from 'chalk';
import * as optimist from 'optimist';

import {Paper} from './types';
import {citeRegExp, linkPaper} from './styles/acl';

function stderr(line: string) {
  process.stderr.write(chalk.magenta(line) + '\n');
}

function highlight(filename: string): string {
  stderr(`highlighting ${filename}`);
  var paper_json = readFileSync(filename, {encoding: 'utf8'});
  var paper: Paper = JSON.parse(paper_json);

  return paper.sections
    .map(section => `# ${section.title}\n${section.paragraphs.join('\n')}`)
    .join('\n')
    // color the References section header/title magenta
    .replace(/# References?/g, group0 => {
      return chalk.blue(group0).toString();
    })
    // color each cite green
    .replace(citeRegExp, group0 => {
      return chalk.green(group0).toString();
    });
}

function link(filename: string): Paper {
  var paper_json = readFileSync(filename, {encoding: 'utf8'});
  var original_paper: Paper = JSON.parse(paper_json);
  // extract body and references from Paper object
  var paper = linkPaper(original_paper);
  var linked_cites = paper.cites.filter(cite => cite.references.length > 0);
  // report
  var report = {
    filename,
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
  var argvparser = optimist
    .usage([
      'Usage: academia <command> <file>',
      '',
      'Commands:',
      '  highlight: highlight references in paper, e.g.:',
      '    academia highlight P14-1148.pdf.json -- Print the Paper specified in P14-1148.pdf.json as plaintext with the references highlighted',
      '  link: detect references, citations, and link citations to references as possible, e.g.:',
      '    academia link P14-1148.pdf.json -- Detect cites and references, link them, and print the full enhanced Paper object',
    ].join('\n'))
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

    var outputStream = (argv.output == '-') ? process.stdout : createWriteStream(argv.output, {encoding: 'utf8'});
    outputStream.write(output + '\n');
  }
}
