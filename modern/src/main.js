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
 const diagnostic=new GraphicsLayer({title:"RenderNode diagnostic position"});
 diagnostic.add(new Graphic({geometry:{type:"point",x:998349.7321,y:5631130.5139,z:0,spatialReference:{wkid:3857}},symbol:{type:"simple-marker",style:"circle",color:[255,45,0,0.95],size:20,outline:{color:[255,255,255],width:2}}}));
 view.map.add(diagnostic);
 await view.goTo({target:{x:998349.7321,y:5631130.5139,z:0,spatialReference:{wkid:3857}},scale:2500,tilt:65},{animate:false});
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
