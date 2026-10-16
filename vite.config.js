import {defineConfig} from "vite";
import {readFile,stat} from "node:fs/promises";
import {resolve} from "node:path";

const soldier=resolve(import.meta.dirname,"models/Soldier.glb");
const url="/models/Soldier.glb";
export default defineConfig({
 base:"./",
 plugins:[{
  name:"soldier-model-from-repository",
  configureServer(server){
   server.middlewares.use(async(req,res,next)=>{
    if((req.url||"").split("?")[0]!==url)return next();
    try {
     const info=await stat(soldier);
     res.setHeader("Content-Type","model/gltf-binary");
     res.setHeader("Content-Length",info.size);
     res.end(await readFile(soldier));
    }catch(error){next(error);}
   });
  },
  async generateBundle(){
   const bytes=await readFile(soldier);
   this.emitFile({type:"asset",fileName:"models/Soldier.glb",source:bytes});
  }
 }]
});
