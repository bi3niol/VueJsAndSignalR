/// <reference path="../scripts/vue.js" />
if (window.Client == undefined) {
    Client = { __namespace__: true };
}
if (!window.Client.App) {
    Client.App = function (element, name) {
        const NotFount = { template: "<p>Dupsko nie ma takiej strony zią</p>" };
        const Home = {
            template: "<button v-click=\"currentRoute = '/about'\"> klik </button >"
        };
        const About = { template: "<p>About</p>" };
        const routes = {
            '/': Home,
            '/about': About
        }


        function Identity() {
            this.IsAutorized = false;
        };

        return new Vue({
            el: element,
            data: {
                msg: "test xD",
                name: name,
                currentRoute: window.location.pathname
            },
            computed: {
                ViewComponent() {
                    return routes[this.currentRoute.toLowerCase()] || NotFound
                }
            },
            render(h) { return h(this.ViewComponent) }
        });
    };
}