import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import Polyline from "@arcgis/core/geometry/Polyline.js";

/** Divide long sketch segments so the ground DEM is sampled along the route. */
export function densifyPath(points,stepMeters=8,maxVertices=1800){
 if(!Array.isArray(points)||points.length<2)throw new Error("Draw at least two vertices.");
 const out=[[points[0][0],points[0][1]]];
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i];
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(!Number.isFinite(length))throw new Error("Invalid route coordinates.");
  if(length<0.01)continue;
  const n=Math.max(1,Math.ceil(length/stepMeters));
  if(out.length+n>maxVertices)throw new Error("Route too long. Draw a shorter route or fewer vertices.");
  for(let j=1;j<=n;j++)out.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);
 }
 if(out.length<2)throw new Error("Route has no length.");
 return out;
}

export function setupRouteEditor(view,{onRoute,onStatus}){
 const layer=new GraphicsLayer({title:"Soldier route (drawn)",elevationInfo:{mode:"relative-to-ground",offset:0.5}});
 view.map.add(layer);
 const sketch=new SketchViewModel({
  view,layer,
  polylineSymbol:{type:"line-3d",symbolLayers:[{type:"line",material:{color:[0,180,255]},size:5}]},
  defaultCreateOptions:{hasZ:false},
  updateOnGraphicClick:false
 });
 let processing=false;
 sketch.on("create",async event=>{
  if(event.state!=="complete"||processing)return;
  processing=true;
  try {
   const geometry=event.graphic?.geometry;
   if(!geometry || geometry.type!=="polyline")throw new Error("Sketch did not produce a polyline.");
   const sr=geometry.spatialReference;
   if(sr?.wkid!==3857 && sr?.latestWkid!==3857)throw new Error("Route must be in Web Mercator (WKID 3857).");
   const xy=densifyPath(geometry.paths[0]);
   onStatus("Sampling terrain elevations along "+xy.length+" route points…");
   const interpolated=new Polyline({paths:[xy],spatialReference:sr});
   const result=await view.map.ground.queryElevation(interpolated,{demResolution:"auto"});
   const elevated=result.geometry.paths[0].map(p=>[p[0],p[1],p[2]]);
   if(elevated.length!==xy.length || elevated.some(p=>!p.every(Number.isFinite))){
    throw new Error("Terrain service did not return valid elevations for all vertices.");
   }
   await onRoute(elevated);
   layer.removeAll();
   layer.add(new Graphic({
    geometry:new Polyline({paths:[elevated],spatialReference:sr}),
    symbol:{type:"line-3d",symbolLayers:[{type:"line",material:{color:[0,180,255]},size:5}]}
   }));
   onStatus("Route ready: "+elevated.length+" sampled points. Press Focus Soldier or Start.");
  }catch(error){
   console.error("[Skeleton] route drawing failed",error);
   layer.removeAll();
   onStatus("Route error: "+error.message+" Original route unchanged.");
  }finally{processing=false;}
 });
 return {
  draw(){if(processing)return;sketch.cancel();layer.removeAll();sketch.create("polyline",{mode:"click"});onStatus("Click along road; double-click to finish (Esc to cancel).");},
  clear(){sketch.cancel();layer.removeAll();onStatus("Drawn route cleared. Click Draw route to create another.");},
  destroy(){sketch.destroy();view.map.remove(layer);layer.destroy();}
 };
}
