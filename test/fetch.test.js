const { expect } = require("@jest/globals");
const delay = require("delay");

test("fetch only", async (done) => {
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

test("fetch refresh cache every 1 sec", async (done) => {
    let round = 1;
    const fn = () => {
        const entires = Object.entries({ a: 1 * round, b: 2 * round, c: 3 * round })
        round++
        return entires;
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
    done();
})

test("maxAge expired, maxAge < refreshAge", async (done) => {
    let round = 1;
    const fn = () => {
        const entires = Object.entries({ a: 1 * round, b: 2 * round, c: 3 * round })
        round++
        return entires;
    };
    const cache = new (require("../index"))(fn, { maxAge: 1, refreshAge: 2 });
    await cache.init()
    expect(cache.get("a")).toEqual(1);
    expect(cache.get("b")).toEqual(2);
    expect(cache.get("c")).toEqual(3);
    expect(cache.get("d")).toEqual(undefined);
    expect(cache.get("ee")).toEqual(undefined);
    expect(cache.size).toEqual(3);
    await delay(1100);
    //all items expired now
    expect(cache.size).toEqual(3);//expired but not get it so size not change
    expect(cache.get("a")).toEqual(undefined);
    expect(cache.get("b")).toEqual(undefined);
    expect(cache.get("c")).toEqual(undefined);
    expect(cache.size).toEqual(0);//0 because we just get the expired item, so it removed
    await delay(1000);
    //all items refresh now
    expect(cache.get("a")).toEqual(2);
    expect(cache.get("b")).toEqual(4);
    expect(cache.get("c")).toEqual(6);
    done();
})
