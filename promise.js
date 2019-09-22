// TODO: 1. check Promise doesn't exist
// TODO: 2. make it globally accessible somehow
// TODO: 3. do validation

function isThenable(p) {
    return p !== undefined && typeof p.then === 'function';
}

// TODO: rename
// TODO: allow multiple then's
function Thenable(f) {
    let thenable;

    function executeNonThenable(res) {
        let nextres = f(res);

        if (thenable === undefined) {
            return nextres;
        }
        return thenable.execute(nextres);
    }

    return {
        "then": function(nextf) {
            thenable = Thenable(nextf);
            return thenable;
        },

        // TODO: multiple arguments
        "execute": function(args) {
            if (isThenable(args)) {
                args.then(executeNonThenable);
            } else {
                executeNonThenable(args);
            }
        }
    }
}

function Promise(action) {
    let onResolveThenables = [];

    // TODO: make it work with multiple then's (that are parallel, not chained)
    let callbacksOnReject = [];

    const then = function(onResolve, onReject) {
        let thenable = Thenable(onResolve);
        onResolveThenables.push(thenable);

        callbacksOnReject.push(onReject);

        return thenable;
    }

    // TODO: multiple arguments
    const resolve = function(text) {
        for (onResolveThenable of onResolveThenables) {
            onResolveThenable.execute(text);
        }
    }; 

    // TODO: multiple arguments
    const reject = function() {
        for (const onReject of callbacksOnReject) {
            onReject(text);
        }
    }; 

    action(resolve, reject);

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

// TODO: failing now. fix it later
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

/*--------------- RUN TESTS ----------------*/

run_test("chaining_simple");
