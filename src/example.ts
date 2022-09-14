import CustomPromise from "./promise";
import fs from "fs";

const readFile = (path: string, encoding = "utf8") => {
    const promise = new CustomPromise((resolve, reject) => {
        fs.readFile(path, encoding, function (error, data) {
            if (error) {
                return reject(error);
            }
            return resolve(data);
        });
    });

    return promise;
};

const main = async () => {
    const data = await readFile("./example.txt");
    console.log(`Successfully asynchronously read file 'example.txt' thanks to 'CustomPromise' class, data from file: ${data}`);
};

main();
