/// <reference path="models.js" />

Vue.component("client-message", {
    template: "#message",
    props: {
        message: Models.Message
    },

    computed: {
        classes: function () {
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
            this.server.send(this.window.windowId, message, this.window.isGroup);
        }
    },
    mounted() {
        var self = this;
        $('#' + self.window.elementId).on('scroll', function (e) {
            if (e.target.scrollTop == 0) {
                Common.getMessagesOfConversation(self.server, self.window.windowId, self.window, self.window.isGroup);
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
            var usr = this.user.toServerUser();
            var id = this.user.id;
            usr.Id = undefined; //required becouse it was pass as string not Bson ObjectId
            this.server.update(usr, id).done(function (_user) {
                if (_user) {
                    if (self.user.update(_user)) {
                        $("#edit-profile-modal").modal("toggle");
                    }
                } else {
                    alert("Brak uprawnień!");
                }
            });
        }
    }
});

Vue.component("group-creator", {
    template: "#group-creator",
    props: {
        posibleMembers: {
            type: Array,
            required: true
        },
        server: {
            type: Object,
            required: true
        }
    },

    data: function () {
        return {
            groupName: "",
            members: []
        };
    },

    computed: {
        hasMembers() {
            return this.members.length > 0;
        },
        createEnable() {
            return this.groupName && this.members.length > 0
        }
    },

    methods: {
        usersSelected(users) {
            console.info(users);
            this.members = users;
        },

        createGroup() {
            this.server.createGroup(this.groupName, this.members.select(function (el) {
                return el.id;
            })).done(function (res) {
                if (res) {
                    $("#add-group-modal").modal("hide");
                } else {
                    alert("Coś poszło nie tak!");
                }
            });
        }
    }
})

Vue.component("user-groups", {
    template: "#user-groups",
    props: ["groups"],
});

Vue.component("group", {
    template: "#group",
    props: {
        group: Models.Group
    },
});

Vue.component("users-online", {
    template: "#users-online",
    props: ["users"],
    computed: {
        count: function () {
            if (this.users) {
                return this.users.filter(u => u.connected).length;
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

//Multiselect
const selectMultiple = "select-multiple";

Vue.component(selectMultiple, {
    template: "#" + selectMultiple,
    props: {
        onSelected: Function,
        labelProp: String,
        valueProp: String,
        options: Array
    },

    watch: {
        options: function (newVal) {
            var opts = [];
            var sm = this;
            this.options.forEach(function (el) {
                var val = sm.valueProp ? el[sm.valueProp] : el;
                opts.push({
                    selected: false,
                    value: val,
                    label: el[sm.labelProp]
                });
            });
            console.info("select-multiple watch");
            console.info(opts);
            this.selectableOptions = opts;
        }
    },

    computed: {
        selectableOptionsFiltered() {
            var sm = this;
            var fVal = sm.filterVal.toLowerCase();
            return this.selectableOptions.where(function (el) {
                return el.label.toLowerCase().includes(fVal);
            });
        }
    },

    data: function () {
        const guid = Common.Guid.newGuid();
        return {
            modalGuid: guid,
            selectableOptions: [],
            filterVal: ""
        }
    },

    methods: {
        openSelector() {
            $("#" + this.modalGuid).dropdown();
        },

        cancel() {
            $("#" + this.modalGuid).dropdown('toggle');
            this.selectableOptions.forEach(function (el) {
                el.selected = false;
            });
        },

        confirm() {
            var res = this.selectableOptions
                .where(function (el) { return el.selected; })
                .select(function (el) { return el.value; });
            console.log(res);
            $("#" + this.modalGuid).dropdown('toggle');
            this.onSelected(res);
        }
    }
});