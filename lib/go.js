var _ = require('underscore');
var step = require('step');

function slice(args) {
	return Array.prototype.slice.call(args, 0);
}

function Go(queue, context) {
	this.data = { };
	this._context = context;
	this._queue = queue;
	this._queueIndex = 0;
	this._errorListeners = [];
	this._completeListeners = [];
	this._complete = false;
	this._error = null;
	this._successResult = null;
	this._stepGroup = null;
}

Go.prototype = {
	_next: function (prevResult) {
		var that = this;
		var index = this._queueIndex;
		var queue = this._queue;
		if (index === queue.length) {
			that._endWithSuccess(prevResult);
			return;
		}

		var fn = queue[index];
		step(function () {
			that._stepGroup = this.group();
			fn.apply(that._context, prevResult);
		}, function (err, result) {
			if (err) return that._endWithError(err);

			that._queueIndex++;
			that._next(result);
		});
	},
	_slot: function () {
		return this._stepGroup();
	},
	_endWithSuccess: function (result) {
		var that = this;
		that._complete = true;
		that._successResult = result;

		var callArray = [null].concat(result);
		that._completeListeners.forEach(function (l) {
			l.apply(null, callArray);
		});
	},
	_endWithError: function (err) {
		this._complete = true;
		this._error = err;

		this._errorListeners.forEach(function (l) {
			l(err);
		});
		this._completeListeners.forEach(function (l) {
			l(err);
		});
	},
	group: function () {
		var that = this;
		var groupDone = that._stepGroup();

		var error = null;
		var result = [];
		var timeoutDone = false;
		var finished = 0;

		var handleDone = function () {
			if (timeoutDone && result.length === finished && !error) {
				groupDone(null, result);
			}
		};

		var fn = function () {
			var called = false;
			var index = result.length;
			result.push(null);
			return function (err, res) {
				if (err) return that._endWithError(err);
				if (called) return that._endWithError(new Error('Group callback called more than once!'));

				called = true;
				finished++;
				result[index] = res;

				handleDone();
			};
		};

		setTimeout(function () {
			timeoutDone = true;
			handleDone();
		}, 0);

		return fn;
	},
	onError: function (cb) {
		if (this._complete) {
			var error = this._error;
			if (error) {
				cb(error);
			}
		}
		else {
			this._errorListeners.push(cb);
		}
		return this;
	},
	onComplete: function (cb) {
		if (this._complete) {
			var callArray = [this._error || null];
			if (this._successResult) {
				this._successResult.forEach(function (item) {
					callArray.push(item);
				});
			}
			cb.apply(null, callArray);
		}
		else {
			this._completeListeners.push(cb);
		}
		return this;
	}
};

function bindAllPublicFunctions(go, target) {
	['onError', 'onComplete'].forEach(function (key) {
		target[key] = function () {
			var args = Array.prototype.slice.call(arguments, 0);
			go[key].apply(go, args);
			return target;
		};
	});
	['group'].forEach(function (key) {
		target[key] = go[key].bind(go);
	});
}

module.exports = function () {
	var go;
	var queue = Array.prototype.slice.call(arguments, 0);
	var fn = function () {
		return go._slot();
	};
	go = new Go(queue, fn);
	fn.data = go.data;
	bindAllPublicFunctions(go, fn);

	setTimeout(function () {
		go._next();
	}, 0);

	return fn;
};