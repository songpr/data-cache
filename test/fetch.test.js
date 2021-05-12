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

test("maxAge expired, maxAge > refreshAge", async (done) => {
    let round = 1;
    const fn = () => {
        const obj = {};
        obj[`a_${round}`] = 1 * round;
        obj[`b_${round}`] = 2 * round;
        obj[`c_${round}`] = 3 * round;
        const entires = Object.entries(obj)
        round++
        return entires;
    };
    const cache = new (require("../index"))(fn, { maxAge: 2, refreshAge: 1 });
    await cache.init()
    expect(cache.get("a_1")).toEqual(1);
    expect(cache.get("b_1")).toEqual(2);
    expect(cache.get("c_1")).toEqual(3);
    expect(cache.get("d")).toEqual(undefined);
    expect(cache.get("ee")).toEqual(undefined);
    expect(cache.size).toEqual(3);
    await delay(1100);
    //all items refresh now
    //default resetOnRefresh = true, so remove old items
    expect(cache.size).toEqual(3);//new items
    expect(cache.get("a_1")).toEqual(undefined);
    expect(cache.get("b_1")).toEqual(undefined);
    expect(cache.get("c_1")).toEqual(undefined);
    expect(cache.get("a_2")).toEqual(2);
    expect(cache.get("b_2")).toEqual(4);
    expect(cache.get("c_2")).toEqual(6);
    expect(cache.size).toEqual(3);
    await delay(1000);
    //all items refresh now
    expect(cache.size).toEqual(3);//new items only
    expect(cache.get("a_3")).toEqual(3);
    expect(cache.get("b_3")).toEqual(6);
    expect(cache.get("c_3")).toEqual(9);
    done();
})

test("maxAge expired, maxAge > refreshAge, resetOnRefresh = false", async (done) => {
    let round = 1;
    const fn = () => {
        const obj = {};
        obj[`a_${round}`] = 1 * round;
        obj[`b_${round}`] = 2 * round;
        obj[`c_${round}`] = 3 * round;
        const entires = Object.entries(obj)
        round++
        return entires;
    };
    const cache = new (require("../index"))(fn, { maxAge: 2, refreshAge: 1, resetOnRefresh: false });
    await cache.init()
    expect(cache.get("a_1")).toEqual(1);
    expect(cache.get("b_1")).toEqual(2);
    expect(cache.get("c_1")).toEqual(3);
    expect(cache.get("d")).toEqual(undefined);
    expect(cache.get("ee")).toEqual(undefined);
    expect(cache.size).toEqual(3);
    await delay(1100);
    //all items refresh now
    //default resetOnRefresh = false, so last items are exist
    expect(cache.size).toEqual(6);//new items
    expect(cache.get("a_1")).toEqual(1);
    expect(cache.get("b_1")).toEqual(2);
    expect(cache.get("c_1")).toEqual(3);
    expect(cache.get("a_2")).toEqual(2);
    expect(cache.get("b_2")).toEqual(4);
    expect(cache.get("c_2")).toEqual(6);
    await delay(1000);
    //new refresh
    //first round item expired now
    expect(cache.size).toEqual(9);//9 because we not get expired items yet, so have 3 round of items
    expect(cache.get("a_1")).toEqual(undefined);
    expect(cache.get("b_1")).toEqual(undefined);
    expect(cache.get("c_1")).toEqual(undefined);
    expect(cache.size).toEqual(6);//6 because expired items removed
    expect(cache.get("a_3")).toEqual(3);
    expect(cache.get("b_3")).toEqual(6);
    expect(cache.get("c_3")).toEqual(9);
    done();
})