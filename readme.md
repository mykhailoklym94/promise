# Javascript promises - custom implementation from scratch 👨‍💻

## General

What is a promise ? Promise is nothing more than a fancy object that is designed to make async code more readable. This object is built-in in JavaScript enginge and available to you as a developer as a global variable.

So how promisess work? To create a promise you create a new instance of a class `Promise` - `new Promise(computation)`. Constructor is expecting one paramether, usually called `computation`. `computation` is a function that performs some asynchronous staff: for example - calling API. Constructor is going to execute `computation` on the next tick by passing two functions as arguments to `computation(resolve, reject)`. `resolve` is expecting `value` and `reject` is expecting `reason`. When the asynchronous action is completed - promise can be resolved or rejected by person who issued that promise.

Below is a simple example of how promises are used in real life:

```javascript
const XMLHttpRequest = require('xhr2');

const API_URL = "https://jsonplaceholder.typicode.com";

const fetchTodo = (id) => {
  return new Promise(function computation(resolve, reject) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", `${API_URL}/todos/${id}`);
    xhr.send();

    xhr.onload = function() {
      const { status, response } = xhr;

      if(status >= 400) {
        reject({ status, response });
      }

      resolve({ status, response: JSON.parse(response) });
    };

    xhr.onerror = function() {
      reject(new Error('Network error'));
    };
  })
}

fetchTodo("1").then((todo) => {
  console.log(todo)
})
```
