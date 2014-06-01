#!/usr/bin/env node

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
if (argv.f && argv.f !== 'jsonld' && argv.f !== 'csv' && argv.f !== 'tsv') {
	return exit('Unknown format \'' + argv.f + '\'. Try -h for help.');
}
if (!argv.f) { argv.f = 'jsonld'; }
if (!argv.o) { argv.o = argv.u + '.' + argv.f; }
if (argv.o !== '-') { argv.o = path.resolve(argv.o); }

var scrobbles, convert, out;

scrobbles = new LastfmExportStream({
	apiKey: 'cd42f85a9b8085627ef7b2c148157425',
	user: argv.u
});

switch (argv.f) {
	case 'csv':
		convert = (function () {
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
		break;
	case 'tsv':
	case 'jsonld':
	default:
		convert = through.obj(function (track, enc, callback) {
			this.push(JSON.stringify(track) + EOL);
			callback();
		});
		break;
}

if (argv.o === '-') {
	out = process.stdout;
} else {
	out = fs.createWriteStream(argv.o, { encoding: 'utf8' });
}

var progress = (function () {
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
