import RenderNode from "@arcgis/core/views/3d/webgl/RenderNode.js";
import * as webgl from "@arcgis/core/views/3d/webgl.js";
import * as THREE from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {MetricPath} from "./path.js";
import {Locomotion} from "./locomotion.js";

const SR={wkid:3857};
const route=[[998349.7321,5631130.5139],[998650.4915,5631435.5494],[999191.5042,5631790.1626],[999954.0427,5631939.8923],[1000821.2216,5631456.0378],[1001712.8907,5631311.0441],[1002457.6181,5631377.2365],[1002683.5966,5631619.9465],[1003417.1921,5631433.9734]];
// Geometry is in Web Mercator meters, close enough for a small local demo.
// A full migration should use a geodesic sampler for larger routes.
export function createSkeletonNode(view,{modelUrl,onStatus=()=>{}}={}){
 const path=new MetricPath(route);
 const motion=new Locomotion(path,{speed:1.4,clipMetersPerSecond:1.4});
 const Node=RenderNode.createSubclass({
  initialize(){
   this.consumes.required.push("opaque-color");
   this.produces="opaque-color";
   this.scene3=new THREE.Scene();
   this.camera3=new THREE.Camera();
   this.root=new THREE.Group();
   this.scene3.add(this.root);
   this.placeholder=new THREE.Mesh(new THREE.CapsuleGeometry(.4,1.2,6,12),new THREE.MeshNormalMaterial());
   this.placeholder.position.z=1;
   this.root.add(this.placeholder);
   this.scene3.add(new THREE.AmbientLight(0xffffff,2));
   this.localOrigin=webgl.toRenderCoordinates(view,[route[0][0],route[0][1],0],0,SR,new Float64Array(3),0,1);
   this.clockTime=performance.now();
   this.mixer=null;this.actions={};this.gait="walk";
   if(modelUrl)this.loadModel(modelUrl,onStatus);
   onStatus("RenderNode ready — diagnostic capsule. Start to animate.");
  },
  async loadModel(url,report){
   try{
    const gltf=await new GLTFLoader().loadAsync(url);
    if(this.destroyed)return;
    this.root.remove(this.placeholder);
    this.root.add(gltf.scene);
    this.model=gltf.scene;
    this.mixer=new THREE.AnimationMixer(gltf.scene);
    for(const clip of gltf.animations)this.actions[clip.name.toLowerCase()]=this.mixer.clipAction(clip);
    const walk=Object.entries(this.actions).find(([name])=>name.includes("walk"));
    if(walk){walk[1].play();this.activeAction=walk[1];}
    report("GLB loaded: "+gltf.animations.map(a=>a.name).join(", "));
    this.requestRender();
   }catch(error){report("GLB load failed: "+error.message);}
  },
  render(){
   this.resetWebGLState();
   const output=this.bindRenderTarget();
   const gl=this.gl;
   if(!this.renderer3){
    this.renderer3=new THREE.WebGLRenderer({canvas:gl.canvas,context:gl,antialias:false});
    this.renderer3.autoClear=false;
    this.renderer3.outputColorSpace=THREE.SRGBColorSpace;
    // ArcGIS owns the framebuffer. Three.js must not redirect drawing to the default framebuffer.
    const setTarget=this.renderer3.setRenderTarget.bind(this.renderer3);
    this.renderer3.setRenderTarget=(target,...args)=>{
     setTarget(target,...args);
     if(target===null)this.bindRenderTarget();
    };
   }
   const now=performance.now();
   const dt=Math.min((now-this.clockTime)/1000,.1);
   this.clockTime=now;
   const pose=motion.update(dt);
   const point=[...pose.position];
   const world=webgl.toRenderCoordinates(view,point,0,SR,new Float64Array(3),0,1);
   this.root.position.set(world[0]-this.localOrigin[0],world[1]-this.localOrigin[1],world[2]-this.localOrigin[2]);
   // Derive local east/north/up from ArcGIS coordinate transformation.
   const transform=webgl.renderCoordinateTransformAt(view,point,SR,new Float64Array(16));
   const east=new THREE.Vector3(transform[0],transform[1],transform[2]).normalize();
   const north=new THREE.Vector3(transform[4],transform[5],transform[6]).normalize();
   const up=new THREE.Vector3(transform[8],transform[9],transform[10]).normalize();
   const tangent=new THREE.Vector3().addScaledVector(east,pose.tangent[0]).addScaledVector(north,pose.tangent[1]).addScaledVector(up,pose.tangent[2]).normalize();
   const right=new THREE.Vector3().crossVectors(tangent,up).normalize();
   const forward=new THREE.Vector3().crossVectors(up,right).normalize();
   // Model convention: +Y forward, +Z up. Asset-specific correction belongs in model import.
   const basis=new THREE.Matrix4().makeBasis(right,forward,up);
   this.root.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(basis),Math.min(1,dt*8));
   if(this.mixer)this.mixer.update(dt*pose.animationScale);
   this.camera3.projectionMatrix.fromArray(this.camera.projectionMatrix);
   this.camera3.projectionMatrixInverse.copy(this.camera3.projectionMatrix).invert();
   const viewMatrix=new THREE.Matrix4().fromArray(this.camera.viewMatrix);
   const originMatrix=new THREE.Matrix4().makeTranslation(...this.localOrigin);
   this.camera3.matrixWorldInverse.multiplyMatrices(viewMatrix,originMatrix);
   this.camera3.matrixWorld.copy(this.camera3.matrixWorldInverse).invert();
   const viewport=gl.getParameter(gl.VIEWPORT);
   this.renderer3.setSize(viewport[2],viewport[3],false);
   this.renderer3.resetState();
   this.bindRenderTarget();
   this.renderer3.render(this.scene3,this.camera3);
   this.resetWebGLState();
   if(motion.running)this.requestRender();
   return output;
  },
  destroy(){
   this.destroyed=true;
   this.mixer?.stopAllAction();
   this.scene3?.traverse(o=>{o.geometry?.dispose();if(o.material){const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials)m.dispose();}});
   this.renderer3?.dispose();
  }
 });
 const node=new Node({view});
 return {node,start(){motion.start();node.requestRender();},pause(){motion.pause();node.requestRender();},reset(){motion.reset();node.clockTime=performance.now();node.requestRender();},setSpeed(speed){motion.speed=speed;node.requestRender();}};
}
