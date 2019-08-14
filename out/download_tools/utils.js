"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const filenameUtils = require("./filename-utils");
const constants = require("../.constants");
const ariaTools = require("./aria-tools.js");
const msgTools = require("../msg-tools.js");
const dlm = require("../dl_model/dl-manager");
var dlManager = dlm.DlManager.getInstance();
const PROGRESS_MAX_SIZE = Math.floor(100 / 8);
const PROGRESS_INCOMPLETE = ['▏', '▎', '▍', '▌', '▋', '▊', '▉'];
function deleteDownloadedFile(subdirName) {
    fs.remove(`${constants.ARIA_DOWNLOAD_LOCATION}/${subdirName}`)
        .then(() => {
        console.log(`cleanup: Deleted ${subdirName}\n`);
    })
        .catch((err) => {
        console.error(`cleanup: Failed to delete ${subdirName}: ${err.message}\n`);
    });
}
exports.deleteDownloadedFile = deleteDownloadedFile;
function downloadETA(totalLength, completedLength, speed) {
    if (speed === 0)
        return '-';
    var time = (totalLength - completedLength) / speed;
    var seconds = Math.floor(time % 60);
    var minutes = Math.floor((time / 60) % 60);
    var hours = Math.floor(time / 3600);
    if (hours === 0) {
        if (minutes === 0) {
            return `${seconds}s`;
        }
        else {
            return `${minutes}m ${seconds}s`;
        }
    }
    else {
        return `${hours}h ${minutes}m ${seconds}s`;
    }
}
function getSingleStatus(dlDetails, msg) {
    return new Promise(resolve => {
        var authorizedCode;
        if (msg) {
            authorizedCode = msgTools.isAuthorized(msg);
        }
        else {
            authorizedCode = 1;
        }
        if (authorizedCode > -1) {
            ariaTools.getStatus(dlDetails.gid, (err, message, filename) => {
                if (err) {
                    resolve({
                        message: `Error: ${dlDetails.gid} - ${err}`
                    });
                }
                else {
                    if (dlDetails.isUploading) {
                        resolve({
                            message: `<i>${filename}</i> - Uploading`
                        });
                    }
                    else {
                        resolve({
                            message: message,
                            filename: filename,
                            dlDetails: dlDetails
                        });
                    }
                }
            });
        }
        else {
            resolve({ message: `You aren't authorized to use this bot here.` });
        }
    });
}
/**
 * Get a single status message for all active and queued downloads.
 */
function getStatusMessage() {
    var singleStatusArr = [];
    dlManager.forEachDownload(dlDetails => {
        singleStatusArr.push(getSingleStatus(dlDetails));
    });
    var result = Promise.all(singleStatusArr)
        .then(statusArr => {
        if (statusArr && statusArr.length > 0) {
            var message;
            statusArr.sort((a, b) => (a.dlDetails && b.dlDetails) ? (a.dlDetails.startTime - b.dlDetails.startTime) : 1)
                .forEach((value, index) => {
                if (index > 0) {
                    message = `${message}\n\n${value.message}`;
                }
                else {
                    message = value.message;
                }
            });
            return {
                message: message,
                totalDownloadCount: statusArr.length,
                singleStatuses: statusArr
            };
        }
        else {
            return {
                message: 'No active or queued downloads',
                totalDownloadCount: 0
            };
        }
    })
        .catch(error => {
        console.log(`getStatusMessage: ${error}`);
        return error;
    });
    return result;
}
exports.getStatusMessage = getStatusMessage;
/**
 * Generates a human-readable message for the status of the given download
 * @param {number} totalLength The total size of the download
 * @param {number} completedLength The downloaded length
 * @param {number} speed The speed of the download in B/s
 * @param {any[]} files The list of files in the download
 * @returns {StatusMessage} An object containing a printable status message and the file name
 */
function generateStatusMessage(totalLength, completedLength, speed, files) {
    var filePath = filenameUtils.findAriaFilePath(files);
    var fileName = filenameUtils.getFileNameFromPath(filePath.path, filePath.inputPath, filePath.downloadUri);
    var progress;
    if (totalLength === 0) {
        progress = 0;
    }
    else {
        progress = Math.round(completedLength * 100 / totalLength);
    }
    var totalLengthStr = formatSize(totalLength);
    var progressString = generateProgress(progress);
    var speedStr = formatSize(speed);
    var eta = downloadETA(totalLength, completedLength, speed);
    var message = `<i>${fileName}</i> - <code>${progressString}</code> of ${totalLengthStr} at ${speedStr}ps, ETA: ${eta}`;
    var status = {
        message: message,
        filename: fileName,
        filesize: totalLengthStr
    };
    return status;
}
exports.generateStatusMessage = generateStatusMessage;
function generateProgress(p) {
    p = Math.min(Math.max(p, 0), 100);
    var str = '[';
    var cFull = Math.floor(p / 8);
    var cPart = p % 8 - 1;
    str += '█'.repeat(cFull);
    if (cPart >= 0) {
        str += PROGRESS_INCOMPLETE[cPart];
    }
    str += ' '.repeat(PROGRESS_MAX_SIZE - cFull);
    str = `${str}] ${p}%`;
    return str;
}
function formatSize(size) {
    if (size < 1000) {
        return formatNumber(size) + 'B';
    }
    if (size < 1024000) {
        return formatNumber(size / 1024) + 'KB';
    }
    if (size < 1048576000) {
        return formatNumber(size / 1048576) + 'MB';
    }
    return formatNumber(size / 1073741824) + 'GB';
}
exports.formatSize = formatSize;
function formatNumber(n) {
    return Math.round(n * 100) / 100;
}
function isDownloadAllowed(url) {
    for (var i = 0; i < constants.ARIA_FILTERED_DOMAINS.length; i++) {
        if (url.indexOf(constants.ARIA_FILTERED_DOMAINS[i]) > -1)
            return false;
    }
    return true;
}
exports.isDownloadAllowed = isDownloadAllowed;
