#!/usr/bin/env node

var moment = require('moment');
var minimist = require('minimist');
var ProgressBar = require('progress');
var through = require('through2');
var LastfmExportStream = require('lastfmexportstream');
var fs = require('fs');
var path = require('path');
var EOL = require('os').EOL;

var argv = minimist(process.argv.slice(2), {
	alias: {
		h: 'help',
		u: 'user',
		f: 'format',
		s: 'start',
		e: 'end',
		o: 'outfile'
	}
});

if (argv.h) { return usage(0); }
if (!argv.u) { return exit('Missing username. Try -h for help.'); }
if (argv.f && argv.f !== 'ldjson' && argv.f !== 'csv' && argv.f !== 'tsv') {
	return exit('Unknown format \'' + argv.f + '\'. Try -h for help.');
}
if (!argv.f) { argv.f = 'ldjson'; }
if (!argv.o) { argv.o = argv.u + '.' + argv.f; }
if (argv.o !== '-') { argv.o = path.resolve(argv.o); }

argv.s = (argv.s) ? moment.utc(argv.s) : null;
argv.e = (argv.e) ? moment.utc(argv.e) : null;

if (argv.s && !argv.s.isValid()) {
	return exit('Invalid start time. Try -h for help.');
}
if (argv.e && !argv.e.isValid()) {
	return exit('Invalid end time. Try -h for help.');
}

// Streams
var scrobbles, convert, out, progress;

var lfmOptions = {
	apiKey: 'cd42f85a9b8085627ef7b2c148157425',
	user: argv.u,
	tracksPerRequest: 200
};

if (argv.s) { lfmOptions.from = +argv.s; }
if (argv.e) { lfmOptions.to = +argv.e; }

scrobbles = new LastfmExportStream(lfmOptions);

switch (argv.f) {
	case 'tsv':
	case 'csv':
		convert = makeCSVStream();
		break;
	case 'ldjson':
	default:
		convert = makeLDJSONStream();
		break;
}

if (argv.o === '-') {
	out = process.stdout;
} else {
	out = fs.createWriteStream(argv.o, { encoding: 'utf8' });
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
				bar = new ProgressBar('  ' + path.basename(argv.o) + ' [:bar] :percent :etas', {
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
