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
 const app=createSkeletonNode(view,{modelUrl:new URL("models/Soldier.glb",document.baseURI).href,onStatus:message=>status.textContent=message});
 document.querySelector("#start").addEventListener("click",()=>app.start());
 document.querySelector("#pause").addEventListener("click",()=>app.pause());
 document.querySelector("#reset").addEventListener("click",()=>app.reset());
 document.querySelector("#speed").addEventListener("input",event=>{
  app.setSpeed(Number(event.target.value));
  document.querySelector("#speedValue").textContent=event.target.value;
 });
 window.addEventListener("pagehide",()=>app.node.destroy(),{once:true});
} catch(error) {
 status.textContent="Initialization failed: "+error.message;
 console.error(error);
}
