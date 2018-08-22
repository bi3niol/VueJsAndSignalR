/// <reference path="models.js" />

Vue.component("client-message", {
    template: "#message",
    props: {
        message: Models.Message
    },

    computed: {
        classes: function() {
            var content = this.message.isMyMessage ? "my-message" : "other-message";
            return {
                box: 'message-box',
                content: content
            }
        }
    }
});

Vue.component("chat-site", {
    template: "#chat-site",
    props: ["windows", "server"],
    methods: {
        tabClick(id) {
            var windows = this.windows;
            windows.forEach(function (v, i) {
                v.isActive = v.windowId == id;
                if (v.isActive) {
                    v.scrollDown();
                }
            });
        }
    }
});

Vue.component("chat-box", {
    template: "#chat-box",
    props: {
        window: Models.Window,
        server: Object,
    },
    methods: {
        sentMessage(message) {
            //var msg = new Models.Message(this.window.owner.id, this.window.windowId, message);
            //this.window.addMessage(msg);
            this.server.send(this.window.windowId, message);
        }
    },
    updated() {
        //var self = this;
        //this.$nextTick(function () {
        //    var d = $('#' + self.window.elementId);
        //    d.scrollTop(d.prop("scrollHeight"));
        //});
    },
    mounted() {
        var self = this;
        $('#' + self.window.elementId).on('scroll', function (e) {
            if (e.target.scrollTop == 0) {
                Common.getMessagesOfConversation(self.server, self.window.windowId, self.window);
            }
        });
        this.window.addOnMessegeRecived(function (msg) {
            self.$nextTick(function () {
                var d = $('#' + self.window.elementId);
                d.scrollTop(d.prop("scrollHeight"));
            });
        });
    }
});

Vue.component("profile-manager", {
    template: "#profile-manager",
    props: {
        user: Models.OnlineUser,
        server: Object,
    },
    methods: {
        update() {
            var self = this;
            this.server.update(this.user.toServerUser()).done(function (_user) {
                if (self.user.update(_user)) {
                    $("#edit-profile-modal").modal("toggle");
                }
            });
        }
    }
});

Vue.component("users-online", {
    template: "#users-online",
    props: ["users"],
    computed: {
        count: function () {
            if (this.users) {
                return this.users.filter(u=>u.connected).length;
            }
            return 0;
        }
    }
})

Vue.component("online-user", {
    template: "#online-user",
    props: {
        user: Models.OnlineUser
    },
});

Vue.component("message-input", {
    template: "#message-input",
    data: function () {
        return {
            message: ""
        };
    },
    methods: {
        send(e) {
            e.preventDefault();
            if (this.message == "") {
                return;
            }
            this.$emit("sentmessage", this.message);
            this.message = "";
        }
    }
});