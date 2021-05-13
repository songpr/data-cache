
const fs = require('fs');
const parse = require('csv-parse');
const stream = require('stream')
const util = require('util');
const pipeline = util.promisify(stream.pipeline);

async function* readByLine(path, opt = {}) {
    const readFileStream = fs.createReadStream(path);
    const csvParser = parse(opt);
    await pipeline(readFileStream, csvParser);
    for await (const record of csvParser) {
        yield record;
    }
}
test("fetch from csv", async (done) => {
    const csvGenerator = readByLine(__dirname + "/keyword.csv");
    console.log(util.types.isGeneratorObject(csvGenerator));
    const entries = Object.entries({a:1,b:2})
    console.log(util.types.isGeneratorObject(entries));
    for await (const line of csvGenerator) {
        console.log(line)
    }
    done();
})