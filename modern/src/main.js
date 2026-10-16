import "@arcgis/core/assets/esri/themes/light/main.css";
import "@arcgis/map-components/components/arcgis-scene";
import "@arcgis/map-components/components/arcgis-zoom";
import {createSkeletonNode} from "./renderer.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import "./style.css";

const element=document.querySelector("arcgis-scene");
const status=document.querySelector("#status");
try {
 await element.viewOnReady();
 const view=element.view;
 element.camera={position:{x:998349.7321,y:5631040.5139,z:90,spatialReference:{wkid:3857}},heading:0,tilt:75};
 // ArcGIS-native volumetric marker: independent of Three.js and RenderNode.
 // Visible in noNode and noThree modes as an unambiguous geospatial reference.
 const markers=new GraphicsLayer({
  title:"Debug: route start (orange sphere)",
  elevationInfo:{mode:"relative-to-ground"}
 });
 markers.add(new Graphic({
  geometry:{type:"point",x:998349.7321,y:5631130.5139,z:35,spatialReference:{wkid:3857}},
  symbol:{
   type:"point-3d",
   symbolLayers:[{
    type:"object",
    resource:{primitive:"sphere"},
    width:36,height:36,depth:36,
    material:{color:[255,80,0,1]}
   }]
  },
  attributes:{Name:"Route start / ArcGIS reference"}
 }));
 const showMarker=new URLSearchParams(window.location.search).has("showMarker");
 markers.visible=showMarker;
 view.map.add(markers);
 console.info("[Skeleton] Diagnostic sphere",showMarker?"visible":"hidden (add ?showMarker to display)");
 await view.goTo({target:{type:"point",x:998349.7321,y:5631130.5139,z:0,spatialReference:{wkid:3857}},scale:2500,tilt:65},{animate:false});
 if(new URLSearchParams(window.location.search).has("noNode")){
  status.textContent="Diagnostic: ArcGIS SceneView only; RenderNode and Three.js disabled.";
  console.info("[Skeleton] noNode mode: no custom renderer created");
 } else {
  const app=createSkeletonNode(view,{modelUrl:new URL("models/Soldier.glb",document.baseURI).href,onStatus:message=>status.textContent=message});
 document.querySelector("#start").addEventListener("click",()=>app.start());
 document.querySelector("#pause").addEventListener("click",()=>app.pause());
 document.querySelector("#reset").addEventListener("click",()=>app.reset());
 document.querySelector("#focus").addEventListener("click",()=>app.focus().catch(error=>{status.textContent="Focus failed: "+error.message;console.error(error);}));
 document.querySelector("#heading").addEventListener("input",event=>{
  app.setHeadingOffset(Number(event.target.value));
  document.querySelector("#headingValue").textContent=event.target.value;
 });
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
