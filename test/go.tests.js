'use strict';
let bocha = require('bocha');
let testCase = bocha.testCase;
let assert = bocha.assert;

let go = require('../lib/go.js');

module.exports = testCase('go', {
    'single g() usage that is fired after timeout': function (done) {
        let g = go(function () {
            let cb = g();
            setTimeout(function () {
                cb(null, 'A');
            }, 10);
        }, function (result) {
            assert.equals(arguments.length, 1);
            assert.equals(result, 'A');
            done();
        });
    },
    'single g() usage that is fired directly': function (done) {
        let g = go(function () {
            g()(null, 'A');
        }, function (result) {
            assert.equals(arguments.length, 1);
            assert.equals(result, 'A');
            done();
        });
    },
    'multiple g() should collect result in order': function (done) {
        let g = go(function () {
            let one = g();
            let two = g();
            let three = g();

            two(null, 2); // Notice order
            one(null, 1);
            three(null, 3);
        }, function () {
            assert.equals(arguments.length, 3);
            assert.equals(arguments[0], 1);
            assert.equals(arguments[1], 2);
            assert.equals(arguments[2], 3);
            done();
        });
    },
    'mixing sync and async g() usages': function (done) {
        let g = go(function () {
            let one = g();
            let two = g();
            let three = g();
            let four = g();

            one(null, 1);
            three(null, 3);
            setTimeout(function () {
                two(null, 2);
            }, 10);
            setTimeout(function () {
                four(null, 4);
            }, 20);
        }, function (result) {
            assert.equals(arguments.length, 4);
            assert.equals(arguments[0], 1);
            assert.equals(arguments[1], 2);
            assert.equals(arguments[2], 3);
            assert.equals(arguments[3], 4);
            done();
        });
    },
    'fire onError when throws error in step': function (done) {
        let g = go(function () {
            g()(null, 1);
            throw new Error('A');
        }, function () {
            assert(false); // Should not be called
        }).onError(function (err) {
            assert.equals(err.message, 'A');
            assert.equals(arguments.length, 1);
            done();
        });
    },
    'fire onComplete when throws error in step': function (done) {
        let g = go(function () {
            g()(null, 1);
            throw new Error('A');
        }, function () {
            assert(false); // Should not be called
        }).onComplete(function (err) {
            assert.equals(err.message, 'A');
            assert.equals(arguments.length, 1);
            done();
        });
    },
    'fire onError when callback sends error': function (done) {
        let g = go(function () {
            g()(new Error('A'));
        }, function () {
            assert(false); // Should not be called
        }).onError(function (err) {
            assert.equals(err.message, 'A');
            assert.equals(arguments.length, 1);
            done();
        });
    },
    'can use this() instead of g()': function (done) {
        go(function () {
            this()(null, 1);
            this()(null, 2);
        }, function () {
            assert.equals(arguments.length, 2);
            assert.equals(arguments[0], 1);
            assert.equals(arguments[1], 2);
            done();
        });
    },
    'using g.group() without calls should produce empty array': function (done) {
        let g = go(function () {
            g.group();
        }, function () {
            assert.equals(arguments.length, 1);
            assert.equals(arguments[0], []);
            done();
        });
    },
    'using g.group() multiple times should produce array in correct order': function (done) {
        let g = go(function () {
            let group = g.group();
            let one = group();
            let two = group();
            let three = group();

            two(null, 2); // notice order
            one(null, 1);
            three(null, 3);
        }, function () {
            assert.equals(arguments.length, 1);
            assert.equals(arguments[0], [1, 2, 3]);
            done();
        });
    },
    'can use nested groups': function (done) {
        function nested(cb) {
            let g = go(function () {
                let group = g.group();
                group()(null, 2);
            }, function (result) {
                cb(null, result);
            });
        }

        let g = go(function () {
            let group = g.group();
            group()(null, 1);
            nested(group());
        }, function (result) {
            assert.equals(result, [1, [2]]);
            done();
        });
    },
    'can share data between steps': function (done) {
        let g = go(function () {
            g.data.aKey = 'aValue';
        }, function () {
            assert.equals(g.data, { aKey: 'aValue' });

            g.data.otherKey = 'otherValue';
        }, function () {
            assert.equals(g.data, { aKey: 'aValue', otherKey: 'otherValue' });

            done();
        });
    },
    'shared data between steps are unique per instance': function (done) {
        function nested(cb) {
            let g = go(function () {
                assert.equals(g.data, {});
                g.data.aKey = 'nested'
            }, cb);
        }

        let g = go(function () {
            g.data.aKey = 'aValue';
            nested(g());
        }, function () {
            assert.equals(g.data, { aKey: 'aValue' });
            done();
        });
    }
});