import "@arcgis/core/assets/esri/themes/light/main.css";
import RenderNode from "@arcgis/core/views/3d/webgl/RenderNode.js";
import * as THREE from "three";
import {MetricPath} from "./path.js";
import {Locomotion} from "./locomotion.js";
import "./style.css";

// First integration milestone: shared-context diagnostic geometry.
// The original marine JSON cannot be loaded by modern GLTFLoader without conversion.
const element=document.querySelector("arcgis-scene");
const status=document.querySelector("#status");
await element.viewOnReady();
const view=element.view;
element.camera={position:{longitude:9,latitude:45,z:1200},heading:0,tilt:65};
const path=new MetricPath([[0,0],[10,0],[10,10]]);
const motion=new Locomotion(path);
const SkeletonNode=RenderNode.createSubclass({
  initialize(){
    this.consumes.required.push("opaque-color");
    this.produces="opaque-color";
    this.scene=new THREE.Scene();
    this.camera3=new THREE.Camera();
    this.mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,2),new THREE.MeshBasicMaterial({color:0x18b6ff}));
    this.scene.add(this.mesh);
    this.lastTime=performance.now();
  },
  render(){
    const output=this.bindRenderTarget();
    // Shared WebGL context requires state restoration; Three.js compatibility
    // and camera/local-origin mapping must be validated before enabling draws.
    this.resetWebGLState();
    const now=performance.now(),dt=(now-this.lastTime)/1000;this.lastTime=now;
    const pose=motion.update(dt);
    this.mesh.position.set(...pose.position);
    this.requestRender();
    return output;
  }
});
new SkeletonNode({view});
status.textContent="RenderNode registered (diagnostic only; model rendering not yet enabled).";
