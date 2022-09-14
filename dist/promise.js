"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promise_types_1 = require("./promise.types");
class Promise {
    constructor(computation) {
        this.value = null;
        this.state = promise_types_1.PromiseState.Pending;
        this.thenPromiseQueue = [];
        this.finallyPromiseQueue = [];
        if (typeof computation === "function") {
            process.nextTick(() => {
                try {
                    computation(this.resolve.bind(this), this.reject.bind(this));
                }
                catch (error) {
                    this.reject(error);
                }
            });
        }
    }
    isSettled() {
        return this.isResolved() || this.isRejected();
    }
    isResolved() {
        return this.state === promise_types_1.PromiseState.Resolved;
    }
    isRejected() {
        return this.state === promise_types_1.PromiseState.Rejected;
    }
    resolve(resolutionValue) {
        if (this.isSettled()) {
            this.settlePromiseQueue(resolutionValue);
            return;
        }
        this.state = promise_types_1.PromiseState.Resolved;
        this.value = resolutionValue;
        this.settlePromiseQueue(resolutionValue);
    }
    reject(rejectionValue) {
        if (this.isSettled()) {
            this.settlePromiseQueue(rejectionValue);
            return;
        }
        this.state = promise_types_1.PromiseState.Rejected;
        this.value = rejectionValue;
        this.settlePromiseQueue(rejectionValue);
    }
    settlePromiseQueue(value) {
        if (this.isResolved()) {
            for (const thenPromise of this.thenPromiseQueue) {
                thenPromise.invokeThenCallback(value);
            }
            for (const finallyPromise of this.finallyPromiseQueue) {
                finallyPromise.invokeFinallyCallback();
                finallyPromise.resolve(value);
            }
        }
        if (this.isRejected()) {
            for (const thenPromise of this.thenPromiseQueue) {
                thenPromise.invokeCatchCallback(value);
            }
            for (const finallyPromise of this.finallyPromiseQueue) {
                finallyPromise.invokeFinallyCallback();
                finallyPromise.reject(value);
            }
        }
        this.thenPromiseQueue = [];
        this.finallyPromiseQueue = [];
    }
    then(thenCallback, catchCallback) {
        const thenPromise = new ThenPromise(thenCallback, catchCallback);
        this.thenPromiseQueue.push(thenPromise);
        if (this.isSettled()) {
            this.settlePromiseQueue(this.value);
            return thenPromise;
        }
        return thenPromise;
    }
    catch(catchCallback) {
        return this.then(undefined, catchCallback);
    }
    finally(finallyCallback) {
        if (this.isResolved()) {
            this.resolve(this.value);
            finallyCallback();
            return;
        }
        if (this.isRejected()) {
            this.reject(this.value);
            finallyCallback();
            return;
        }
        const finallyPromise = new FinallyPromise(finallyCallback);
        this.finallyPromiseQueue.push(finallyPromise);
        return finallyPromise;
    }
}
exports.default = Promise;
class ThenPromise extends Promise {
    constructor(thenCallback, catchCallback) {
        super();
        this.thenCallback = thenCallback;
        this.catchCallback = catchCallback;
    }
    invokeThenCallback(previousPromiseResolutionValue) {
        if (typeof this.thenCallback !== "function") {
            this.resolve();
            return;
        }
        try {
            const resolutionValue = this.thenCallback(previousPromiseResolutionValue);
            resolutionValue instanceof Promise
                ? resolutionValue.then(this.resolve.bind(this), this.reject.bind(this))
                : this.resolve(resolutionValue);
            return;
        }
        catch (error) {
            this.invokeCatchCallback(error);
            return;
        }
    }
    invokeCatchCallback(previousPromiseRejectionValue) {
        if (typeof this.catchCallback !== "function") {
            this.reject(previousPromiseRejectionValue);
            return;
        }
        const catchCallbackReturnValue = this.catchCallback(previousPromiseRejectionValue);
        catchCallbackReturnValue instanceof Promise
            ? catchCallbackReturnValue.then(this.resolve.bind(this), this.reject.bind(this))
            : this.resolve(catchCallbackReturnValue);
    }
}
class FinallyPromise extends Promise {
    constructor(finallyCallback) {
        super();
        this.finallyCallback = finallyCallback;
    }
    invokeFinallyCallback() {
        this.finallyCallback();
    }
}
//# sourceMappingURL=promise.js.map