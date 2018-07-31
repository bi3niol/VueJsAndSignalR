if (window.Client==undefined) {
	Client = { __namespace__: true };
}
if (!window.Client.App) {
	Client.App = function (element) {
		return new Vue({
			el: element,
			data: {
				msg: "test xD"
			}
		});
	};
}