export interface IComputationFunction {
    (resolve: (value: any) => void, reject: (reason: any) => void): void;
}

export enum PromiseState {
    Pending = "Pending",
    Resolved = "Resolved",
    Rejected = "Rejected"
}
