import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {assetCorrection,CharacterAnimator} from "../src/character.js";

test("canonical asset axes need no correction",()=>{
 const q=assetCorrection([0,1,0],[0,0,1]);
 assert.ok(q.angleTo(new THREE.Quaternion())<1e-6);
});
test("asset correction maps forward and up into canonical axes",()=>{
 const q=assetCorrection([1,0,0],[0,0,1]);
 const f=new THREE.Vector3(1,0,0).applyQuaternion(q);
 assert.ok(f.distanceTo(new THREE.Vector3(0,1,0))<1e-6);
});
test("gait playback scales with physical speed",()=>{
 const model=new THREE.Group();
 const walk=new THREE.AnimationClip("Walk",1,[]);
 const idle=new THREE.AnimationClip("Idle",1,[]);
 const animator=new CharacterAnimator(model,[walk,idle],{clipMetersPerSecond:1});
 animator.update(.016,2);
 assert.equal(animator.active.timeScale,2);
 animator.dispose();
});

test("switches from walking to running at threshold",()=>{
 const model=new THREE.Group();
 const walk=new THREE.AnimationClip("Walk",1,[]);
 const run=new THREE.AnimationClip("Run",1,[]);
 const idle=new THREE.AnimationClip("Idle",1,[]);
 const animator=new CharacterAnimator(model,[walk,run,idle],{
  clipMetersPerSecond:1.4,runMetersPerSecond:4.5,runThreshold:2.8
 });
 animator.update(.016,1.4);
 assert.equal(animator.gait,"walk");
 assert.equal(animator.active.timeScale,1);
 animator.update(.016,4.5);
 assert.equal(animator.gait,"run");
 assert.equal(animator.active.timeScale,1);
 animator.update(.016,0);
 assert.equal(animator.gait,"idle");
 animator.dispose();
});
test("falls back to walk when no run clip is available",()=>{
 const model=new THREE.Group();
 const walk=new THREE.AnimationClip("Walk",1,[]);
 const animator=new CharacterAnimator(model,[walk]);
 animator.update(.016,4);
 assert.equal(animator.gait,"walk");
 animator.dispose();
});
