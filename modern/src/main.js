import "@arcgis/core/assets/esri/themes/light/main.css";
import "@arcgis/map-components/components/arcgis-scene";
import "@arcgis/map-components/components/arcgis-zoom";
import {createSkeletonNode} from "./renderer.js";
import {setupRouteEditor} from "./routeEditor.js";
import {activityMetrics,formatDuration,formatPace} from "./activity.js";
import "./style.css";

const element=document.querySelector("arcgis-scene");
const status=document.querySelector("#status");
try {
 await element.viewOnReady();
 const view=element.view;
 element.camera={position:{x:998349.7321,y:5631040.5139,z:90,spatialReference:{wkid:3857}},heading:0,tilt:75};
 await view.goTo({target:{type:"point",x:998349.7321,y:5631130.5139,z:0,spatialReference:{wkid:3857}},scale:2500,tilt:65},{animate:false});
 if(new URLSearchParams(window.location.search).has("noNode")){
  status.textContent="Diagnostic: ArcGIS SceneView only; RenderNode and Three.js disabled.";
  console.info("[Skeleton] noNode mode: no custom renderer created");
 } else {
  let latestActivity=activityMetrics({});
  let weight=75;
  const field=(id,value)=>document.getElementById(id).textContent=value;
  function updateMonitor(metrics){
   latestActivity=metrics;
   field("metricDistance",metrics.distance>=1000?(metrics.distance/1000).toFixed(2)+" km":metrics.distance.toFixed(0)+" m");
   field("metricTime",formatDuration(metrics.elapsed));
   field("metricSpeed",(metrics.speed*3.6).toFixed(1)+" km/h");
   field("metricPace",formatPace(metrics.paceSeconds)+" min/km");
   field("metricAscent",metrics.ascent.toFixed(1)+" m");
   field("metricDescent",metrics.descent.toFixed(1)+" m");
   field("metricCalories",(metrics.kcal*weight/75).toFixed(1)+" kcal");
   document.getElementById("metricProgress").style.width=(metrics.progress*100).toFixed(1)+"%";
   routeEditor?.updateProgress(metrics.distance);
  }
  let routeEditor=null;
  const app=createSkeletonNode(view,{modelUrl:new URL("models/Soldier.glb",document.baseURI).href,onStatus:message=>status.textContent=message,onActivity:updateMonitor});
 const requiresRoute=["start","pause","reset","focus"];
 const setRouteControls=enabled=>requiresRoute.forEach(id=>{document.getElementById(id).disabled=!enabled;});
 setRouteControls(false);
 status.textContent="No route selected. Click Draw route, trace the road and double-click to finish.";
 routeEditor=setupRouteEditor(view,{
  onRoute:points=>{app.setRoute(points);setRouteControls(true);},
  onStatus:message=>status.textContent=message
 });
 document.querySelector("#routeMode").addEventListener("change",event=>{routeEditor.setMode(event.target.value);routeEditor.updateProgress(latestActivity.distance);});
 document.getElementById("activityWeight").addEventListener("input",event=>{const value=Number(event.target.value);if(value>=30&&value<=250){weight=value;updateMonitor(latestActivity);}});
 updateMonitor(latestActivity);
 document.querySelector("#drawRoute").addEventListener("click",()=>{app.clearRoute();setRouteControls(false);routeEditor.draw();});
 document.querySelector("#clearRoute").addEventListener("click",()=>{routeEditor.clear();app.clearRoute();setRouteControls(false);});
 document.querySelector("#start").addEventListener("click",()=>app.start());
 document.querySelector("#pause").addEventListener("click",()=>app.pause());
 document.querySelector("#reset").addEventListener("click",()=>app.reset());
 document.querySelector("#focus").addEventListener("click",()=>app.focus().catch(error=>{status.textContent="Focus failed: "+error.message;console.error(error);}));
 document.querySelector("#clearance").addEventListener("input",event=>{
  app.setFootClearance(Number(event.target.value));
  document.querySelector("#clearanceValue").textContent=Number(event.target.value).toFixed(2);
 });
 document.querySelector("#heading").addEventListener("input",event=>{
  app.setHeadingOffset(Number(event.target.value));
  document.querySelector("#headingValue").textContent=event.target.value;
 });
 document.querySelector("#speed").addEventListener("input",event=>{
  app.setSpeed(Number(event.target.value));
  document.querySelector("#speedValue").textContent=event.target.value;
 });
 window.addEventListener("pagehide",()=>{routeEditor.destroy();app.node.destroy();},{once:true});
 }
} catch(error) {
 status.textContent="Initialization failed: "+error.message;
 console.error(error);
}
