// TODO: 1. check Promise doesn't exist
// TODO: 2. make it globally accessible somehow
// TODO: 3. do validation
// TODO: 4. catch throws!

function isThenable(p) {
    return p !== undefined && typeof p.then === 'function';
}

function Thenable() {
    let nextThenables = [];
    let callbacksOnResolve = [];
    let callbacksOnReject = [];

    function getResolveSyncIth(i) {
        const onResolve = callbacksOnResolve[i];
        const thenable = nextThenables[i];

        return function(arg) {
            if (onResolve !== undefined) {
                let res = onResolve(arg);
                thenable.execute(res);
            }
        }
    }

    function getRejectSyncIth(i) {
        const onReject = callbacksOnReject[i];
        const thenable = nextThenables[i];

        return function(arg) {
            if (onReject !== undefined) {
                let res = onReject(arg);
                thenable.execute(res);
            }
        }
    }

    return {
        "then": function(onResolve, onReject) {
            callbacksOnResolve.push(onResolve);
            callbacksOnReject.push(onReject);

            let t = Thenable();
            nextThenables.push(t);
            return t;
        },

        "execute": function(args) {
            for (let i = 0; i < callbacksOnResolve.length; ++i) {
                const resolveSync = getResolveSyncIth(i);
                const rejectSync = getRejectSyncIth(i);

                if (isThenable(args)) {
                    args.then(resolveSync, rejectSync);
                } else {
                    // TODO: when to run rejectSync here?
                    resolveSync(args);
                }
            }
        }
    }
}

function Promise(action) {
    let thenables = [];
    let callbacksOnReject = [];
    let callbacksOnResolve = [];

    const then = function(onResolve, onReject) {
        callbacksOnResolve.push(onResolve);
        callbacksOnReject.push(onReject);

        let t = Thenable();
        thenables.push(t);
        return t;
    }

    const resolve = function(arg) {
        for (let i = 0; i < thenables.length; i++) {
            const onResolve = callbacksOnResolve[i];
            const thenable = thenables[i];
            if (onResolve !== undefined) {
                // TODO: what if this throws?
                const res = onResolve(arg);
                thenable.execute(res);
            }
        }
    }; 

    const reject = function(arg) {
        for (let i = 0; i < thenables.length; i++) {
            const onReject = callbacksOnReject[i];
            const thenable = thenables[i];
            if (onReject !== undefined) {
                // TODO: what if this throws?
                const res = onReject(arg);
                thenable.execute(res);
            }
        }
    }; 

    try {
        action(resolve, reject);
    } catch (e) {
        reject(e);
    }

    return {"then": then};
}

/*------------- TEST FRAMEWORK --------------*/

tests = {}
function register_test(name, f) {
    tests[name] = f
}
function run_test(name) {
    tests[name]()
}

/*------------------- TESTS ----------------*/

register_test("simple", function() {
    const p = Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve("hello world!");
        }, 2000);
    });

    p.then(function(text){
        console.log('First p.then(): ' + text);
    });

    p.then(function(text){
        console.log('Second p.then(): ' + text);
    });

    console.log("after both then() invoked");
})

register_test("chaining_simple", function test_chaining_simple() {
    const p = Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve("hello world!");
        }, 1000);
    });

    p.then(function(text){
        console.log(text);
        return "then to then invoked";
    }).then(function(text){
        console.log(text);
    });

    console.log("after promise created");
})

register_test("chaining_with_chained_promise", function test_chaining_simple() {
    const p = Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve("hello world!");
        }, 1000);
    }).then(function(text){
        console.log(text);
        return Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve("then to then invoked");
            }, 1000);
        });
    }).then(function(text){
        console.log(text);
        return "synchronous then";
    }).then(function(text){
        console.log(text);
    });

    console.log("after promise created");
})

register_test("parallel_thens_to_first_then", function test_chaining_simple() {
    const p = Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve("hello world!");
        }, 1000);
    }).then(function(text){
        console.log(text);
        return Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve("then to then invoked");
            }, 1000);
        });
    });

    p.then(function(text){
        console.log(text + ' 1');
    });
    p.then(function(text){
        console.log(text + ' 2');
    });

    console.log("after promise created");
})

register_test("simple_catch", function test_chaining_simple() {
    const p = Promise(function(resolve, reject) {
        setTimeout(function() {
            reject("hello world!");
        }, 1000);
    }).then(undefined, function(text){
        console.log("catch invoked with: %s", text);
    });
})

/*--------------- RUN TESTS ----------------*/

run_test("chaining_with_chained_promise");
