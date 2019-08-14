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
const constants = require("./.constants");
const http = require("http");
const ariaTools = require("./download_tools/aria-tools");
const dlm = require("./dl_model/dl-manager");
var dlManager = dlm.DlManager.getInstance();
function deleteMsg(bot, msg, delay) {
    return __awaiter(this, void 0, void 0, function* () {
        if (delay)
            yield sleep(delay);
        bot.deleteMessage(msg.chat.id, msg.message_id.toString())
            .catch();
    });
}
exports.deleteMsg = deleteMsg;
function editMessage(bot, msg, text, suppressError) {
    return new Promise((resolve, reject) => {
        if (msg && msg.chat && msg.chat.id && msg.message_id) {
            bot.editMessageText(text, {
                chat_id: msg.chat.id,
                message_id: msg.message_id,
                parse_mode: 'HTML'
            })
                .then(resolve)
                .catch(err => {
                if (err.message !== suppressError) {
                    console.log(`editMessage error: ${err.message}`);
                }
                reject(err);
            });
        }
        else {
            resolve();
        }
    });
}
exports.editMessage = editMessage;
function sendMessage(bot, msg, text, delay, callback, quickDeleteOriginal) {
    if (!delay)
        delay = 5000;
    bot.sendMessage(msg.chat.id, text, {
        reply_to_message_id: msg.message_id,
        parse_mode: 'HTML'
    })
        .then((res) => {
        if (callback)
            callback(res);
        if (delay > -1) {
            deleteMsg(bot, res, delay);
            if (quickDeleteOriginal) {
                deleteMsg(bot, msg);
            }
            else {
                deleteMsg(bot, msg, delay);
            }
        }
    })
        .catch((err) => {
        console.error(`sendMessage error: ${err.message}`);
    });
}
exports.sendMessage = sendMessage;
function sendUnauthorizedMessage(bot, msg) {
    sendMessage(bot, msg, `You aren't authorized to use this bot here.`);
}
exports.sendUnauthorizedMessage = sendUnauthorizedMessage;
function sendMessageReplyOriginal(bot, dlDetails, message) {
    return bot.sendMessage(dlDetails.tgChatId, message, {
        reply_to_message_id: dlDetails.tgMessageId,
        parse_mode: 'HTML'
    });
}
exports.sendMessageReplyOriginal = sendMessageReplyOriginal;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
function isAuthorized(msg, skipDlOwner) {
    for (var i = 0; i < constants.SUDO_USERS.length; i++) {
        if (constants.SUDO_USERS[i] === msg.from.id)
            return 0;
    }
    if (!skipDlOwner && msg.reply_to_message) {
        var dlDetails = dlManager.getDownloadByMsgId(msg.reply_to_message);
        if (dlDetails && msg.from.id === dlDetails.tgFromId)
            return 1;
    }
    if (constants.AUTHORIZED_CHATS.indexOf(msg.chat.id) > -1 &&
        msg.chat.all_members_are_administrators)
        return 2;
    if (constants.AUTHORIZED_CHATS.indexOf(msg.chat.id) > -1)
        return 3;
    return -1;
}
exports.isAuthorized = isAuthorized;
function isAdmin(bot, msg, callback) {
    bot.getChatAdministrators(msg.chat.id)
        .then(members => {
        for (var i = 0; i < members.length; i++) {
            if (members[i].user.id === msg.from.id) {
                callback(null, true);
                return;
            }
        }
        callback(null, false);
    })
        .catch(() => {
        callback(null, false);
    });
}
exports.isAdmin = isAdmin;
/**
 * Notifies an external webserver once a download is complete.
 * @param {boolean} successful True is the download completed successfully
 * @param {string} gid The GID of the downloaded file
 * @param {number} originGroup The Telegram chat ID of the group where the download started
 * @param {string} driveURL The URL of the uploaded file
 */
function notifyExternal(successful, gid, originGroup, driveURL) {
    if (!constants.DOWNLOAD_NOTIFY_TARGET || !constants.DOWNLOAD_NOTIFY_TARGET.enabled)
        return;
    ariaTools.getStatus(gid, (err, message, filename, filesize) => {
        var name;
        var size;
        if (!err) {
            if (filename !== 'Metadata')
                name = filename;
            if (filesize !== '0B')
                size = filesize;
        }
        // TODO: Check which vars are undefined and make those null
        const data = JSON.stringify({
            successful: successful,
            file: {
                name: name,
                driveURL: driveURL,
                size: size
            },
            originGroup: originGroup
        });
        const options = {
            host: constants.DOWNLOAD_NOTIFY_TARGET.host,
            port: constants.DOWNLOAD_NOTIFY_TARGET.port,
            path: constants.DOWNLOAD_NOTIFY_TARGET.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };
        var req = http.request(options);
        req.on('error', (e) => {
            console.error(`notifyExternal failed: ${e.message}`);
        });
        req.write(data);
        req.end();
    });
}
exports.notifyExternal = notifyExternal;
