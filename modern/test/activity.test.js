import test from "node:test";
import assert from "node:assert/strict";
import {MetricPath} from "../src/path.js";
import {Locomotion} from "../src/locomotion.js";
import {activityMetrics,ascentDescent,formatDuration,formatPace} from "../src/activity.js";

test("terrain ascent and descent progress linearly along path",()=>{
 const path=new MetricPath([[0,0,100],[10,0,110],[20,0,105]]);
 const total=ascentDescent(path,path.totalLength);
 assert.equal(total.ascent,10);
 assert.equal(total.descent,5);
 const halfway=ascentDescent(path,5);
 assert.ok(halfway.ascent>0&&halfway.ascent<10);
 assert.equal(halfway.descent,0);
});

test("active time and energy freeze on pause and restart on reset",()=>{
 const path=new MetricPath([[0,0,0],[100,0,0]]);
 const motion=new Locomotion(path,{speed:4.5});
 motion.start();
 motion.update(.1);motion.update(.1);
 assert.equal(motion.elapsed,.2);
 assert.ok(motion.metMinutes>0);
 const previous=motion.metMinutes;
 motion.pause();motion.update(.1);
 assert.equal(motion.elapsed,.2);
 assert.equal(motion.metMinutes,previous);
 const metrics=activityMetrics({path,distance:motion.distance,elapsed:motion.elapsed,metMinutes:motion.metMinutes,speed:0});
 assert.ok(metrics.kcal>0);
 motion.reset();
 assert.equal(motion.elapsed,0);
 assert.equal(motion.metMinutes,0);
});

test("activity formatted durations and pace",()=>{
 assert.equal(formatDuration(3661),"01:01:01");
 assert.equal(formatPace(300),"5:00");
 assert.equal(formatPace(null),"—");
});
