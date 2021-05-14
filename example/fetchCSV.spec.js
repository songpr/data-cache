
const fs = require('fs');
const parse = require('csv-parse');
const stream = require('stream')
const util = require('util');
const pipeline = util.promisify(stream.pipeline);

async function* readCSVByLine() {
    const readFileStream = fs.createReadStream(__dirname + "/keyword.csv");
    const csvParser = parse({});
    await pipeline(readFileStream, csvParser);
    for await (const record of csvParser) {
        yield record;
    }
}
test("read from csv", async (done) => {
    const csvGenerator = readCSVByLine();
    expect(Symbol.asyncIterator in Object(csvGenerator)).toBe(true);
    for await (const line of csvGenerator) {
        console.log(line)
    }
    done();
})

test("fetch CSV to cache", async (done) => {
    const cache = new (require("../index"))(readCSVByLine);
    await cache.init();
    expect(cache.get("bo")).toEqual("bo");
    expect(cache.get("huh")).toEqual("huh huh");
    expect(cache.get("hi")).toEqual('hello world');
    expect(cache.size).toEqual(13);
    done();
})