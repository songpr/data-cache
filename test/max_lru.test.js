//testing max and lru when having max
const { expect } = require("@jest/globals");
const delay = require("delay");

test("fetch exceed max, keep first max entries - make sure the most important entry is the first one", async (done) => {
    const max = 3;
    const fn = () => Object.entries({ a: 1, b: 2, c: 3, d: 4 });
    const cache = new (require("../index"))(fn, { max: max });
    await cache.init();
    expect(cache.size).toEqual(max);
    expect(cache.get("a")).toEqual(1);
    expect(cache.get("b")).toEqual(2);
    expect(cache.get("c")).toEqual(3);
    expect(cache.get("d")).toEqual(undefined);
    expect(cache.get("ee")).toEqual(undefined);
    done();
})

const ntest = () => { };
test("fetch exceed max, refresh cache every 1 sec", async (done) => {
    const max = 3;
    let round = 1;
    const fn = () => {
        console.log("test fetch", round)
        const entires = Object.entries({ a: 1 * round, b: 2 * round, c: 3 * round, d: 4 * round })
        round++
        return entires;
    };
    const cache = new (require("../index"))(fn, { max, maxAge: 1 });
    await cache.init()
    //loop 3 round
    for (let i = 1; i <= 3; i++) {
        console.log("i", i, "round", round)
        expect(cache.get("a")).toEqual(1 * i);
        expect(cache.get("b")).toEqual(2 * i);
        expect(cache.get("c")).toEqual(3 * i);
        expect(cache.get("d")).toEqual(undefined);
        expect(cache.get("ee")).toEqual(undefined);
        expect(cache.size).toEqual(max);
        await delay(1000);
    }
    console.log("test fetch close")
    await cache.close();
    done();
})

test("fetch exceed max, maxAge expired, maxAge < refreshAge", async (done) => {
    const max = 3;
    let round = 1;
    const fn = () => {
        const entires = Object.entries({ a: 1 * round, b: 2 * round, c: 3 * round, d: 4 * round })
        round++
        return entires;
    };
    const cache = new (require("../index"))(fn, { max, maxAge: 1, refreshAge: 2 });
    await cache.init()
    expect(cache.get("a")).toEqual(1);
    expect(cache.get("b")).toEqual(2);
    expect(cache.get("c")).toEqual(3);
    expect(cache.get("d")).toEqual(undefined);
    expect(cache.get("ee")).toEqual(undefined);
    expect(cache.size).toEqual(max);
    await delay(1100);
    //all items expired now
    expect(cache.size).toEqual(max);//expired but not get it so size not change
    expect(cache.get("a")).toEqual(undefined);
    expect(cache.get("b")).toEqual(undefined);
    expect(cache.get("c")).toEqual(undefined);
    expect(cache.size).toEqual(0);//0 because we just get the expired item, so it removed
    await delay(1000);
    //all items refresh now
    expect(cache.size).toEqual(max);
    expect(cache.get("a")).toEqual(2);
    expect(cache.get("b")).toEqual(4);
    expect(cache.get("c")).toEqual(6);
    expect(cache.get("d")).toEqual(undefined);
    await cache.close();
    done();
})

test("fetch exceed max ,maxAge expired, maxAge > refreshAge, resetOnRefresh=true", async (done) => {
    const max = 3;
    let round = 1;
    const fn = () => {
        const obj = {};
        obj[`a_${round}`] = 1 * round;
        obj[`b_${round}`] = 2 * round;
        obj[`c_${round}`] = 3 * round;
        obj[`d_${round}`] = 4 * round;
        const entires = Object.entries(obj)
        round++
        return entires;
    };
    const cache = new (require("../index"))(fn, { max, maxAge: 2, refreshAge: 1 });
    await cache.init()
    expect(cache.get("a_1")).toEqual(1);
    expect(cache.get("b_1")).toEqual(2);
    expect(cache.get("c_1")).toEqual(3);
    expect(cache.get("d_1")).toEqual(undefined);
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
    expect(cache.get("d_3")).toEqual(undefined);
    await cache.close();
    done();
})
//new fetch more important than old items
test("fetch size < max ,maxAge expired, maxAge > refreshAge, resetOnRefresh=true", async (done) => {
    const max = 6;
    let round = 1;
    const fn = () => {
        const obj = {};
        obj[`a_${round}`] = 1 * round;
        obj[`b_${round}`] = 2 * round;
        obj[`c_${round}`] = 3 * round;
        obj[`d_${round}`] = 4 * round;
        const entires = Object.entries(obj)
        round++
        return entires;
    };
    const cache = new (require("../index"))(fn, { max, maxAge: 2, refreshAge: 1 });
    await cache.init()
    expect(cache.get("a_1")).toEqual(1);
    expect(cache.get("b_1")).toEqual(2);
    expect(cache.get("c_1")).toEqual(3);
    expect(cache.get("d_1")).toEqual(4);
    expect(cache.get("ee")).toEqual(undefined);
    expect(cache.size).toEqual(4);
    await delay(1100);
    //all items refresh now
    //default resetOnRefresh = true, so remove old items
    expect(cache.size).toEqual(4);//new items
    expect(cache.get("a_1")).toEqual(undefined);
    expect(cache.get("b_1")).toEqual(undefined);
    expect(cache.get("c_1")).toEqual(undefined);
    expect(cache.get("d_1")).toEqual(undefined);
    expect(cache.get("a_2")).toEqual(2);
    expect(cache.get("b_2")).toEqual(4);
    expect(cache.get("c_2")).toEqual(6);
    expect(cache.get("d_2")).toEqual(8);
    expect(cache.size).toEqual(4);
    await delay(1000);
    //all items refresh now
    expect(cache.size).toEqual(4);//new items only
    expect(cache.get("a_3")).toEqual(3);
    expect(cache.get("b_3")).toEqual(6);
    expect(cache.get("c_3")).toEqual(9);
    expect(cache.get("d_3")).toEqual(12);
    await cache.close();
    done();
})

//new fetch more important than lru
ntest("fetch size > max, maxAge expired, maxAge > refreshAge, resetOnRefresh = false", async (done) => {
    const max = 3;
    let round = 1;
    const fn = () => {
        const obj = {};
        obj[`a_${round}`] = 1 * round;
        obj[`b_${round}`] = 2 * round;
        obj[`c_${round}`] = 3 * round;
        obj[`d_${round}`] = 4 * round;
        const entires = Object.entries(obj)
        round++
        return entires;
    };
    const cache = new (require("../index"))(fn, { max, maxAge: 2, refreshAge: 1, resetOnRefresh: false });
    await cache.init()
    expect(cache.get("a_1")).toEqual(1);
    expect(cache.get("b_1")).toEqual(2);
    expect(cache.get("c_1")).toEqual(3);
    expect(cache.get("d_1")).toEqual(undefined);
    expect(cache.get("ee")).toEqual(undefined);
    expect(cache.size).toEqual(max);
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
    await cache.close();
    done();
});