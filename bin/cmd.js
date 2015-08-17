#!/usr/bin/env node

var moment = require('moment');
var ProgressBar = require('progress');
var through = require('through2');
var LastfmExportStream = require('lastfmexportstream');
var fs = require('fs');
var path = require('path');
var EOL = require('os').EOL;

var defaults = fs.readFileSync(path.join(__dirname, '../defaults.yml'), 'utf-8');

var aliases = {
	h: 'help',
	u: 'user',
	f: 'format',
	s: 'start',
	e: 'end',
	o: 'outfile'
};

var conf = require('rucola')('lastfmexport', defaults, aliases);

if (conf.help) { return usage(0); }
if (!conf.user) { return exit('Missing username. Try -h for help.'); }

var supportedFormats = [ 'ldjson', 'csv', 'tsv' ];

if (supportedFormats.indexOf(conf.format) === -1) {
	return exit('Unknown format \'' + conf.format + '\'. Try -h for help.');
}

var outFile = conf.outfile || conf.user + '.' + conf.format;

if (outFile !== '-') {
	outFile = path.resolve(outFile);
}

var startTime = conf.start ? moment.utc(conf.start) : null;
var endTime = (conf.end) ? moment.utc(conf.end) : null;

if (startTime && !startTime.isValid()) {
	return exit('Invalid start time. Try -h for help.');
}
if (endTime && !endTime.isValid()) {
	return exit('Invalid end time. Try -h for help.');
}

// Streams
var scrobbles, convert, out, progress;

var lfmOptions = {
	apiKey: 'cd42f85a9b8085627ef7b2c148157425',
	user: conf.user,
	tracksPerRequest: 200
};

if (startTime) { lfmOptions.from = +startTime; }
if (endTime) { lfmOptions.to = +endTime; }

scrobbles = new LastfmExportStream(lfmOptions);

switch (conf.format) {
	case 'tsv':
	case 'csv':
		convert = makeCSVStream();
		break;
	case 'ldjson':
	default:
		convert = makeLDJSONStream();
		break;
}

if (outFile === '-') {
	out = process.stdout;
} else {
	out = fs.createWriteStream(outFile, { encoding: 'utf8' });
}

progress = makeProgressStream();

scrobbles.pipe(progress).pipe(convert).pipe(out);

function usage (code) {
	var rs = fs.createReadStream(__dirname + '/usage.txt');
	rs.pipe(process.stdout);
	rs.on('end', function () {
		if (code !== 0) process.exit(code);
	});
}

function exit (msg) {
	console.error(msg);
	process.exit(1);
}

function makeCSVStream () {
	return (function () {
		var first = true;
		return through.obj(function (track, enc, callback) {
			if (first) {
				first = false;
				this.push([ 'Time', 'Artist', 'Title', 'Album',
					'Track MBID', 'Artist MBID', 'Album MBID'
				].join('\t') + EOL)
			}

			var data = [ track.time, track.artist, track.title, track.album,
			   track.trackMBID, track.artistMBID, track.albumMBID];

			data = data.map(function (field) {
				return String(field).replace(/\t/g, ' ');
			});

			this.push(data.join('\t') + EOL);
			callback();
		});
	})();
}

function makeLDJSONStream () {
	return through.obj(function (track, enc, callback) {
		this.push(JSON.stringify(track) + EOL);
		callback();
	});
}

function makeProgressStream () {
	return (function () {
		var bar;
		var started = false;

		return through.obj(function (track, enc, callback) {
			if (!started && scrobbles.totalTracks) {
				started = true;
				bar = new ProgressBar('  ' + path.basename(outFile) + ' [:bar] :percent :etas', {
					complete: '=',
					incomplete: ' ',
					width: 20,
					total: scrobbles.totalTracks
				});
			}

			bar.tick();

			this.push(track);
			callback();
		});
	})();
}
