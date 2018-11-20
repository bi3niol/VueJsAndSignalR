/// <reference path="linqjs.js" />

function Client(chatHub) {
    var self = this;
    self.doneCallBack = null;
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
                canEditGroup: function (group) {
                    return this.loggedUser.id == group.ownerId;
                },
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
                    win.isGroup = isGroup(id);
                    Common.getMessagesOfConversation(server, win.windowId, win, win.isGroup);

                    win.isUnreadMessage = true;
                    self.openedWindows.push(win);
                    self.chatWindows.push(win);
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
                getUserById: getUserById,
                joinChat: function () {
                    vm = this;
                    vm.isBusy = true;
                    var user = this.loggedUser.toServerUser();
                    server.join(user.Login, user.Password).done(function (result) {
                        vm.isBusy = false;
                        if (result) {
                            vm.isLogged = true;
                            var users = [];
                            var groups = [];
                            result.Users.forEach(function (u) {
                                users.push(new Models.OnlineUser(u));
                            });
                            result.Groups.forEach(function (g) {
                                groups.push(new Models.Group(g));
                            });
                            vm.appUsers = users;
                            vm.groups = groups;
                        } else {
                            alert("Przepraszamy, zaloguj się jeszcze raz");
                        }
                    });
                }
            }
        });
    }

    function isGroup(id) {
        return null != getGroupById(id);
    }
    function getCollection(collectionName) {
        var res = self.Vue[collectionName];
        return res;
    }
    var getGroupById = Common.getSearchFunction(getCollection, "groups", "id");
    var getUserById = Common.getSearchFunction(getCollection, "appUsers", "id", true);
    var getChatWindowById = Common.getSearchFunction(getCollection, "chatWindows", "windowId", true);
    var getOpenedWindowById = Common.getSearchFunction(getCollection, "openedWindows", "windowId");

    //prepare client methods
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
            } else {
                Common.Beep();
            }
        }
    }

    chatHub.client.updateGroup = function (group) {
        var g = getGroupById(group.Id);
        if (g) {
            g.update(group);
        } else {
            chatHub.client.newGroup(group);
        }
    };

    chatHub.client.newGroup = function (group) {
        var g = new Models.Group(group);
        self.Vue.groups.push(g);
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

    function logged(identity) {
        self.Vue = getVueInstance(chatHub.server);
        self.Vue.loggedUser = new Models.OnlineUser(identity);
        self.Vue.joinChat();
        $(window).on("unload", function (e) {
            self.Vue.leaveChat();
        });
    }

    //Load templates
    window.GetAppInstance = function (context) {
        var parent = context.$parent;
        if (!parent) {
            return context;
        }
        while (parent.$parent) {
            parent = parent.$parent;
        }
        return parent;
    };

    function onReady() {
        if (self.doneCallBack) {
            self.doneCallBack();
        }
    };

    (function (readyCallBack) {
        const prefix = "/Client/Templates/"
        var templates = ["App.html",
            "Message.html",
            "ChatSite.html",
            "ChatBox.html",
            "Group.html",
            "EmojiPicker.html",
            "UserGroups.html",
            "GroupCreator.html",
            "SimpleFilter.html",
            "OnlineUser.html",
            "SelectMultiple.html",
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
    //----------------------------------------//

    return {
        logged: logged,
        getVueInstance: function () {
            return self.Vue;
        },
        done: function (callBack) {
            self.doneCallBack = callBack;
        }
    }
}