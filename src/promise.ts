import { IComputationFunction, PromiseState } from "./promise.types";

export default class CustomPromise {
    public value: any;
    public state: any;
    private thenPromiseQueue: ThenPromise[];
    private finallyPromiseQueue: FinallyPromise[];

    constructor(computation?: IComputationFunction) {
        this.value = null;
        this.state = PromiseState.Pending;
        this.thenPromiseQueue = [];
        this.finallyPromiseQueue = [];

        if (typeof computation === "function") {
            process.nextTick(() => {
                try {
                    computation(
                        this.resolve.bind(this),
                        this.reject.bind(this)
                    );
                } catch (error) {
                    this.reject(error);
                }
            });
        }
    }

    isSettled(): boolean {
        return this.isResolved() || this.isRejected();
    }

    isResolved(): boolean {
        return this.state === PromiseState.Resolved;
    }

    isRejected(): boolean {
        return this.state === PromiseState.Rejected;
    }

    protected resolve(resolutionValue?: any): void {
        if (this.isSettled()) {
            this.settlePromiseQueue(resolutionValue);
            return;
        }

        this.state = PromiseState.Resolved;
        this.value = resolutionValue;
        this.settlePromiseQueue(resolutionValue);
    }

    protected reject(rejectionValue?: any): void {
        if (this.isSettled()) {
            this.settlePromiseQueue(rejectionValue);
            return;
        }

        this.state = PromiseState.Rejected;
        this.value = rejectionValue;
        this.settlePromiseQueue(rejectionValue);
    }

    protected settlePromiseQueue(value?: any) {
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

    then(
        thenCallback?: (value: any) => any,
        catchCallback?: (value: any) => any
    ): ThenPromise {
        const thenPromise = new ThenPromise(thenCallback, catchCallback);
        this.thenPromiseQueue.push(thenPromise);

        if (this.isSettled()) {
            this.settlePromiseQueue(this.value);
            return thenPromise;
        }

        return thenPromise;
    }

    catch(catchCallback: (value: any) => any) {
        return this.then(undefined, catchCallback);
    }

    finally(finallyCallback: () => any) {
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

class ThenPromise extends CustomPromise {
    private thenCallback?: (value: any) => any;
    private catchCallback?: (value: any) => any;

    constructor(
        thenCallback?: (value: any) => any,
        catchCallback?: (value: any) => any
    ) {
        super();
        this.thenCallback = thenCallback;
        this.catchCallback = catchCallback;
    }

    invokeThenCallback(previousPromiseResolutionValue: any) {
        if (typeof this.thenCallback !== "function") {
            this.resolve();
            return;
        }

        try {
            const resolutionValue = this.thenCallback(
                previousPromiseResolutionValue
            );

            resolutionValue instanceof CustomPromise
                ? resolutionValue.then(
                      this.resolve.bind(this),
                      this.reject.bind(this)
                  )
                : this.resolve(resolutionValue);
            return;
        } catch (error) {
            this.invokeCatchCallback(error);
            return;
        }
    }

    invokeCatchCallback(previousPromiseRejectionValue: any) {
        if (typeof this.catchCallback !== "function") {
            this.reject(previousPromiseRejectionValue);
            return;
        }

        const catchCallbackReturnValue = this.catchCallback(
            previousPromiseRejectionValue
        );

        catchCallbackReturnValue instanceof CustomPromise
            ? catchCallbackReturnValue.then(
                  this.resolve.bind(this),
                  this.reject.bind(this)
              )
            : this.resolve(catchCallbackReturnValue);
    }
}

class FinallyPromise extends CustomPromise {
    finallyCallback: () => any;

    constructor(finallyCallback: () => any) {
        super();
        this.finallyCallback = finallyCallback;
    }

    invokeFinallyCallback() {
        this.finallyCallback();
    }
}
