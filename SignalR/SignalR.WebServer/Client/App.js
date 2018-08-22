/// <reference path="linqjs.js" />

function Client(myUser) {
    var self = this;
    self.doneCallBack = null;
    console.log(myUser);
    function getVueInstance(server) {
        return new Vue({
            el: "#app",
            data: function () {
                return {
                    hubServer: server,
                    isBusy: false,
                    isLogged: false,
                    name: "test app",
                    loggedUser: Defaults.OnlineUser,
                    appUsers: [],
                    groups: [],
                    openedWindows: [],
                    chatWindows: [],
                };
            },
            template: "#App-tmp",
            methods: {
                closeWindow: function (id) {
                    this.openedWindows = this.openedWindows.where(function (w) {
                        return w.windowId != id;
                    });
                },
                openWindow: function (name, id) {
                    var win = getOpenedWindowById(id);
                    if (win) {
                        return false;
                    }
                    win = getChatWindowById(id);
                    if (win) {
                        this.openedWindows.push(win);
                        return false;
                    }
                    win = new Models.Window(name, id, this.loggedUser);
                    var self = this;
                    Common.getMessagesOfConversation(server, win.windowId, win, isGroup(id));

                    self.openedWindows.push(win);
                    self.chatWindows.push(win);
                    self.$forceUpdate();
                    return true;
                },
                updateUser: function (user) {
                    var _user = this.appUsers.firstOrDefault((u) => u.id == user.Id);
                    if (_user) {
                        _user.update(user);
                    }
                },
                //servers methods
                leaveChat: function () {
                    server.leave();
                },
                joinChat: function (userData) {
                    vm = this;
                    vm.isBusy = true;
                    server.join(userData).done(function (result) {
                        vm.isBusy = false;
                        if (result) {
                            vm.isLogged = true;
                            var users = [];
                            vm.loggedUser = new Models.OnlineUser(result.Identity);
                            result.Users.forEach(function (u) {
                                users.push(new Models.OnlineUser(u));
                            });
                            vm.appUsers = users;
                        } else {
                            alert("Wprowadz poprawne dane");
                        }
                    });
                }
            }
        });
    }

    function isGroup(id) {
        return null != self.Vue.groups.firstOrDefault(function (u) {
            return u.id == id;
        }, null);
    }

    function getUserById(id) {
        return self.Vue.appUsers.firstOrDefault(function (g) {
            return g.id == id;
        }, null);
    }

    function getChatWindowById(id) {
        return self.Vue.chatWindows.firstOrDefault(function (w) {
            return w.windowId == id;
        }, null);
    }

    function getOpenedWindowById(id) {
        return self.Vue.openedWindows.firstOrDefault(function (w) {
            return w.windowId == id;
        }, null);
    }
    //prepare client methods
    var chatHub = $.connection.chatHub;

    chatHub.client.receiveMessage = function (message) {
        var msg = new Models.Message(message);
        var nameprop = "";
        var _ref = null;
        if (msg.groupId) { // group message
            _ref = getGroupById(msg.groupId);
            nameprop = "groupName";
        } else { // individual message
            _ref = getUserById(message.From);
            if (!_ref) {
                _ref = getUserById(message.To);
            }
            nameprop = "nickName";
        }

        if (_ref) {
            var retivedMessage = self.Vue.openWindow(_ref[nameprop], _ref.id);
            win = getOpenedWindowById(_ref.id);
            if (!retivedMessage) {
                win.addMessage(msg);
            }
        }
    }

    chatHub.client.newUser = function (userdata) {
        var user = new Models.OnlineUser(userdata);
        self.Vue.appUsers.push(user);
    };

    chatHub.client.userConnectedStateChanged = function (userId, state) {
        var user = self.Vue.appUsers.firstOrDefault(function (u) {
            return u.id == userId;
        }, null);
        if (user) {
            user.connected = state;
        }
    }

    chatHub.client.userUpdated = function (user) {
        self.Vue.updateUser(user);
    }

    //Load templates
    function onReady() {
        $.connection.hub.start().done(function () {
            self.Vue = getVueInstance(chatHub.server);
            self.Vue.joinChat(myUser);
            $(window).on("unload", function (e) {
                self.Vue.leaveChat();
            });
            //$(window).on("beforeunload", function (e) {
            //    var msg = "Napewno chcesz zamknąć stronę?";
            //    e.returnValue = msg;
            //    return msg;
            //});
            if (self.doneCallBack) {
                self.doneCallBack(self.Vue);
            }
        });
    };
    (function (readyCallBack) {
        const prefix = "/Client/Templates/"
        var templates = ["App.html",
            "Message.html",
            "ChatSite.html",
            "ChatBox.html",
            "OnlineUser.html",
            "ProfileManager.html",
            "UsersOnline.html",
            "MessageInput.html"];
        var i = 0;
        setTimeout(LoadTemplates, 0);
        function LoadTemplates() {
            $.get(prefix + templates[i], null, function (data) {
                var currentTempaltes = $("#templates").html();
                $("#templates").html(currentTempaltes + data);
                i += 1;
                if (i < templates.length) {
                    LoadTemplates();
                } else {
                    readyCallBack();
                }
            });
        };
    }(onReady));

    return {
        done: function (callBack) {
            self.doneCallBack = callBack;
        }
    }
}