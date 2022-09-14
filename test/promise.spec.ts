import CustomPromise from "../src/promise";

describe("promise constructor", () => {
    it("should call 'computation' function on next tick", (done) => {
        const computation = jest.fn(() => {
            expect(computation).toHaveBeenCalled();
            done();
        });

        new CustomPromise(computation);

        expect(computation).not.toHaveBeenCalled();
    });

    it("when 'computation' function is invoked - it should receive two function arguments - 'resolve' and 'reject' functions", (done) => {
        const computation = jest.fn((resolve, reject, ...otherArguments) => {
            expect(typeof resolve).toBe("function");
            expect(typeof reject).toBe("function");
            expect(otherArguments).toHaveLength(0);
            done();
        });

        new CustomPromise(computation);
    });

    it("when 'computation' function is invoked and error is thrown inside 'computation' - promise should be rejected", (done) => {
        const computation = jest.fn(() => {
            throw new Error("Something went wrong");
        });

        const promise = new CustomPromise(computation);

        promise.catch((rejectionValue) => {
            expect(promise.state).toBe("Rejected");
            expect(rejectionValue).toBeInstanceOf(Error);
            done();
        });
    });
});

describe("promise object structure", () => {
    it("promise object should have 'then' and 'catch' methods", () => {
        const promise = new CustomPromise();
        expect(typeof promise.then).toBe("function");
        expect(typeof promise.catch).toBe("function");
    });
});

describe("'resolve' and 'reject' methods on promise object", () => {
    it("should not be able to 'resolve' promise twice with different values", (done) => {
        const promiseA = new CustomPromise((resolve) => {
            setTimeout(() => {
                resolve("PROMISE_A_VALUE");
                resolve("DIFFERENT_RESOLVE_VALUE");
            });
        });

        const promiseB = promiseA.then((value) => {
            expect(value).toBe("PROMISE_A_VALUE");
            done();
        });
    });

    it("should not be able to 'reject' promise twice with different values", (done) => {
        const promiseA = new CustomPromise((_, reject) => {
            setTimeout(() => {
                reject(new Error("PROMISE_A_REJECTION"));
                reject(new Error("DIFFERENT_REJECT_VALUE"));
            });
        });

        const thenCallback = jest.fn(() => {
            expect(thenCallback).not.toHaveBeenCalled();
        });

        const catchCallback = jest.fn((value) => {
            expect(value).toBeInstanceOf(Error);
            expect(value.message).toBe("PROMISE_A_REJECTION");
            expect(catchCallback).toHaveBeenCalled();
            done();
        });

        const promiseB = promiseA.then(thenCallback, catchCallback);
    });
});

describe("'then' method on the promise object", () => {
    it("'then' method should return a new promise", () => {
        const promiseA = new CustomPromise();
        const promiseB = promiseA.then();

        expect(promiseB).toBeInstanceOf(CustomPromise);
        expect(promiseB).not.toBe(promiseA);
    });

    it("when the previous promise is resolved - 'then callback' of the next promise should be called with the resolution value of previous promise", (done) => {
        const promiseA = new CustomPromise((resolve) => {
            setTimeout(() => {
                resolve("PROMISE_A_VALUE");
            });
        });

        const promiseB = promiseA.then((value) => {
            expect(value).toBe("PROMISE_A_VALUE");
            done();
        });
    });

    it("when 'then' method is invoked and the promise is already resolved - it should call 'then callback' immediately", (done) => {
        const promiseA = new CustomPromise((resolve) => {
            setTimeout(() => {
                resolve("PROMISE_A_VALUE");

                promiseA.then((value) => {
                    expect(value).toBe("PROMISE_A_VALUE");
                    done();
                });
            });
        });
    });

    it("should be able to add multiple 'then callbacks' to a single promise", (done) => {
        const promiseA = new CustomPromise((resolve) => {
            setTimeout(() => {
                resolve("PROMISE_A_VALUE");
            });
        });

        const promiseB = promiseA.then((value) => {
            expect(value).toBe("PROMISE_A_VALUE");
            return "PROMISE_B_VALUE";
        });

        const promiseC = promiseA.then((value) => {
            expect(value).toBe("PROMISE_A_VALUE");
            done();
        });
    });

    it("should be able to chain multiple 'then callbacks' that will create a series of promises dependent on each other", (done) => {
        const promiseA = new CustomPromise((resolve) => {
            setTimeout(() => {
                resolve("PROMISE_A_VALUE");
            });
        });

        promiseA
            // promiseB
            .then((promiseAValue) => {
                expect(promiseAValue).toBe("PROMISE_A_VALUE");
                return "PROMISE_B_VALUE";
            })
            // promiseC
            .then((promiseBValue) => {
                expect(promiseBValue).toBe("PROMISE_B_VALUE");
                done();
            });
    });

    it("should be able to chain multiple 'then callbacks', when some of them return promises, that will create a series of promises dependent on each other", (done) => {
        const promiseA = new CustomPromise((resolve) => {
            setTimeout(() => {
                resolve("PROMISE_A_VALUE");
            });
        });

        promiseA
            // promiseB
            .then((promiseAValue) => {
                expect(promiseAValue).toBe("PROMISE_A_VALUE");
                // promiseD
                return new CustomPromise((resolve) => {
                    setTimeout(() => {
                        resolve("PROMISE_D_VALUE");
                    });
                });
            })
            // promiseC
            .then((promiseDValue) => {
                expect(promiseDValue).toBe("PROMISE_D_VALUE");
                done();
            });
    });
});

describe("'catch' method on the promise object", () => {
    it("if promise is rejected - 'catch' method on a promise should be invoked", (done) => {
        const promiseA = new CustomPromise((_, reject) => {
            setTimeout(() => {
                reject("PROMISE_A_REJECTION_VALUE");
            });
        });

        const catchCallback = jest.fn((rejectionValue) => {
            expect(rejectionValue).toBe("PROMISE_A_REJECTION_VALUE");
            expect(catchCallback).toHaveBeenCalled();
            done();
        });

        promiseA.catch(catchCallback);
    });

    it("when 'catch callback' was added after the promise is already rejected - it should invoke 'catch callback' immediately", (done) => {
        const promiseA = new CustomPromise((resolve, reject) => {
            setTimeout(() => {
                reject("PROMISE_A_REJECTION_VALUE");

                promiseA.catch((value) => {
                    expect(value).toBe("PROMISE_A_REJECTION_VALUE");
                    done();
                });
            });
        });
    });

    it("when 'catch' method is not defined, last promise rejection reason should be the same as previous", (done) => {
        // eslint-disable-next-line
        let promiseB: any;

        const promiseA = new CustomPromise((resolve, reject) => {
            setTimeout(() => {
                reject("PROMISE_A_REJECTION_VALUE");

                // skip one more tick
                setTimeout(() => {
                    expect(promiseB.state).toBe("Rejected");
                    expect(promiseB.value).toBe("PROMISE_A_REJECTION_VALUE");
                    done();
                });
            });
        });

        promiseB = promiseA.then((resolveValue) => {
            // will not be executed, because promiseA is rejected
        });
    });

    it("when exception is caught via 'catch callback' in promise chain, 'then callbacks' added after that 'catch method' should be invoked", (done) => {
        const promiseA = new CustomPromise((resolve) => {
            setTimeout(() => {
                resolve("PROMISE_A_RESOLUTION_VALUE");
            });
        });

        promiseA
            // promise B
            .then((resolveValue) => {
                expect(resolveValue).toBe("PROMISE_A_RESOLUTION_VALUE");
                throw new Error("PROMISE_B_REJECTION_VALUE");
            })
            // promise C
            .catch((rejectValue) => {
                expect(rejectValue).toBeInstanceOf(Error);
                expect(rejectValue.message).toBe("PROMISE_B_REJECTION_VALUE");
                return "PROMISE_C_RESOLUTION_VALUE";
            })
            // promise D
            .then((resolveValue) => {
                expect(resolveValue).toBe("PROMISE_C_RESOLUTION_VALUE");
                done();
            });
    });

    it("when exception is caught inside a promise chain and 'catch callback' returns a promise, 'then callbacks' added after that 'catch method' should be executed invoked with that promises' resolution value", (done) => {
        const promiseA = new CustomPromise((resolve) => {
            setTimeout(() => {
                resolve("PROMISE_A_RESOLUTION_VALUE");
            });
        });

        promiseA
            // promise B
            .then((promiseAValue) => {
                expect(promiseAValue).toBe("PROMISE_A_RESOLUTION_VALUE");
                throw new Error("PROMISE_B_REJECTION_VALUE");
            })
            // promise C
            .catch((promiseBValue) => {
                expect(promiseBValue).toBeInstanceOf(Error);
                expect(promiseBValue.message).toBe("PROMISE_B_REJECTION_VALUE");
                // promise E
                return new CustomPromise((resolve) => {
                    setTimeout(() => {
                        resolve("PROMISE_E_RESOLUTION_VALUE");
                    });
                });
            })
            // promise D
            .then((resolveValue) => {
                expect(resolveValue).toBe("PROMISE_E_RESOLUTION_VALUE");
                done();
            });
    });

    it("if promise is rejected - 'catch callback' passed as second argument to 'then' method should be triggered and 'then' callback should not be called", (done) => {
        const promiseA = new CustomPromise((_, reject) => {
            setTimeout(() => {
                reject(new Error("PROMISE_A_REJECTION_VALUE"));
            });
        });

        const thenCallback = jest.fn(() => {
            expect(thenCallback).not.toHaveBeenCalled();
        });

        const catchCallback = jest.fn((reason) => {
            expect(reason).toBeInstanceOf(Error);
            expect(reason.message).toBe("PROMISE_A_REJECTION_VALUE");
            expect(catchCallback).toHaveBeenCalled();
            done();
        });

        const promiseB = promiseA.then(thenCallback, catchCallback);
    });

    it("if error is thrown inside of 'then callback' - 'catch callback' passed to 'then' method should be invoked", (done) => {
        const promiseA = new CustomPromise((resolve) => {
            setTimeout(() => {
                resolve("PROMISE_A_RESOLUTION_VALUE");
            });
        });

        const thenCallback = jest.fn((value) => {
            expect(value).toBe("PROMISE_A_RESOLUTION_VALUE");
            throw new Error("THEN_CALLBACK_ERROR");
        });

        const catchCallback = jest.fn((reason) => {
            expect(reason).toBeInstanceOf(Error);
            expect(reason.message).toBe("THEN_CALLBACK_ERROR");
            expect(catchCallback).toHaveBeenCalled();
            done();
        });

        const promiseB = promiseA.then(thenCallback, catchCallback);
    });
});

describe("'finally method on the promise object'", () => {
    it("if promise is 'resolved' - 'finally callback' should be called", (done) => {
        const finallyCallback = jest.fn(() => {
            expect(finallyCallback).toHaveBeenCalled();
            done();
        });

        const promiseA = new CustomPromise((resolve) => {
            setTimeout(() => {
                resolve("PROMISE_A_RESOLUTION_VALUE");
                promiseA.finally(finallyCallback);
            });
        });
    });

    it("if promise is 'rejected' - 'finally callback' should be called", (done) => {
        const finallyCallback = jest.fn(() => {
            expect(finallyCallback).toHaveBeenCalled();
            done();
        });

        const promiseA = new CustomPromise((_, reject) => {
            setTimeout(() => {
                reject("PROMISE_A_REJECTION_VALUE");
                promiseA.finally(finallyCallback);
            });
        });
    });

    it("if promises are chained with 'then callbacks' - it should invoke 'finally callback'", (done) => {
        const finallyCallback = jest.fn(() => {
            expect(finallyCallback).toHaveBeenCalled();
            done();
        });

        const promiseA = new CustomPromise((resolve) => {
            setTimeout(() => {
                resolve("PROMISE_A_RESOLUTION_VALUE");
            });
        });

        promiseA
            .then((promiseAValue) => {
                expect(promiseAValue).toBe("PROMISE_A_RESOLUTION_VALUE");
            })
            .finally(finallyCallback);
    });

    it("if promises are chained with 'then callbacks' and error is thrown inside of one of the callbacks - it still should invoke 'finally callback'", (done) => {
        const finallyCallback = jest.fn(() => {
            expect(finallyCallback).toHaveBeenCalled();
            done();
        });

        const promiseA = new CustomPromise((resolve) => {
            setTimeout(() => {
                resolve("PROMISE_A_RESOLUTION_VALUE");
            });
        });

        promiseA
            .then(() => {
                throw new Error("Something went wrong");
            })
            .finally(finallyCallback);
    });

    it("if promises are chained with 'then callbacks' and error is thrown inside of one of the callbacks and caught later in the chain - it still should invoke 'finally callback'", (done) => {
        const finallyCallback = jest.fn(() => {
            expect(finallyCallback).toHaveBeenCalled();
            done();
        });

        const promiseA = new CustomPromise((resolve) => {
            setTimeout(() => {
                resolve("PROMISE_A_RESOLUTION_VALUE");
            });
        });

        promiseA
            // promiseB
            .then(() => {
                throw new Error("PROMISE_B_REJECTION_VALUE");
            })
            // promiseC
            .catch((promiseBValue) => {
                expect(promiseBValue).toBeInstanceOf(Error);
                expect(promiseBValue.message).toBe("PROMISE_B_REJECTION_VALUE");
            })
            // promiseD
            .finally(finallyCallback);
    });
});
