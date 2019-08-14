"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tar = require("tar");
const fs = require("fs");
function archive(srcPath, destName, callback) {
    var dlDirPath = srcPath.substring(0, srcPath.lastIndexOf('/'));
    var writeStream = fs.createWriteStream(`${dlDirPath}/${destName}`);
    var targetDirName = `${srcPath.substring(srcPath.lastIndexOf('/') + 1)}`;
    var size = 0;
    writeStream.on('close', () => callback(null, size));
    writeStream.on('error', (err) => callback(err, size));
    var stream = tar.c({
        // @ts-ignore Unknown property error
        maxReadSize: 163840,
        jobs: 1,
        cwd: dlDirPath
    }, [targetDirName]);
    stream.on('error', (err) => callback(err, size));
    stream.on('data', (chunk) => {
        size += chunk.length;
    });
    stream.pipe(writeStream);
}
exports.archive = archive;
