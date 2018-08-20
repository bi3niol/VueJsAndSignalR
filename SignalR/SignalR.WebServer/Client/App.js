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
                    openedWindows: [],
                    chatWindows: [],
                };
            },
            template: "#App-tmp",
            methods: {
                closeWindow: function (id) {
                    this.openedWindows = this.openedWindows.where(function (w) {
                        return w.clientId != id;
                    });
                },
                openWindow: function (user) {
                    console.log(user);
                    var win = getOpenedWindowByUserId(user.id);
                    if (win) {
                        return;
                    }
                    win = getChatWindowByUserId(user.id);
                    if (win) {
                        this.openedWindows.push(win);
                        return;
                    }
                    win = new Models.Window(user, this.loggedUser);
                    var self = this;
                    Common.getMessagesOfConversation(server,win.clientId,win);

                    self.openedWindows.push(win);
                    self.chatWindows.push(win);
                    self.$forceUpdate();
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
                    server.join(userData).done(function (onlineUsers) {
                        vm.isBusy = false;
                        if (onlineUsers) {
                            vm.isLogged = true;
                            var users = [];
                            vm.loggedUser.update(userData);
                            onlineUsers.forEach(function (u) {
                                users.push(new Models.OnlineUser(u));
                            });
                            vm.appUsers = users;
                        }
                        else {
                            alert("Wprowadz poprawne dane");
                        }
                    });
                }
            }
        });
    }

    function getUserById(id) {
        return self.Vue.appUsers.firstOrDefault(function (u) {
            return u.id == id;
        }, null);
    }

    function getChatWindowByUserId(id) {
        return self.Vue.chatWindows.firstOrDefault(function (w) {
            return w.clientId == id;
        }, null);
    }

    function getOpenedWindowByUserId(id) {
        return self.Vue.openedWindows.firstOrDefault(function (w) {
            return w.clientId == id;
        }, null);
    }
    //prepare client methods
    var chatHub = $.connection.chatHub;

    chatHub.client.receiveMessage = function (message) {
        var msg = new Models.Message(message);
        var usr = getUserById(message.From);
        if (!usr) {
            usr = getUserById(message.To);
        }
        if (usr) {
            self.Vue.openWindow(usr);
            win = getOpenedWindowByUserId(usr.id);
            win.addMessage(msg);
        }
    }

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