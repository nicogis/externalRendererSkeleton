// Geometry in projected metric coordinates. No frame-count-based movement.
export class MetricPath {
  constructor(points) {
    if (!Array.isArray(points) || points.length < 2) throw new Error("At least two path points required");
    this.points = points.map(p => {
      if (!Array.isArray(p) || p.length < 2 || !p.slice(0,2).every(Number.isFinite)) throw new Error("Invalid point");
      return [p[0],p[1],Number.isFinite(p[2])?p[2]:0];
    });
    this.lengths=[0];
    for(let i=1;i<this.points.length;i++){
      const a=this.points[i-1],b=this.points[i];
      this.lengths.push(this.lengths.at(-1)+Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]));
    }
    this.totalLength=this.lengths.at(-1);
    if(this.totalLength===0) throw new Error("Zero-length path");
  }
  sample(distance) {
    const d=Math.max(0,Math.min(this.totalLength,distance));
    let i=1;
    while(i<this.lengths.length-1 && this.lengths[i]<d) i++;
    const a=this.points[i-1],b=this.points[i],segment=this.lengths[i]-this.lengths[i-1];
    if(segment===0) return [...b];
    const t=(d-this.lengths[i-1])/segment;
    return a.map((v,j)=>v+(b[j]-v)*t);
  }
  tangent(distance,epsilon=0.25) {
    const before=this.sample(Math.max(0,distance-epsilon));
    const after=this.sample(Math.min(this.totalLength,distance+epsilon));
    const delta=after.map((v,i)=>v-before[i]);
    const norm=Math.hypot(...delta);
    return norm>0?delta.map(v=>v/norm):[1,0,0];
  }
}
