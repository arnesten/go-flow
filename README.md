# go-flow: Simple JavaScript Flow Control Library

Inspired by [step](https://github.com/creationix/step) and [ff](https://github.com/gameclosure/ff)

# Example usage

```javascript
var go = require('go-flow');

var g = go(function () {
    departmentDb.get(departmentId, g());

    var group = g.group();
    userIds.forEach(function (userId) {
        userDb.get(userId, group());
    });
}, function (department, users) {
    doSomething(department, users);
}).onError(function (err) {
    handleError(err);
});
```

# License

(The MIT License)

Copyright (c) 2013 Calle Arnesten

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
