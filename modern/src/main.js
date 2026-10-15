import "@arcgis/core/assets/esri/themes/light/main.css";
import "@arcgis/map-components/components/arcgis-scene";
import "@arcgis/map-components/components/arcgis-zoom";
import {createSkeletonNode} from "./renderer.js";
import "./style.css";

const element=document.querySelector("arcgis-scene");
const status=document.querySelector("#status");
try {
 await element.viewOnReady();
 const view=element.view;
 element.camera={position:{x:998349.7321,y:5631040.5139,z:90,spatialReference:{wkid:3857}},heading:0,tilt:75};
 // Avoid adding a 2D marker overlay to SceneView while diagnosing rendering.
 // This marker triggered an OverlayManager exception in the browser.
 await view.goTo({target:{type:"point",x:998349.7321,y:5631130.5139,z:0,spatialReference:{wkid:3857}},scale:2500,tilt:65},{animate:false});
 if(new URLSearchParams(window.location.search).has("noNode")){
  status.textContent="Diagnostic: ArcGIS SceneView only; RenderNode and Three.js disabled.";
  console.info("[Skeleton] noNode mode: no custom renderer created");
 } else {
  const app=createSkeletonNode(view,{modelUrl:new URL("models/Soldier.glb",document.baseURI).href,onStatus:message=>status.textContent=message});
 document.querySelector("#start").addEventListener("click",()=>app.start());
 document.querySelector("#pause").addEventListener("click",()=>app.pause());
 document.querySelector("#reset").addEventListener("click",()=>app.reset());
 document.querySelector("#speed").addEventListener("input",event=>{
  app.setSpeed(Number(event.target.value));
  document.querySelector("#speedValue").textContent=event.target.value;
 });
 window.addEventListener("pagehide",()=>app.node.destroy(),{once:true});
 }
} catch(error) {
 status.textContent="Initialization failed: "+error.message;
 console.error(error);
}
