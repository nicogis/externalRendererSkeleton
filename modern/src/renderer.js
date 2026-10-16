import RenderNode from "@arcgis/core/views/3d/webgl/RenderNode.js";
import Point from "@arcgis/core/geometry/Point.js";
import * as webgl from "@arcgis/core/views/3d/webgl.js";
import * as THREE from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {CharacterAnimator} from "./character.js";
import {MetricPath} from "./path.js";
import {Locomotion} from "./locomotion.js";

const SR={wkid:3857};
const route=[[998349.7321,5631130.5139],[998650.4915,5631435.5494],[999191.5042,5631790.1626],[999954.0427,5631939.8923],[1000821.2216,5631456.0378],[1001712.8907,5631311.0441],[1002457.6181,5631377.2365],[1002683.5966,5631619.9465],[1003417.1921,5631433.9734]];

export function createSkeletonNode(view,{modelUrl,onStatus=()=>{}}={}) {
 const path=new MetricPath(route);
 const motion=new Locomotion(path,{speed:1.4,clipMetersPerSecond:1.4});
 let groundElevation=null;
 // Diagnostic mode: keep ArcGIS RenderNode scheduling, skip all Three.js WebGL calls.
 const params=new URLSearchParams(window.location.search);
 const disableThree=params.has("noThree");
 const probe=params.has("probe");
 const threeProbe=params.has("threeProbe");
 const geoProbe=params.has("geoProbe");
 const worldProbe=params.has("worldProbe");
 const placementProbe=params.has("placementProbe");
 const cubeOnly=params.has("cubeOnly");
 const Node=RenderNode.createSubclass({
  consumes:{required:["transparent-color"]},
  produces:"transparent-color",
  initialize() {
   this.screenScene=new THREE.Scene();
   this.screenCamera=new THREE.Camera();
   this.screenCamera.projectionMatrix.identity();
   this.screenCamera.matrixWorld.identity();
   this.screenCamera.matrixWorldInverse.identity();
   this.screenScene.add(new THREE.Mesh(
    new THREE.PlaneGeometry(0.55,0.55),
    new THREE.MeshBasicMaterial({color:0x00ffff,depthTest:false,depthWrite:false,side:THREE.DoubleSide})
   ));
   this.geoScreenScene=new THREE.Scene();
   this.geoScreenMarker=new THREE.Mesh(
    new THREE.PlaneGeometry(0.055,0.055),
    new THREE.MeshBasicMaterial({color:0xffff00,depthTest:false,depthWrite:false,side:THREE.DoubleSide})
   );
   this.geoScreenScene.add(this.geoScreenMarker);
   // A camera-relative mesh tests world geometry with the ArcGIS camera,
   // without geographical placement or GLB animation.
   this.worldProbeScene=new THREE.Scene();
   this.worldProbeMesh=new THREE.Mesh(
    new THREE.BoxGeometry(24,24,24),
    new THREE.MeshBasicMaterial({color:0x00ff00,depthTest:false,depthWrite:false,side:THREE.DoubleSide})
   );
   this.worldProbeMesh.frustumCulled=false;
   this.worldProbeScene.add(this.worldProbeMesh);
   this.placementProbeMesh=new THREE.Mesh(new THREE.BoxGeometry(18,18,18),new THREE.MeshBasicMaterial({color:0x0066ff,depthTest:false,depthWrite:false,side:THREE.DoubleSide}));
   this.placementProbeMesh.frustumCulled=false;
   this.placementProbeScene=new THREE.Scene();
   this.placementProbeScene.add(this.placementProbeMesh);
   this.scene3=new THREE.Scene();
   this.camera3=new THREE.Camera();
   // Esri provides the camera world/view matrices directly. Prevent Three.js
   // from rebuilding matrixWorld from the default zero position each frame.
   this.camera3.matrixAutoUpdate=false;
   this.camera3.matrixWorldAutoUpdate=false;
   this.root=new THREE.Group();
   // Use ordinary Three.js translation for the geographic anchor.
   // The previous raw ArcGIS ENU matrix made the debug cube disappear.
   this.scene3.add(this.root);
   this.scene3.add(new THREE.HemisphereLight(0xffffff,0x555577,2));
   const lamp=new THREE.DirectionalLight(0xffffff,2);
   lamp.position.set(25,15,45);
   this.scene3.add(lamp);
   this.marker=new THREE.Mesh(new THREE.CapsuleGeometry(0.5,1.5,8,12),new THREE.MeshNormalMaterial());
   this.marker.position.z=1.25;
   if(!cubeOnly)this.root.add(this.marker);
   // Independent of glTF loading: if this pink box is invisible while the orange
   // ArcGIS sphere is visible, investigate WebGL target and camera matrices.
   this.debugCube=new THREE.Mesh(
    new THREE.BoxGeometry(18,18,18).toNonIndexed(),
    new THREE.MeshBasicMaterial({color:0xff00ff,depthTest:false,depthWrite:false,side:THREE.DoubleSide})
   );
   this.debugCube.position.z=0;
   this.debugCube.renderOrder=999;
   this.debugCube.frustumCulled=false;
   // Keep debug mesh independent of the GLB hierarchy, as in the working blue probe.
   this.scene3.add(this.debugCube);
   this.localOrigin=webgl.toRenderCoordinates(view,[...route[0],0],0,SR,new Float64Array(3),0,1);
   this.lastTime=performance.now();
   this.lastStatusTime=0;
   this.animator=null;
   // Both marker and box must be compared ABOVE terrain, not at z=0.
   view.map.ground.queryElevation(new Point({
    x:route[0][0],y:route[0][1],z:0,spatialReference:SR
   }),{demResolution:"auto"}).then(result=>{
    const z=result.geometry.z;
    if(!Number.isFinite(z))throw Error("DEM returned invalid elevation");
    groundElevation=z;
    console.info("[Skeleton] DEM elevation at route origin (m):",z);
    onStatus("Terrain elevation "+z.toFixed(1)+" m; diagnostic cube 35 m above terrain.");
    this.requestRender();
   }).catch(error=>{
    console.error("[Skeleton] terrain elevation query failed",error);
    onStatus("Terrain elevation unavailable: "+error.message);
   });
   if(modelUrl && !cubeOnly)this.loadCharacter(modelUrl,onStatus);
   if(cubeOnly)onStatus("Cube-only mode: Soldier is not loaded.");
   onStatus("RenderNode initialized: diagnostic capsule, not yet animated marine.");
  },
  async loadCharacter(url,report) {
   try {
    const gltf=await new GLTFLoader().loadAsync(url);
    if(this.disposed)return;
    this.root.remove(this.marker);
    this.root.add(gltf.scene);
    this.animator=new CharacterAnimator(gltf.scene,gltf.animations,{forward:[0,0,1],up:[0,1,0]});
    const bounds=new THREE.Box3().setFromObject(gltf.scene);
    console.info("[Skeleton] Soldier bounds:",bounds.min.toArray(),bounds.max.toArray(),"clips:",gltf.animations.map(a=>a.name));
    report("Character loaded. Clips: "+(gltf.animations.map(c=>c.name).join(", ")||"none"));
    this.requestRender();
   } catch(error) {
    report("Character load error: "+error.message);
   }
  },
  render() {
   if(disableThree){
    if(!this.reportedNoThree){this.reportedNoThree=true;onStatus("Diagnostic: RenderNode active, no WebGL operations (?noThree).");}
    const now=performance.now();
    const dt=Math.min(Math.max(0,(now-this.lastTime)/1000),0.1);
    this.lastTime=now;
    motion.update(dt);
    if(motion.running)this.requestRender();
    return;
   }
   this.resetWebGLState();
   const output=this.bindRenderTarget();
   const gl=this.gl;
   if(probe){
    // ArcGIS native FBO test: no Three.js and no model/matrix dependency.
    const vp=this.camera.viewport;
    if(vp[2]>0 && vp[3]>0){
     const size=Math.max(32,Math.min(128,Math.floor(Math.min(vp[2],vp[3])/6)));
     gl.enable(gl.SCISSOR_TEST);
     gl.scissor(vp[0]+Math.floor((vp[2]-size)/2),vp[1]+Math.floor((vp[3]-size)/2),size,size);
     gl.clearColor(1,0,1,1);
     gl.colorMask(true,true,true,true);
     gl.clear(gl.COLOR_BUFFER_BIT);
     gl.disable(gl.SCISSOR_TEST);
    }
    if(!this.loggedProbe){
     this.loggedProbe=true;
     onStatus("FBO probe active: magenta square should appear at screen center.");
     console.info("[Skeleton] RenderNode direct framebuffer probe",vp);
    }
    this.resetWebGLState();
    return output;
   }
   if(!this.renderer3) {
    this.renderer3=new THREE.WebGLRenderer({canvas:gl.canvas,context:gl,antialias:false});
    this.renderer3.autoClear=false;
    const original=this.renderer3.setRenderTarget.bind(this.renderer3);
    this.renderer3.setRenderTarget=(target,...args)=>{
     original(target,...args);
     if(target===null)this.bindRenderTarget();
    };
   }
   const now=performance.now();
   const dt=Math.min(Math.max(0,(now-this.lastTime)/1000),0.1);
   this.lastTime=now;
   const pose=motion.update(dt);
   if(motion.running && now-this.lastStatusTime>500){
    this.lastStatusTime=now;
    onStatus(`Walking: ${pose.distance.toFixed(1)} / ${path.totalLength.toFixed(0)} m at ${motion.speed.toFixed(1)} m/s`);
   }
   if(pose.finished && !this.completionReported){
    this.completionReported=true;
    onStatus("Route completed. Press Reset to start again.");
   }
   if(groundElevation===null){
    this.resetWebGLState();
    if(motion.running)this.requestRender();
    return output;
   }
   const raisedPosition=[pose.position[0],pose.position[1],pose.position[2]+groundElevation+35];
   // The direct-position blue probe rendered at this same geographic anchor.
   // Apply ONLY translation to the root, avoiding the suspect ENU basis matrix.
   const anchor=webgl.toRenderCoordinates(view,raisedPosition,0,SR,new Float64Array(3),0,1);
   this.root.position.set(
    anchor[0]-this.localOrigin[0],
    anchor[1]-this.localOrigin[1],
    anchor[2]-this.localOrigin[2]
   );
   this.root.quaternion.identity();
   this.root.scale.set(1,1,1);
   this.root.updateMatrixWorld(true);
   this.debugCube.position.copy(this.root.getWorldPosition(new THREE.Vector3()));
   this.debugCube.updateMatrixWorld(true);
   this.animator?.update(dt,pose.animationScale>0?motion.speed:0);
   this.camera3.projectionMatrix.fromArray(this.camera.projectionMatrix);
   this.camera3.projectionMatrixInverse.copy(this.camera3.projectionMatrix).invert();
   const viewMatrix=new THREE.Matrix4().fromArray(this.camera.viewMatrix);
   const origin=new THREE.Matrix4().makeTranslation(...this.localOrigin);
   this.camera3.matrixWorldInverse.multiplyMatrices(viewMatrix,origin);
   this.camera3.matrixWorld.copy(this.camera3.matrixWorldInverse).invert();
   // WebGLRenderer calls camera.updateMatrixWorld() before drawing. With
   // matrixAutoUpdate disabled, our ArcGIS matrices remain authoritative.
   // IMPORTANT: Never call renderer.setSize() on the ArcGIS-owned canvas.
   // Three.js setSize mutates canvas.width/height even with updateStyle=false,
   // potentially zeroing Esri's framebuffer attachments.
   // Three.js has its own VAO and buffer state caches; synchronize before draw.
   this.bindRenderTarget();
   this.renderer3.resetState();
   const viewport=gl.getParameter(gl.VIEWPORT);
   if(placementProbe){
    // Identical projected point to the fuchsia box; bypass its geographic parent matrix.
    this.root.updateMatrixWorld(true);
    this.debugCube.getWorldPosition(this.placementProbeMesh.position);
    this.placementProbeMesh.updateMatrixWorld(true);
    this.renderer3.setViewport(viewport[0],viewport[1],viewport[2],viewport[3]);
    this.renderer3.render(this.placementProbeScene,this.camera3);
    if(now-(this.lastPlacementProbeStatus||0)>1000){
     this.lastPlacementProbeStatus=now;
     const ndc=this.placementProbeMesh.position.clone().project(this.camera3);
     const position=this.placementProbeMesh.position.toArray();
     onStatus("Blue placement cube: "+ndc.toArray().map(n=>n.toFixed(3)).join(", ")+" | draw calls "+this.renderer3.info.render.calls);
     console.info("[Skeleton] placementProbe local pos",position,"NDC",ndc.toArray(),"calls",this.renderer3.info.render.calls);
    }
    this.resetWebGLState();
    return output;
   }
   if(worldProbe){
    // Place the test box in front of the actual ArcGIS camera in render space.
    // Projection + camera matrix are identical to the normal world scene,
    // but the entire geographic placement path is bypassed.
    this.worldProbeMesh.position.set(0,0,-100).applyMatrix4(this.camera3.matrixWorld);
    this.worldProbeMesh.updateMatrixWorld(true);
    const projected=this.worldProbeMesh.getWorldPosition(new THREE.Vector3()).project(this.camera3);
    this.renderer3.setViewport(viewport[0],viewport[1],viewport[2],viewport[3]);
    const before=this.renderer3.info.render.calls;
    this.renderer3.render(this.worldProbeScene,this.camera3);
    const draws=this.renderer3.info.render.calls;
    if(!this.reportedWorldProbe||now-(this.worldProbeStatusTime||0)>1200){
     this.reportedWorldProbe=true;
     this.worldProbeStatusTime=now;
     onStatus("World probe: green cube in front of camera. NDC "+projected.toArray().map(x=>x.toFixed(3)).join(", ")+"; draw calls "+draws);
     console.info("[Skeleton] worldProbe NDC",projected.toArray(),"draws",draws,"before",before);
    }
    this.resetWebGLState();
    return output;
   }
   if(geoProbe){
    // Project the SAME local-world point through the proposed ArcGIS/Three camera
    // and visualize the NDC position in screen space. Does not use world geometry.
    const worldPoint=this.debugCube.getWorldPosition(new THREE.Vector3());
    const projected=worldPoint.clone().project(this.camera3);
    if(!this.loggedGeoProjection){
     this.loggedGeoProjection=true;
     console.info("[Skeleton] geoProbe projected NDC:",projected.toArray(),
      "local world point:",worldPoint.toArray(),
      "camera view:",this.camera.viewMatrix,
      "projection:",this.camera.projectionMatrix);
    }
    if(projected.toArray().every(Number.isFinite)){
     this.geoScreenMarker.position.set(projected.x,projected.y,0);
     this.renderer3.render(this.geoScreenScene,this.screenCamera);
     onStatus("Geo probe: yellow mark = model position projected with ArcGIS camera. NDC "+projected.toArray().map(v=>v.toFixed(2)).join(", "));
    } else onStatus("Geo probe: camera projection produced non-finite values.");
    this.resetWebGLState();
    return output;
   }
   this.root.updateMatrixWorld(true);
   const center3D=this.debugCube.getWorldPosition(new THREE.Vector3());
   const ndc3D=center3D.clone().project(this.camera3);
   if(now-(this.lastGeometryReport||0)>750){
    this.lastGeometryReport=now;
    const inside=Number.isFinite(ndc3D.x)&&Number.isFinite(ndc3D.y)&&Number.isFinite(ndc3D.z)
      &&Math.abs(ndc3D.x)<=1&&Math.abs(ndc3D.y)<=1&&Math.abs(ndc3D.z)<=1;
    onStatus("Cube NDC "+ndc3D.toArray().map(v=>v.toFixed(3)).join(", ")
       +" | "+(inside?"IN frustum":"OUT of frustum")
       +" | "+(groundElevation===null?"DEM pending":"DEM "+groundElevation.toFixed(1)+"m"));
   }
   if(!this.loggedViewport){
    this.loggedViewport=true;
    console.info("[Skeleton] viewport",Array.from(viewport),"canvas",gl.canvas.width,gl.canvas.height,"camera",this.camera);
   }
   if(viewport[2]>0 && viewport[3]>0){
    if(!this.reported3DGeometry){
     this.reported3DGeometry=true;
     this.root.updateMatrixWorld(true);
     const center=this.debugCube.getWorldPosition(new THREE.Vector3());
     const ndc=center.clone().project(this.camera3);
     const clipMatrix=new THREE.Matrix4().multiplyMatrices(this.camera3.projectionMatrix,this.camera3.matrixWorldInverse);
     console.info("[Skeleton] world cube center",center.toArray(),"NDC",ndc.toArray(),
       "root scale",this.root.scale.toArray(),"camera determinant",clipMatrix.determinant(),
       "frustumCulled",this.debugCube.frustumCulled);
     onStatus("3D debug cube NDC: "+ndc.toArray().map(n=>n.toFixed(3)).join(", "));
    }
    this.renderer3.setViewport(viewport[0],viewport[1],viewport[2],viewport[3]);
    this.renderer3.render(threeProbe?this.screenScene:this.scene3,threeProbe?this.screenCamera:this.camera3);
    if(!threeProbe && now-(this.lastDrawReport||0)>1500){
     this.lastDrawReport=now;
     console.info("[Skeleton] scene draw calls",this.renderer3.info.render.calls,"cube",this.debugCube.position.toArray(), "cube indexed", Boolean(this.debugCube.geometry.index), "gl error", gl.getError());
    }
    if(threeProbe&&!this.reportedThreeProbe){this.reportedThreeProbe=true;onStatus("Three.js probe active: cyan rectangle should appear in the viewport.");}
   } else if(!this.invalidViewportReported){
    this.invalidViewportReported=true;
    onStatus("Rendering paused: ArcGIS output viewport is zero-sized.");
   }
   this.resetWebGLState();
   if(motion.running)this.requestRender();
   return output;
  },
  destroy() {
   this.disposed=true;
   this.animator?.dispose();
   this.placementProbeMesh?.geometry.dispose();
   this.placementProbeMesh?.material.dispose();
   this.worldProbeMesh?.geometry.dispose();
   this.worldProbeMesh?.material.dispose();
   this.debugCube?.geometry.dispose();
   this.debugCube?.material.dispose();
   this.marker?.geometry.dispose();
   this.marker?.material.dispose();
   this.renderer3?.dispose();
  }
 });
 const node=new Node({view});
 return {
  node,
  async focus(){
   const anchor=new Point({
    x:route[0][0],y:route[0][1],
    z:(groundElevation??0)+35,
    spatialReference:SR
   });
   await view.goTo({target:anchor,scale:850,heading:0,tilt:65},{animate:false});
   node.requestRender();
   onStatus("Focus requested; wait for live cube NDC in status.");
  },
  start(){motion.start();node.lastTime=performance.now();onStatus(motion.running?"Start pressed — waiting for render frames…":"Route finished — press Reset");node.requestRender();},pause(){motion.pause();onStatus(`Paused at ${motion.distance.toFixed(1)} m`);node.requestRender();},reset(){motion.reset();node.completionReported=false;onStatus("Reset: ready to start");node.requestRender();},setSpeed(speed){if(Number.isFinite(speed)&&speed>=0)motion.speed=speed;node.requestRender();}};
}
