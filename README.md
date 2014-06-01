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
 - `-f  or --format`: Output format: jsonld or csv. Default: jsonld
 - `-o  or --outfile`: Output file path. Specifying '-' will print to stdout. Default: <username>.<format>

 ### License

 MIT License

 Copyright (c) 2014 Max Kueng (http://maxkueng.com/)