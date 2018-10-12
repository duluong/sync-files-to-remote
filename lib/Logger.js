exports.Logger = function (msg) {
	console.log("[" + new Date().toISOString() +"] " + msg);
}
