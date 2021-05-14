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

async function* readCSVByLine() {
    const readFileStream = fs.createReadStream(__dirname + "/iterator.csv");
    const csvParser = parse({});
    readFileStream.pipe(csvParser);
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
}, 5000)

async function* readLargeCSVByLine() {
    const readFileStream = fs.createReadStream(__dirname + "/1000000.csv");
    const csvParser = parse({});
    readFileStream.pipe(csvParser)
    let i = 0;
    for await (const record of csvParser) {
        yield record;
        i++
        if (i == 10) break;
    }
    await readFileStream.destroy();
}

test("test with large CSV file, stream first 10 items to cache", async (done) => {
    const cache = new (require("../index"))(readLargeCSVByLine, { max: 10, refreshAge: 1 });
    await cache.init();
    expect(cache.get("cpPG")).toEqual("MnelEaBbPP");
    expect(cache.get("HClmlnlM")).toEqual("I");
    expect(cache.get("IFOBOfEOpLcJKnH")).toEqual('PNaj');
    expect(cache.get("PODlcGLLGlHH")).toEqual(undefined);//line 12
    expect(cache.size).toEqual(10);
    await delay(1100);//provide enough time to read from file
    expect(cache.get("PODlcGLLGlHH")).toEqual(undefined);//line 12
    expect(cache.get("NNIJipmjEmEih")).toEqual(undefined);//line 11
    expect(cache.get("MoLgMdcco")).toEqual('bmbhPFmNMbIcoLlF');
    expect(cache.get("magom")).toEqual('gEMo');
    expect(cache.size).toEqual(10);
    await cache.close();
    done();
}, 200000)

//https://raw.githubusercontent.com/songpr/refreshed-cache/main/test/1000000.csv
var got = require('got');


async function* readCSV10LinesOnWeb() {
    const csvWebStream = got.stream("https://raw.githubusercontent.com/songpr/refreshed-cache/main/test/1000000.csv");
    const csvParser = parse({});
    csvWebStream.pipe(csvParser)
    let i = 0;
    for await (const record of csvParser) {
        yield record;
        i++;
        if (i == 10) break
    }
    await csvWebStream.destroy();

}

test("test read 10 rows CSV web stream to cache", async (done) => {
    const cache = new (require("../index"))(readCSV10LinesOnWeb, { max: 10, refreshAge: 2 });
    await cache.init();
    expect(cache.get("cpPG")).toEqual("MnelEaBbPP");
    expect(cache.get("HClmlnlM")).toEqual("I");
    expect(cache.get("IFOBOfEOpLcJKnH")).toEqual('PNaj');
    expect(cache.get("PODlcGLLGlHH")).toEqual(undefined);//line 12
    expect(cache.size).toEqual(10);
    await delay(3000);//provide enough time to read from web
    expect(cache.get("PODlcGLLGlHH")).toEqual(undefined);//line 12
    expect(cache.get("NNIJipmjEmEih")).toEqual(undefined);//line 11
    expect(cache.get("MoLgMdcco")).toEqual('bmbhPFmNMbIcoLlF');
    expect(cache.get("magom")).toEqual('gEMo');
    expect(cache.size).toEqual(10);
    await cache.close();
    done();
}, 10000)