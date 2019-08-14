"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const driveAuth = require("./drive-auth");
const driveFile = require("./upload-file");
const utils = require("./drive-utils");
const googleapis_1 = require("googleapis");
const constants = require("../.constants.js");
function uploadFileOrFolder(filePath, mime, parent, size, callback) {
    driveAuth.call((err, auth) => {
        if (err) {
            callback(err, null);
            return;
        }
        const drive = googleapis_1.google.drive({ version: 'v3', auth });
        if (mime === 'application/vnd.google-apps.folder' || size === 0) {
            createFolderOrEmpty(drive, filePath, parent, mime, callback);
        }
        else {
            driveFile.uploadGoogleDriveFile(parent, {
                filePath: filePath,
                mimeType: mime
            })
                .then(id => callback(null, id))
                .catch(err => callback(err.message, null));
        }
    });
}
exports.uploadFileOrFolder = uploadFileOrFolder;
function createFolderOrEmpty(drive, filePath, parent, mime, callback) {
    drive.files.create({
        // @ts-ignore Unknown property error
        fields: 'id',
        requestBody: {
            mimeType: mime,
            name: filePath.substring(filePath.lastIndexOf('/') + 1),
            parents: [parent]
        }
    }, (err, res) => {
        if (err) {
            callback(err.message, null);
        }
        else {
            callback(null, res.data.id);
        }
    });
}
function getSharableLink(fileId, isFolder, callback) {
    driveAuth.call((err, auth) => {
        if (err) {
            callback(err, null);
            return;
        }
        const drive = googleapis_1.google.drive({ version: 'v3', auth });
        createPermissions(drive, fileId)
            .then(() => {
            callback(null, utils.getFileLink(fileId, isFolder));
        })
            .catch(err => {
            callback(err.message, null);
        });
    });
}
exports.getSharableLink = getSharableLink;
function createPermissions(drive, fileId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (constants.DRIVE_FILE_PRIVATE && constants.DRIVE_FILE_PRIVATE.ENABLED) {
            var req = [];
            for (var email of constants.DRIVE_FILE_PRIVATE.EMAILS) {
                var perm = yield drive.permissions.create({
                    fileId: fileId,
                    requestBody: {
                        role: 'reader',
                        type: 'user',
                        emailAddress: email
                    }
                });
                req.push(perm);
            }
            return Promise.all(req);
        }
        else {
            return drive.permissions.create({
                fileId: fileId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            });
        }
    });
}
