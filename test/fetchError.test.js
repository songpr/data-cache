const { expect } = require("@jest/globals");
const delay = require("delay");

test("fetch refresh cache every 1 sec", async (done) => {
    let round = 1;
    const fn = () => {
        if (round % 2 == 0) {
            throw Error(`fetch error at round ${round++}`);
        }
        const entires = Object.entries({ a: 1 * round, b: 2 * round, c: 3 * round })
        round++;
        return entires;
    };
    const cache = new (require("../index"))(fn, { maxAge: 2, refreshAge: 1 });
    await cache.init()
    //loop 3 round
    for (let i = 1; i <= 3; i++) {
        console.log("i", i, "round", round)
        if ((round - 1) % 2 == 0) {
            //error then key is the non expired cache
            expect(cache.get("a")).toEqual(1 * (i - 1));
            expect(cache.get("b")).toEqual(2 * (i - 1));
            expect(cache.get("c")).toEqual(3 * (i - 1));
            expect(cache.get("d")).toEqual(undefined);
            expect(cache.get("ee")).toEqual(undefined);
        } else {
            expect(cache.get("a")).toEqual(1 * i);
            expect(cache.get("b")).toEqual(2 * i);
            expect(cache.get("c")).toEqual(3 * i);
            expect(cache.get("d")).toEqual(undefined);
            expect(cache.get("ee")).toEqual(undefined);
            expect(cache.size).toEqual(3);
        }
        await delay(1000);
    }
    console.log("test fetch close")
    await cache.close();
    done();
})
