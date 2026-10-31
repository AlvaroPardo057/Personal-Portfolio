import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {landmarkModel} from '../src/models.js';
const entries=[['f1','f1.png','Fórmula 1'],['power-plant','Power_Plant.png','Central eléctrica'],['library','Library.png','Biblioteca en construcción'],['notebook','Notebook.png','Cuaderno y cerebro'],['bike','Bike.png','Bicicleta de contrarreloj'],['phone','Phone.png','Teléfono plegable']];
const renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
renderer.setSize(800,400);renderer.setPixelRatio(1.5);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
const studio=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer),env=pmrem.fromScene(studio,.035).texture;studio.dispose();pmrem.dispose();
const scenes=[];
for(const [id,file,title] of entries){
  const ref=document.createElement('section');ref.innerHTML=`<label>${title} · referencia</label><img src="/references/${file}" alt="${title}">`;document.querySelector('main').append(ref);
  const cell=document.createElement('section');cell.innerHTML=`<label>${title} · 3D</label>`;document.querySelector('main').append(cell);
  const s=new T.Scene();s.background=new T.Color(0xe9e6df);s.environment=env;s.environmentIntensity=.65;
  s.add(new T.HemisphereLight(0xf2f7ff,0x7d7367,1.05));
  const light=new T.DirectionalLight(0xfff1df,2.6);light.position.set(-4,7,5);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-5,right:5,top:5,bottom:-5,far:20});light.shadow.normalBias=.025;s.add(light);
  const object=landmarkModel(id);s.add(object);const box=new T.Box3().setFromObject(object),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
  const plane=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0xe9e6df,roughness:1}));plane.rotation.x=-Math.PI/2;plane.position.y=-.015;plane.receiveShadow=true;s.add(plane);
  const c=new T.PerspectiveCamera(32,2,.1,100);
  const offsets={f1:[-3,1.6,7], 'power-plant':[2,1.8,8],library:[2.5,1.75,8],notebook:[1.5,3.2,8],bike:[.25,1.0,8],phone:[-1.8,.5,8]};
  const direction=new T.Vector3(...offsets[id]).normalize();let distance=Math.max(size.y,size.x/2)*2.0+.7;
  for(let step=0;step<12;step++){
    c.position.copy(center).addScaledVector(direction,distance);c.lookAt(center);c.updateMatrixWorld(true);
    let extent=0;for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).project(c);extent=Math.max(extent,Math.abs(p.x)/.88,Math.abs(p.y)/.81);}
    if(extent<=1)break;distance*=Math.max(1.03,extent);
  }
  renderer.render(s,c);const img=document.createElement('img');img.src=renderer.domElement.toDataURL('image/png');img.style.padding='0';img.alt=title+' reconstrucción 3D';cell.append(img);scenes.push({id,object});
}
window.referenceReview={scenes};
