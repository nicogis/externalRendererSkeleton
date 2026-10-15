import * as THREE from "three";

/**
 * Asset axes are a property of the imported model, not a map heading.
 * This calibration rotates the asset's declared forward/up vectors into +Y/+Z.
 */
export function assetCorrection(forward,up) {
 const f=new THREE.Vector3(...forward).normalize();
 const u=new THREE.Vector3(...up).normalize();
 if(Math.abs(f.dot(u))>1e-5)throw new Error("Asset forward and up must be orthogonal");
 const r=new THREE.Vector3().crossVectors(f,u).normalize();
 const source=new THREE.Matrix4().makeBasis(r,f,u);
 return new THREE.Quaternion().setFromRotationMatrix(source).invert();
}

export class CharacterAnimator {
 constructor(model,clips,{clipMetersPerSecond=1.4,forward=[0,1,0],up=[0,0,1]}={}) {
  if(!(clipMetersPerSecond>0))throw new Error("clipMetersPerSecond must be positive");
  this.model=model;
  this.model.quaternion.copy(assetCorrection(forward,up));
  this.mixer=new THREE.AnimationMixer(model);
  this.actions=new Map();
  for(const clip of clips)this.actions.set(clip.name.toLowerCase(),this.mixer.clipAction(clip));
  this.clipMetersPerSecond=clipMetersPerSecond;
  this.active=null;
  this.select("idle",0);
 }
 find(gait) {
  return [...this.actions.entries()].find(([name])=>name.includes(gait))?.[1] ?? null;
 }
 select(gait,fade=0.2) {
  const next=this.find(gait);
  if(!next || next===this.active)return Boolean(next);
  next.enabled=true;
  next.reset().fadeIn(fade).play();
  if(this.active)this.active.fadeOut(fade);
  this.active=next;
  return true;
 }
 update(deltaSeconds,speedMetersPerSecond) {
  const moving=speedMetersPerSecond>0;
  if(moving) {
   if(!this.select("walk"))this.select("run");
  } else {
   if(!this.select("idle") && this.active)this.active.paused=true;
  }
  if(this.active && moving) {
   this.active.paused=false;
   this.active.timeScale=speedMetersPerSecond/this.clipMetersPerSecond;
  }
  this.mixer.update(Math.min(Math.max(0,deltaSeconds),0.1));
 }
 dispose() {this.mixer.stopAllAction();this.mixer.uncacheRoot(this.model);}
}
