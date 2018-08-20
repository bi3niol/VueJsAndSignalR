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
                    usersOnline: [],
                    openedWindows: [],
                    chatWindows: [],
                };
            },
            template: "#App-tmp",
            methods: {
                closeWindow: function(id){
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
                    this.openedWindows.push(win);
                    this.chatWindows.push(win);
                    this.$forceUpdate();
                },
                updateUser: function (user) {
                    var _user = this.usersOnline.firstOrDefault((u) => u.id == user.Id);
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
                            vm.usersOnline = users;
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
        return self.Vue.usersOnline.firstOrDefault(function (u) {
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

    chatHub.client.reciveMessage = function (from, to, content) {
        var msg = new Models.Message(from, to, content);
        var usr = getUserById(from);
        if (usr) {
            self.Vue.openWindow(usr);
            win = getOpenedWindowByUserId(usr.id);
            win.addMessage(msg);
        }
    }

    chatHub.client.newUser = function (userdata) {
        var user = new Models.OnlineUser(userdata);
        self.Vue.usersOnline.push(user);
    };
    chatHub.client.userUpdated = function (user) {
        self.Vue.updateUser(user);
    }
    chatHub.client.userLeft = function (id) {
        self.Vue.usersOnline = self.Vue.usersOnline.filter(function (v) {
            return v.id != id;
        });
        self.Vue.chatWindows = self.Vue.chatWindows.filter(function (w) {
            return w.clientId != id;
        });
    };

    //Load templates
    function onReady() {
        $.connection.hub.start().done(function () {
            self.Vue = getVueInstance(chatHub.server);
            self.Vue.joinChat(myUser);
            $(window).on("unload", function (e) {
                self.Vue.leaveChat();
            });
            $(window).on("beforeunload", function (e) {
                var msg = "Napewno chcesz zamknąć stronę?";
                e.returnValue = msg;
                return msg;
            });
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