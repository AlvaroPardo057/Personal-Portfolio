import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {landmarkModel,character} from '../src/models.js';
const renderer=new T.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.setScissorTest(true);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;document.body.append(renderer.domElement);
const pmrem=new T.PMREMGenerator(renderer),studio=new RoomEnvironment(),environment=pmrem.fromScene(studio,.04).texture;studio.dispose();pmrem.dispose();
const ids=['f1','power-plant','library','notebook','bike','phone','guide','visitor'];
const cells=ids.map((id,i)=>{
 const s=new T.Scene();s.background=new T.Color(i%2?0xe5e9e6:0xf1f1e9);s.environment=environment;s.environmentIntensity=.65;s.add(new T.HemisphereLight(0xe9f3ff,0x87957b,1.8));const light=new T.DirectionalLight(0xfff2e3,2.6);light.position.set(-3,8,6);s.add(light);
 const object=i<6?landmarkModel(id):character(id==='guide');s.add(object);
 const c=new T.PerspectiveCamera(36,(innerWidth/4)/(innerHeight/2),.1,50);
 if(i>=6){c.position.set(.65,1.8,4.45);c.lookAt(0,1.1,0);}else{c.position.set(id==='bike'?.8:id==='f1'?-4:3,4.3,10);c.lookAt(0,1.6,0);}
 const label=document.createElement('label');label.style.left=`${i%4*25}%`;label.style.top=`${Math.floor(i/4)*50}%`;label.innerHTML=`${id}<small>Original procedural model</small>`;document.body.append(label);
 return{s,c,object};
});
function draw(){const w=innerWidth/4,h=innerHeight/2;cells.forEach(({s,c},i)=>{renderer.setViewport((i%4)*w,innerHeight-(Math.floor(i/4)+1)*h,w,h);renderer.setScissor((i%4)*w,innerHeight-(Math.floor(i/4)+1)*h,w,h);renderer.render(s,c);});}
draw();window.modelReview={cells,renderer,draw};
