const { expect } = require("@jest/globals");
const delay = require("delay");
test("fetch at specific time", async (done) => {
    const fn = () => Object.entries({ a: 1, b: 2, c: 3 });
    const nowMs = Date.now()
    const next1Sec = new Date(nowMs + 1000);
    //run in next secound
    const days = 2;
    const options = { refreshAt: { days, at: `${next1Sec.getHours()}:${next1Sec.getMinutes()}:${next1Sec.getSeconds()}` } }
    console.log(options.refreshAt.at)
    const cache = new (require("../index"))(fn, options);
    await cache.init();
    expect(cache.get("a")).toEqual(1);
    expect(cache.get("b")).toEqual(2);
    expect(cache.get("c")).toEqual(3);
    expect(cache.size).toEqual(3);
    console.log("next run at ", cache._runAt);
    //expect next run time to be within +- 1sec of refreshAt.at
    const timeMS = next1Sec.getHours() * 60 * 60 * 1000 + next1Sec.getMinutes() * 60 * 1000 + next1Sec.getSeconds() * 1000;
    const nextTimeMs = cache._runAt.getHours() * 60 * 60 * 1000 + cache._runAt.getMinutes() * 60 * 1000 + cache._runAt.getSeconds() * 1000;
    expect(nextTimeMs).toBeLessThanOrEqual(timeMS + 1000);
    expect(nextTimeMs).toBeGreaterThanOrEqual(timeMS - 1000);
    done();
});

test("fetch at specific time, maxAge", async (done) => {
    const fn = () => Object.entries({ a: 1, b: 2, c: 3 });
    const nowMs = Date.now()
    const next1Sec = new Date(nowMs + 1000);
    //run in next secound
    const days = 2;
    const options = { maxAge: 1, refreshAt: { days, at: `${next1Sec.getHours()}:${next1Sec.getMinutes()}:${next1Sec.getSeconds()}` } }
    console.log(options.refreshAt.at)
    const cache = new (require("../index"))(fn, options);
    await cache.init();
    expect(cache.get("a")).toEqual(1);
    expect(cache.get("b")).toEqual(2);
    expect(cache.get("c")).toEqual(3);
    expect(cache.get("d")).toEqual(undefined);
    expect(cache.get("ee")).toEqual(undefined);
    expect(cache.size).toEqual(3);
    await delay(1000);
    //now it should be expired
    expect(cache.get("a")).toEqual(undefined);
    expect(cache.get("b")).toEqual(undefined);
    expect(cache.get("d")).toEqual(undefined);
    expect(cache.get("ee")).toEqual(undefined);
    expect(cache.size).toEqual(1); //c do not called yet so it still in cache
    expect(cache.get("c")).toEqual(undefined);
    expect(cache.size).toEqual(0);
    console.log("next run at ", cache._runAt);
    //expect next run time to be within +- 1sec of refreshAt.at
    const timeMS = next1Sec.getHours() * 60 * 60 * 1000 + next1Sec.getMinutes() * 60 * 1000 + next1Sec.getSeconds() * 1000;
    const nextTimeMs = cache._runAt.getHours() * 60 * 60 * 1000 + cache._runAt.getMinutes() * 60 * 1000 + cache._runAt.getSeconds() * 1000;
    expect(nextTimeMs).toBeLessThanOrEqual(timeMS + 1000);
    expect(nextTimeMs).toBeGreaterThanOrEqual(timeMS - 1000);
    done();
});