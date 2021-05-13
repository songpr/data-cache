test("test lru-cache max",()=>{
    const cache = new (require("lru-cache"))({ max: 3});
    for (const [key,value] of Object.entries({ a: 1, b: 2, c: 3, d: 4 })){
        cache.set(key,value);
    }
    expect(cache.length).toEqual(3);
    //reach max, remove by 4
    expect(cache.get("a")).toEqual(undefined);
    expect(cache.get("b")).toEqual(2);
    expect(cache.get("c")).toEqual(3);
    expect(cache.get("d")).toEqual(4);

})