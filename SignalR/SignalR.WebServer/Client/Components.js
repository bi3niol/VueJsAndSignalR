/// <reference path="models.js" />
Vue.component("client-message", {
    template: "#message",
    props: {
        message: Models.Message
    }
});

Vue.component("chat-site", {
    template: "#chat-site",
    props: ["windows", "server"],
    methods: {
        tabClick(id) {
            var windows = this.windows;
            windows.forEach(function (v, i) {
                v.isActive = v.clientId == id;
            });
            this.$forceUpdate();
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
            var msg = new Models.Message(this.window.owner.id, this.window.clientId, message);
            this.window.addMessage(msg);
            this.server.send(this.window.clientId, message);
        }
    },
    mounted() {
        var self = this;
        this.window.addOnMessegeRecived(function (msg) {
            self.$forceUpdate();
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
            return this.users.length;
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
        send() {
            this.$emit("sentmessage", this.message);
            this.message = "";
        }
    }
});