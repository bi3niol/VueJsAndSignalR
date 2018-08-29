/// <reference path="linqjs.js" />
if (typeof (Common) == 'undefined') {
    Common = {};
}

Common.Guid = function () {
    const symbols = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f'];
    const guidFormat = 'xxxxxxxx-xxx6-9xxx-yxxx-xxxxxxxxxxxx';
    return {
        newGuid: function () {
            return guidFormat.replace(/[xy]/g, function (c) {
                var index = Math.floor((Math.random() * 100) % 16);
                return symbols[index];
            })
        }
    }
}();


Common.getMessagesOfConversation = function (server, windowId, win, isgroup) {
    var msgId = "";
    if (win.messages.length > 0) {
        msgId = win.messages[0].id;
    }
    server.getMessagesOfConversation(windowId, msgId, isgroup).done(function (res) {
        var list = [];

        res.forEach(function (e) {
            var msg = new Models.Message(e);
            msg.isMyMessage = win.checkIsMyMessage(msg);
            list.push(msg);
        });

        win.messages = [...list.reverse(), ...win.messages];
    });
}

Common.getSearchFunction = function (storeOfCollections, collectionName, searchProp, storeResults) {
    var propObjectMapper = {};
    var useMapper = storeResults ? true : false;
    return function (key) {
        var res = null;
        if (useMapper) {
            res = propObjectMapper[key];
            if (res) {
                return res;
            }
        }

        res = storeOfCollections(collectionName).firstOrDefault(function (el) {
            return el[searchProp] == key;
        }, null);

        if (useMapper) {
            propObjectMapper[key] = res;
        }
        return res;
    }
}

Common.Beep = (function () {
    var snd = new Audio('Client/filling-your-inbox.ogg');
    snd.volume = 0.7;
    return function () { snd.play(); }
})();