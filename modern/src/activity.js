/** Pure, unit-tested derived metrics for the ArcGIS Soldier activity simulation. */
export function ascentDescent(path,distance){
 if(!path)return {ascent:0,descent:0};
 let up=0,down=0;
 const limit=Math.max(0,Math.min(path.totalLength,distance));
 for(let i=1;i<path.points.length;i++){
  const start=path.lengths[i-1];if(start>=limit)break;
  const full=path.lengths[i]-start;
  if(full<=0)continue;
  const portion=Math.min(1,(limit-start)/full);
  const change=(path.points[i][2]-path.points[i-1][2])*portion;
  if(change>0)up+=change;else down-=change;
 }
 return {ascent:up,descent:down};
}
export function activityMetrics({path,distance=0,elapsed=0,speed=0,weight=75}){
 const gain=ascentDescent(path,distance);
 const km=distance/1000;
 const paceSeconds=speed>0?1000/speed:null;
 // Approximate gross MET energy. Not a physiological or clinical measurement.
 const mets=speed>=2.8?Math.max(7,Math.min(16,1.5+speed*2)):speed>0?Math.max(2,Math.min(6,1.8+speed*1.3)):1;
 const kcal=mets*3.5*weight*(elapsed/60)/200;
 return {distance,elapsed,speed,km,paceSeconds,kcal,ascent:gain.ascent,descent:gain.descent,progress:path?Math.min(1,distance/path.totalLength):0};
}
export function formatDuration(seconds){
 const n=Math.max(0,Math.floor(seconds));
 return `${String(Math.floor(n/3600)).padStart(2,"0")}:${String(Math.floor(n%3600/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`;
}
export function formatPace(seconds){
 if(seconds===null||!Number.isFinite(seconds))return "—";
 const rounded=Math.round(seconds);
 return `${Math.floor(rounded/60)}:${String(rounded%60).padStart(2,"0")}`;
}
