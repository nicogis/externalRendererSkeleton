// Distance and animation time share a physical clock; calibration is clip-specific.
export class Locomotion {
  constructor(path,{speed=1.4,clipMetersPerSecond=1.4}={}) {
    if(!(speed>=0) || !(clipMetersPerSecond>0)) throw new Error("Invalid gait parameters");
    this.path=path;this.speed=speed;this.clipMetersPerSecond=clipMetersPerSecond;
    this.distance=0;this.running=false;this.finished=false;
  }
  start(){if(!this.finished)this.running=true;}
  pause(){this.running=false;}
  reset(){this.distance=0;this.finished=false;this.running=false;}
  update(deltaSeconds){
    if(!Number.isFinite(deltaSeconds)||deltaSeconds<0) throw new Error("Invalid delta");
    const dt=Math.min(deltaSeconds,0.1);
    if(this.running){
      this.distance=Math.min(this.path.totalLength,this.distance+this.speed*dt);
      if(this.distance>=this.path.totalLength){this.running=false;this.finished=true;}
    }
    return {position:this.path.sample(this.distance),tangent:this.path.tangent(this.distance),
      distance:this.distance,finished:this.finished,animationScale:this.running?this.speed/this.clipMetersPerSecond:0};
  }
}
