if (typeof (Models) == 'undefined') {
    Models = {
        __namespace__: true
    }
}

Models.Window = function (name, id, loggedUser) {
    var self = this;

    this.windowId = id;
    this.name = name;
    this.owner = loggedUser;
    this.elementId = "window-" + id;
    this.isActive = false;
    this.messages = [];

    var onMessageRecived = [];
    function riseMessageRecived(message) {
        onMessageRecived.forEach(function (e) {
            e(message);
        });
    };

    this.addOnMessegeRecived = function (callBack) {
        if (typeof (callBack) != 'function') {
            throw "Argument exception : callBack must be a function";
        }
        if (onMessageRecived.indexOf(callBack) == -1) {
            onMessageRecived.push(callBack);
        }
    }
    this.addMessage = function (message) {
        if ((message.groupId && message.groupId != self.windowId) || (message.fromId != self.windowId && message.toId != self.windowId)) {
            return;
        }
        message.isMyMessage = self.checkIsMyMessage(message);
        if (!message.isMyMessage) {
            Common.Beep();
        }
        self.messages.push(message);
        riseMessageRecived(message);
    }

    this.checkIsMyMessage = function (msg) {
        return (self.owner.id == msg.fromId)
    }

    this.scrollDown = function () {
        setTimeout(function () {
            var d = $('#' + self.elementId);
            d.scrollTop(d.prop("scrollHeight"));
        }, 0);
    };
}


Models.OnlineUser = function (user) {
    var self = this;

    this.id = user.Id;
    this.nickName = user.NickName;
    this.age = user.Age;
    this.connected = user.Connected;
    this.login = user.Login;
    this.password = user.Password;

    this.update = function (_user) {
        if (!_user) {
            alert("Wprowadz poprawne dane!");
            return false;
        };
        self.nickName = _user.NickName;
        self.age = _user.Age;
        return true;
    };

    this.toServerUser = function () {
        return {
            Id: self.id,
            Connected: self.connected,
            NickName: self.nickName,
            Login: self.login,
            Age: self.age,
            Password: self.password,
        };
    };
}

Models.Group = function (group) {
    var self = this;
    self.copy = function () {
        var res = new Models.Group(self.toServerModel());
        res.id = self.id;
        return res;
    }
    self.toServerModel = function () {
        return {
            Id: self.id,
            GroupName: self.groupName,
            OwnerId: self.ownerId,
            IdsOfGroupMembers: self.idsOfMembers,
        }
    }
    self.update = function (group) {
        self.id = group.Id;
        self.groupName = group.GroupName;
        self.ownerId = group.OwnerId;
        self.idsOfMembers = group.IdsOfGroupMembers;
    }

    self.update(group);
}

const Defaults = {
    OnlineUser: new Models.OnlineUser({
        Id: "",
        NickName: "",
        Age: 0,
    }),
}

Models.Message = function (message) {
    this.id = message.Id;
    this.createdOn = new Date(message.MessageSentOn);
    this.isMyMessage = undefined;
    this.groupId = message.GroupId;
    this.fromId = message.From;
    this.toId = message.To;
    this.content = message.Content;
    this.fromName = message.FromName;
}
