const { expect } = require("@jest/globals");
const delay = require("delay");

test("test iterator", async (done) => {
    const fn = () => Object.entries({ a: 1, b: 2, c: 3 });
    const cache = new (require("../index"))(fn);
    await cache.init();
    expect(cache.get("a")).toEqual(1);
    expect(cache.get("b")).toEqual(2);
    expect(cache.get("c")).toEqual(3);
    expect(cache.get("d")).toEqual(undefined);
    expect(cache.get("ee")).toEqual(undefined);
    expect(cache.size).toEqual(3);
    done();
})

test("test with generator", async (done) => {
    let round = 1;
    const fn = function* () {
        yield ["a", 1 * round];
        yield ["b", 2 * round];
        yield ["c", 3 * round];
        round++;
    };
    const cache = new (require("../index"))(fn, { maxAge: 1 });
    await cache.init()
    //loop 3 round
    for (let i = 1; i <= 3; i++) {
        console.log("i", i, "round", round)
        expect(cache.get("a")).toEqual(1 * i);
        expect(cache.get("b")).toEqual(2 * i);
        expect(cache.get("c")).toEqual(3 * i);
        expect(cache.get("d")).toEqual(undefined);
        expect(cache.get("ee")).toEqual(undefined);
        expect(cache.size).toEqual(3);
        await delay(1000);
    }
    console.log("test fetch close")
    await cache.close();
    done();
})

const fs = require('fs');
const parse = require('csv-parse');
const stream = require('stream')
const util = require('util');
const pipeline = util.promisify(stream.pipeline);

async function* readCSVByLine() {
    const readFileStream = fs.createReadStream(__dirname + "/iterator.csv");
    const csvParser = parse({});
    await pipeline(readFileStream, csvParser);
    for await (const record of csvParser) {
        yield record;
    }
}

test("test with async generator, CSV stream to cache", async (done) => {
    const cache = new (require("../index"))(readCSVByLine, { refreshAge: 1 });
    await cache.init();
    expect(cache.get("bo")).toEqual("bo");
    expect(cache.get("huh")).toEqual("huh huh");
    expect(cache.get("hi")).toEqual('hello world');
    expect(cache.size).toEqual(13);
    await delay(1100);//provide enough time to read from file
    expect(cache.get("bo")).toEqual("bo");
    expect(cache.get("huh")).toEqual("huh huh");
    expect(cache.get("hi")).toEqual('hello world');
    expect(cache.size).toEqual(13);
    await cache.close();
    done();
}, 10000)