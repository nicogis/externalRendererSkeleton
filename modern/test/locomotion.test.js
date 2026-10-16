import test from "node:test";
import assert from "node:assert/strict";
import {MetricPath} from "../src/path.js";
import {Locomotion} from "../src/locomotion.js";
test("distance interpolation uses metric arc length",()=>{
 const p=new MetricPath([[0,0],[3,0],[3,4]]);
 assert.equal(p.totalLength,7);assert.deepEqual(p.sample(5),[3,2,0]);
});
test("speed independent of frame frequency",()=>{
 const p=new MetricPath([[0,0],[100,0]]);
 const a=new Locomotion(p),b=new Locomotion(p);a.start();b.start();
 for(let i=0;i<60;i++)a.update(1/60);
 for(let i=0;i<30;i++)b.update(1/30);
 assert.ok(Math.abs(a.distance-b.distance)<1e-10);
});
test("pause and endpoint",()=>{
 const l=new Locomotion(new MetricPath([[0,0],[1,0]]),{speed:2});
 l.start();for(let i=0;i<10;i++)l.update(.1);
 assert.equal(l.distance,1);assert.equal(l.finished,true);
 l.reset();l.start();l.update(.1);l.pause();l.update(.1);assert.equal(l.distance,.2);
});
