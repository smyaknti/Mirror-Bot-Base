"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getFileLink(fileId, isFolder) {
    if (isFolder) {
        return 'https://drive.google.com/drive/folders/' + fileId;
    }
    else {
        return 'https://drive.google.com/uc?id=' + fileId + '&export=download';
    }
}
exports.getFileLink = getFileLink;
function getPublicUrlRequestHeaders(size, mimeType, token, fileName, parent) {
    return {
        method: 'POST',
        url: 'https://www.googleapis.com/upload/drive/v3/files',
        qs: { uploadType: 'resumable' },
        headers: {
            'Postman-Token': '1d58fdd0-0408-45fa-a45d-fc703bff724a',
            'Cache-Control': 'no-cache',
            'X-Upload-Content-Length': size,
            'X-Upload-Content-Type': mimeType,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: {
            name: fileName,
            mimeType: mimeType,
            parents: [parent]
        },
        json: true
    };
}
exports.getPublicUrlRequestHeaders = getPublicUrlRequestHeaders;
