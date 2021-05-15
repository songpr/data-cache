
const myAsyncIterable = {
    async*[Symbol.asyncIterator]() {
        yield "hello";
        yield "async";
        yield "iteration!";
    }
};

test("async iterable", async (done) => {
    const firstRead = myAsyncIterable[Symbol.asyncIterator]();
    console.log(firstRead)
    const item = await firstRead.next();
    console.log(item.value)
    for await (const x of firstRead) {
        console.log(x);
        // expected output:
        //    "hello"
        //    "async"
        //    "iteration!"
    }
    done()
})

test("iterator next", async (done) => {
    const fn = () => Object.entries({ a: 1, b: 2, c: 3 });
    const gen = fn();
    nextIterator = gen[Symbol.iterator]();
    const item = nextIterator.next();
    console.log(item.value)
    for await (const x of nextIterator) {
        console.log(x);
    }
    done();
})