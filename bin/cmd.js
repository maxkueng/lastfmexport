#!/usr/bin/env node
var ArgumentParser = require('argparse').ArgumentParser
var csvWriter = require('csv-write-stream')
var EOL = require('os').EOL
var fs = require('fs')
var LastfmExportStream = require('lastfmexportstream')
var moment = require('moment')
var packageInfo = require('../package')
var path = require('path')
var ProgressBar = require('progress')
var through = require('through2')

var argparser = new ArgumentParser({
  addHelp: true,
  description: packageInfo.description,
  version: packageInfo.version
})

argparser.addArgument(['-u', '--user'], {
  type: 'string',
  help: 'Last.fm username.',
  required: true
})

argparser.addArgument(['-f', '--format'], {
  type: 'string',
  help: 'Output format, defaults to ldjson.',
  choices: ['ldjson', 'csv', 'tsv'],
  defaultValue: 'ldjson'
})

argparser.addArgument(['-s', '--start'], {
  type: 'string',
  help: 'ISO date string in UTC of the first scrobble.',
})

argparser.addArgument(['-e', '--end'], {
  type: 'string',
  help: 'ISO date string in UTC of the latest scrobble.',
})

argparser.addArgument(['-o', '--outfile'], {
  type: 'string',
  help: 'Output file path. Specifying "-" will print to stdout. Defaults to "<username>.<format>".',
})

var conf = argparser.parseArgs()
var outFile = conf.outfile || conf.user + '.' + conf.format

if (outFile !== '-') {
  outFile = path.resolve(outFile)
}

var startTime = conf.start ? moment.utc(conf.start) : null
var endTime = conf.end ? moment.utc(conf.end) : null

if (startTime && !startTime.isValid()) {
  exit('Invalid start time. Try -h for help.')
}
if (endTime && !endTime.isValid()) {
  exit('Invalid end time. Try -h for help.')
}

// Streams
var scrobbles, convert, out, progress

var lfmOptions = {
  apiKey: 'cd42f85a9b8085627ef7b2c148157425',
  user: conf.user,
  tracksPerRequest: 200
}

if (startTime) { lfmOptions.from = +startTime; }
if (endTime) { lfmOptions.to = +endTime; }

scrobbles = new LastfmExportStream(lfmOptions)

switch (conf.format) {
  case 'tsv':
  case 'csv':
    convert = csvWriter()
    break
  case 'ldjson':
  default:
    convert = makeLDJSONStream()
    break
}

if (outFile === '-') {
  out = process.stdout
} else {
  out = fs.createWriteStream(outFile, {encoding: 'utf8'})
}

progress = makeProgressStream()

scrobbles.pipe(progress).pipe(convert).pipe(out)

function exit (msg) {
  console.error(msg)
  process.exit(1)
}

function makeLDJSONStream () {
  return through.obj(function (track, enc, callback) {
    this.push(JSON.stringify(track) + EOL)
    callback()
  })
}

function makeProgressStream () {
  return (function () {
    var bar
    var started = false

    return through.obj(function (track, enc, callback) {
      if (!started && scrobbles.totalTracks) {
        started = true
        bar = new ProgressBar('  ' + path.basename(outFile) + ' [:bar] :percent :etas', {
          complete: '=',
          incomplete: ' ',
          width: 20,
          total: scrobbles.totalTracks
        })
      }

      bar.tick()

      this.push(track)
      callback()
    })
  })()
}
