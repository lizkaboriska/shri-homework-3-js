// TODO: 1. check Promise doesn't exist
// TODO: 2. make it globally accessible somehow

// TODO: 3. do validation

// TODO: can i do then multiple times here??
function Thenable(f) {
    let thenable;

    return {
        "then": function(nextf) {
            thenable = Thenable(nextf);
            return thenable.then;
        },
        // TODO: multiple arguments
        "execute": function(args) {
            let result = f(args);
            if (thenable === undefined) {
                return result;
            }
            return thenable.execute(result);
        }
    }
}

function Promise(action) {
    let callbacksOnResolve = [];
    let callbacksOnReject = [];
    // TODO: make it work with multiple then's (that are parallel, not chained)
    let thenable;

    const then = function(onResolve, onReject) {
        callbacksOnResolve.push(onResolve);
        callbacksOnReject.push(onReject);
        return {
            "then": function(f) {
                thenable = Thenable(f);
                return thenable;
            }
        };
    }

    // TODO: multiple arguments
    const resolve = function(text) {
        const onResolve = callbacksOnResolve[0];
        const result = onResolve(text);
        if (thenable === undefined) {
            return;
        }
        thenable.execute(result);
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
        return "and another one";
    }).then(function(text){
        console.log(text);
    });

    console.log("after promise created");
})


/*--------------- RUN TESTS ----------------*/

run_test("chaining_simple");
