"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DlVars {
    constructor(gid, msg, isTar, downloadDir) {
        this.isTar = isTar;
        var username;
        if (msg.from.username) {
            username = `@${msg.from.username}`;
        }
        else {
            username = `<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>`;
        }
        this.gid = gid;
        this.downloadDir = downloadDir;
        this.tgFromId = msg.from.id;
        this.tgUsername = username;
        this.tgChatId = msg.chat.id;
        this.tgMessageId = msg.message_id;
        this.startTime = new Date().getTime();
    }
}
exports.DlVars = DlVars;
