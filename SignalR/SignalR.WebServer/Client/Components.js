Vue.component("client-message", {
    template: "#message"
});

Vue.component("chat-site", {
    template: "#chat-site",
    props: ["windows"],
    methods: {
        tabClick(id) {
            var windows = this.windows;
            windows.forEach(function (v,i) {
                v.isActive = v.id == id;
            });
            this.$forceUpdate();
        }
    }
});

Vue.component("chat-box", {
    template: "#chat-box",
    props: ["window"],
});