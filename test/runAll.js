var path = require('path');
var busterHelpers = require('buster-helpers');

busterHelpers.runOnce(__dirname, {
	fileSuffix: '.tests.js'
});