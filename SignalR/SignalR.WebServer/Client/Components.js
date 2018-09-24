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
        update(event) {
            event.preventDefault();
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
    props: ["groups", "appUsers", "hubServer"],
    data: function () {
        return {
            filteredGroups: [],
        }
    },
    watch: {
        groups(newVal) {
            this.filteredGroups = newVal;
        }
    },
    methods: {
        filterChange(res) {
            this.filteredGroups = res;
        }
    }

});

Vue.component("group", {
    template: "#group",
    props: {
        group: Models.Group
    },

    data: function () {
        var root = GetAppInstance(this);
        var canEdit = root.canEditGroup(this.group);
        var editModel = {};
        if (canEdit) {
            editModel.group = this.group.copy();
            editModel.users = root.appUsers;
            editModel.members = [];
            editModel.group.idsOfMembers.forEach(function (el) {
                var user = root.getUserById(el);
                if (user) {
                    editModel.members.push(user);
                }
            });
        }
        return {
            root: root,
            editModel: editModel,
            canEdit: canEdit,
            idGuid: Common.Guid.newGuid(),
        }
    },

    methods: {
        usersSelected(users) {
            console.info(users);
            this.editModel.members = users;
        },
        updateGroup() {
            this.editModel.group.idsOfMembers = this.editModel.members.select(function (el) { return el.id; });
            var group = this.editModel.group.toServerModel();
            var self = this;
            this.root.hubServer.updateGroup(group).done(function (res) {
                if (!res) {
                    alert("Brak uprawnień!");
                    return;
                }
                $("#" + self.idGuid).modal('hide');
            });
        }
    },

    computed: {
        updateEnable() {
            return this.editModel.group.groupName && this.editModel.members.length > 0;
        },
        hasMembers() {
            return this.editModel.members.length > 0;
        }
    }
});

Vue.component("users-online", {
    template: "#users-online",
    props: ["users"],
    data: function () {
        return {
            filteredUsers: [],
        }
    },
    methods: {
        filterChange(res) {
            this.filteredUsers = res;
        }
    },
    watch: {
        users: function (newVal) {
            this.filteredUsers = newVal;
        }
    },
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
        addEmoji(emoji) {
            this.message += emoji;
        },
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

const emotiPicker = "emoji-picker";
Vue.component(emotiPicker, {
    template: "#" + emotiPicker,
    props: {
        chooseEmojiCallBack: Function,
    },
    data: function () {
        return {
            emoji: [],
            keyPrefix: Common.Guid.newGuid()
        };
    },
    mounted() {
        var self = this;
        $.get("/Client/Emoji/All.json", null, function (res) {
            self.emoji = res;
        });
    }
});

//Filter
const simpleFilter = "simple-filter";
Vue.component(simpleFilter, {
    template: "#" + simpleFilter,
    props: {
        collection: Array,
        filterProperty: String,
        onFilterChange: Function,
    },
    data: function () {
        return {
            filterValue: "",
            callBack: Common.debounceFunction(this.onFilterChange, 500),
            label: "Szukaj..."
        }
    },
    watch: {
        filterValue: function (newVal) {
            var prop = this.filterProperty;
            var fval = this.filterValue.toLowerCase();
            var res = this.collection.where(function (el) {
                return el[prop].toLowerCase().includes(fval);
            });
            this.callBack(res);
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
        options: Array,
        defaultSelection: Array
    },

    watch: {
        options: function (newVal) {
            this.updateOptions();
        }
    },

    data: function () {
        const guid = Common.Guid.newGuid();
        return {
            modalGuid: guid,
            selectableOptions: [],
            selectableOptionsFiltered: []
        }
    },

    mounted() {
        this.updateOptions();
        var self = this;
        if (this.defaultSelection) {
            this.selectableOptions.forEach(function (el) {
                el.selected = self.defaultSelection.includes(el.value);
            });
        }
    },

    methods: {
        updateOptions() {
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
            this.selectableOptionsFiltered = opts;
        },

        filterChange(res) {
            this.selectableOptionsFiltered = res;
        },

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