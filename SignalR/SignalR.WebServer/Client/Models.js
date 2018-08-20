if (typeof (Models) == 'undefined') {
    Models = {
        __namespace__: true
    }
}

Models.Window = function (user, loggedUser) {
    console.log(typeof (user));
    var self = this;
    this.clientId = user.id;
    this.onlineUser = user;
    this.owner = loggedUser;
    this.elementId = "window-" + user.id;
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
        if (message.fromId != self.clientId && message.toId != self.clientId) {
            return;
        }
        message.isMyMessage = (self.clientId!=message.fromId);
        self.messages.push(message);
        riseMessageRecived(message);
    }
}


Models.OnlineUser = function (user) {
    var self = this;
    this.id = user.Id;
    this.nickName = user.NickName;
    this.age = user.Age;

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
            NickName: self.nickName,
            Age: self.age
        };
    };
}
const Defaults = {
    OnlineUser: new Models.OnlineUser({
        Id: "",
        NickName: "",
        Age: 0,
    }),
}

Models.Message = function (fromId, toId, content) {
    this.isMyMessage = undefined;
    this.fromId = fromId;
    this.toId = toId;
    this.content = content;
}