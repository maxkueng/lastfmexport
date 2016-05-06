# lastfmexport

A command-line utility to export or backup your Last.fm scrobble history to file.

## Installation

```bash
npm install lastfmexport -g
```

## Usage

```
$ lastfmexport --help
usage: lastfmexport [-h] [-v] -u USER [-f {ldjson,csv,tsv}] [-s START] [-e END]
              [-o OUTFILE]


Command-line utility to export a Last.fm user's scrobbles to file

Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  -u USER, --user USER  Last.fm username.
  -f {ldjson,csv,tsv}, --format {ldjson,csv,tsv}
                        Output format, defaults to ldjson.
  -s START, --start START
                        ISO date string in UTC of the first scrobble.
  -e END, --end END     ISO date string in UTC of the latest scrobble.
  -o OUTFILE, --outfile OUTFILE
                        Output file path. Specifying "-" will print to stdout.
                         Defaults to "<username>.<format>".
```
