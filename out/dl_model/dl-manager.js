"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dlDetails = require("./detail");
class DlManager {
    constructor() {
        this.allDls = {};
        this.activeDls = {};
        /**
         * Stores all general status messages. General status messages show the status
         * of all downloads. Each chat can have at most 1 general status message.
         * Key: Chat ID: number
         * Value: Status message: TelegramBot.Message
         */
        this.statusAll = {};
        this.statusLock = {};
        this.cancelledMessages = {};
        this.cancelledDls = {};
    }
    static getInstance() {
        if (!DlManager.instance) {
            DlManager.instance = new DlManager();
        }
        return DlManager.instance;
    }
    addDownload(gid, dlDir, msg, isTar) {
        var detail = new dlDetails.DlVars(gid, msg, isTar, dlDir);
        this.allDls[gid] = detail;
    }
    getDownloadByGid(gid) {
        return this.allDls[gid];
    }
    /**
     * Mark a download as active, once Aria2 starts downloading it.
     * @param dlDetails The details for the download
     */
    moveDownloadToActive(dlDetails) {
        dlDetails.isDownloading = true;
        dlDetails.isUploading = false;
        this.activeDls[dlDetails.gid] = dlDetails;
    }
    /**
     * Update the GID of a download. This is needed if a download causes Aria2c to start
     * another download, for example, in the case of BitTorrents. This function also
     * marks the download as inactive, because we only find out about the new GID when
     * Aria2c calls onDownloadComplete, at which point, the metadata download has been
     * completed, but the files download hasn't yet started.
     * @param oldGid The GID of the original download (the download metadata)
     * @param newGid The GID of the new download (the files specified in the metadata)
     */
    changeDownloadGid(oldGid, newGid) {
        var dlDetails = this.getDownloadByGid(oldGid);
        this.deleteDownload(oldGid);
        dlDetails.gid = newGid;
        dlDetails.isDownloading = false;
        this.allDls[newGid] = dlDetails;
    }
    /**
     * Gets a download by the download command message, or the original reply
     * to the download command message.
     * @param msg The download command message
     */
    getDownloadByMsgId(msg) {
        for (var dl of Object.keys(this.allDls)) {
            var download = this.allDls[dl];
            if (download.tgChatId === msg.chat.id &&
                (download.tgMessageId === msg.message_id)) {
                return download;
            }
        }
        return null;
    }
    deleteDownload(gid) {
        delete this.allDls[gid];
        delete this.activeDls[gid];
    }
    /**
     * Call the callback function for each download.
     * @param callback
     */
    forEachDownload(callback) {
        for (var key of Object.keys(this.allDls)) {
            var details = this.allDls[key];
            callback(details);
        }
    }
    deleteStatus(chatId) {
        delete this.statusAll[chatId];
    }
    /**
     * Returns the general status message for a target chat.
     * @param chatId The chat ID of the target chat
     * @returns {TelegramBot.Message} The status message for the target group
     */
    getStatus(chatId) {
        return this.statusAll[chatId];
    }
    addStatus(msg, lastStatus) {
        this.statusAll[msg.chat.id] = {
            msg: msg,
            lastStatus: lastStatus
        };
    }
    /**
     * Call the callback function for each general status message.
     * @param callback
     */
    forEachStatus(callback) {
        for (var key of Object.keys(this.statusAll)) {
            callback(this.statusAll[key]);
        }
    }
    /**
     * Prevents race conditions when multiple status messages are sent in a short time.
     * Makes sure that a status message has been properly sent before allowing the next one.
     * @param msg The Telegram message that caused this status update
     * @param toCall The function to call to perform the status update
     */
    setStatusLock(msg, toCall) {
        if (!this.statusLock[msg.chat.id]) {
            this.statusLock[msg.chat.id] = Promise.resolve();
        }
        this.statusLock[msg.chat.id] = this.statusLock[msg.chat.id].then(() => {
            return toCall(msg, true);
        });
    }
    addCancelled(dlDetails) {
        this.cancelledDls[dlDetails.gid] = dlDetails;
        var message = this.cancelledMessages[dlDetails.tgChatId];
        if (message) {
            if (this.checkUnique(dlDetails.tgUsername, message)) {
                message.push(dlDetails.tgUsername);
            }
        }
        else {
            message = [dlDetails.tgUsername];
        }
        this.cancelledMessages[dlDetails.tgChatId] = message;
    }
    forEachCancelledDl(callback) {
        for (var key of Object.keys(this.cancelledDls)) {
            callback(this.cancelledDls[key]);
        }
    }
    forEachCancelledChat(callback) {
        for (var key of Object.keys(this.cancelledMessages)) {
            callback(this.cancelledMessages[key], key);
        }
    }
    removeCancelledMessage(chatId) {
        delete this.cancelledMessages[chatId];
    }
    removeCancelledDls(gid) {
        delete this.cancelledDls[gid];
    }
    checkUnique(toFind, src) {
        for (var item of src) {
            if (item === toFind) {
                return false;
            }
        }
        return true;
    }
}
exports.DlManager = DlManager;
