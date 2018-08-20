if (typeof (Common) == 'undefined') {
    Common = {};
}
Common.getMessagesOfConversation = function (server, clientId, win) {
    var msgId = "";
    if (win.messages.length > 0) {
        msgId = win.messages[0].id;
    }
    server.getMessagesOfConversation(clientId, msgId).done(function (res) {
        var list = [];

        res.forEach(function (e) {
            var msg = new Models.Message(e);
            msg.isMyMessage = win.checkIsMyMessage(msg);
            list.push(msg);
        });

        win.messages = [...list.reverse(), ...win.messages];
    });
}