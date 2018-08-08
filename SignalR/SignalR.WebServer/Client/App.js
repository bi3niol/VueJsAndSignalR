
function Client() {
    self = this;
    self.doneCallBack = null;

    function getVueInstance(server) {
        return new Vue({
            el: "#app",
            data: {
                isBusy:false,
                isLogged: false,
                name: "test app",
                usersOnline: [],
            },
            methods: {
                userLeft: function (id) {
                    this.usersOnline = this.usersOnline.filter((v) => v.Id != id);
                },
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

    $.connection.hub.start().done(function () {
        self.Vue = getVueInstance(chatHub.server);

        if (self.doneCallBack) {
            self.doneCallBack(self.Vue);
        }
    })
    return {
        done: function (callBack) {
            self.doneCallBack = callBack;
        }
    }
}