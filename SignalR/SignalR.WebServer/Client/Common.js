if (typeof (Common) == 'undefined') {
    Common = {};
}

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

Common.Beep = (function () {
    var snd = new Audio('Client/filling-your-inbox.ogg');
    snd.volume = 0.7;
        return function() { snd.play(); }
})();