lastfmexport
============

A command-line utility to export or backup your Last.fm scrobble history to file.

### Installation

```bash
npm install lastfmexport -g
```

### Usage

`lastfmexport --help`

`lastfmexport -u <username> [options]`


__Options:__

 - `-h  or --help`: Show this help message
 - `-u  or --user`: Last.fm username
 - `-f  or --format`: (optional) Output format: ldjson or csv. Default: ldjson
 - `-s  or --start`: (optional) ISO date string in UTC of the first (oldest) scrobble.
 - `-e  or --end`: (optional) ISO date string in UTC of the latest scrobble.
 - `-o  or --outfile`: (optional )Output file path. Specifying '-' will print to stdout. Default: `username.format`

### License

MIT License

Copyright (c) 2014 Max Kueng (http://maxkueng.com/)
