const generate = require('csv-generate')
const n = 1000000;
const fs = require("fs");
const writeStream = fs.createWriteStream(`./${n}.csv`);
generate({ length: n, columns: 2 }).pipe(writeStream)