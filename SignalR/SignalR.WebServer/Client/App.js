
function Client(user) {
    self = this;
    self.doneCallBack = null;
    console.log(user);
    function getVueInstance(server) {
        return new Vue({
            el: "#app",
            data: {
                isBusy: false,
                isLogged: false,
                name: "test app",
                usersOnline: [],
            },
            template: "#App-tmp",
            methods: {
                //servers methods
                joinChat: function (userData) {
                    vm = this;
                    vm.isBusy = true;
                    server.join(userData).done(function (onlineUsers) {
                        vm.isBusy = false;
                        if (onlineUsers) {
                            vm.isLogged = true;
                            vm.usersOnline = onlineUsers;
                        }
                        else {
                            alert("Wprowadz poprawne dane");
                        }
                    });
                }
            }
        });
    }

    //prepare client methods
    var chatHub = $.connection.chatHub;
    chatHub.client.newUser = function (userdata) {
        self.Vue.usersOnline.push(userData);
    };
    chatHub.client.userLeft = function (id) {
        self.Vue.usersOnline = self.Vue.usersOnline.filter((v) => v.Id != id);
    };

    //Load templates
    function onReady() {
        $.connection.hub.start().done(function () {
            self.Vue = getVueInstance(chatHub.server);

            if (self.doneCallBack) {
                self.doneCallBack(self.Vue);
            }
        });
    };
    (function (readyCallBack) {
        const prefix = "/Client/Templates/"
        var templates = ["App.html", "Message.html", "ChatSite.html","ChatBox.html"];
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