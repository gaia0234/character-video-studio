import React, {useMemo} from 'react';
import {AbsoluteFill,Audio,Sequence,staticFile,useCurrentFrame,interpolate} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {PriusNHW10Model} from './PriusNHW10Model';
import {useStudioFont} from '../ToyotaV3VisualFrame';
const c={ink:'#293747',white:'#FFFCF5'};
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const ramp=(f:number,a:number,b:number)=>interpolate(f,[a,b],[0,1],clamp);
const smooth=(f:number,a:number,b:number)=>{const t=ramp(f,a,b);return t*t*(3-2*t);};
const CUES = [
  {start: 12, end: 111, lines: ['試作車を走らせるまでに、', '49日かかった。']},
  {start: 111, end: 270, lines: ['開発に携わった小木曽聡氏が、', '後の取材で語っている。']},
  {start: 270, end: 513, lines: ['ある日、一度に解決したのではない。部品や制御を直し、', '短い距離を走れるようになり、少しずつ改善した。']},
  {start: 513, end: 672, lines: ['それでも走りはぎこちなく、', '500メートルほど進むと、また止まった。']},
  {start: 672, end: 825, lines: ['商品には、', 'ほど遠かった。']},
];

const ChapterTag = () => (
  <div data-check-id="chapter-tag" style={{position: 'absolute', top: 36, left: 55,
    background: c.ink, color: c.white, borderRadius: 999, padding: '10px 22px',
    fontSize: 26, fontWeight: 800, whiteSpace: 'nowrap'}}>第2章　49日</div>
);

const SubtitleBand = ({lines}: {lines: string[]}) => (
  <div data-check-id="subtitle-band" style={{position: 'absolute', bottom: 32, left: 95, right: 95,
    display: 'flex', justifyContent: 'center'}}>
    <div style={{background: '#26313FF7', color: c.white, borderRadius: 18, padding: '18px 36px 20px',
      maxWidth: 1720, boxShadow: '0 10px 28px #1D253040'}}>
      <div data-check-id="subtitle-text" style={{textAlign: 'center'}}>
        {lines.map((line, i) => (
          <div key={i} style={{fontSize: 46, fontWeight: 800, lineHeight: 1.4, letterSpacing: '0.01em',
            whiteSpace: 'nowrap'}}>{line}</div>
        ))}
      </div>
    </div>
  </div>
);

type V=[number,number,number];
const gradient=new THREE.DataTexture(new Uint8Array([85,170,255]),3,1,THREE.RedFormat);
gradient.minFilter=gradient.magFilter=THREE.NearestFilter;gradient.needsUpdate=true;
const Box=({p,size,color,rotation=[0,0,0]}:{p:V;size:V;color:string;rotation?:V})=>{
 const g=useMemo(()=>new THREE.BoxGeometry(...size),[size.join(',')]);
 const edges=useMemo(()=>{const e=new THREE.EdgesGeometry(g);const geometry=new LineSegmentsGeometry();geometry.setPositions(e.getAttribute('position').array as Float32Array);const material=new LineMaterial({color:'#293747',linewidth:3,resolution:new THREE.Vector2(1920,1080)});return new LineSegments2(geometry,material);},[g]);
 return <group position={p} rotation={rotation}><mesh geometry={g}><meshToonMaterial color={color} gradientMap={gradient}/></mesh><primitive object={edges}/></group>;
};
const inheritedShot=(f:number)=>{
 const a=smooth(f,105,117),b=smooth(f,264,276),d=smooth(f,507,519),e=smooth(f,660,700);
 const carX=f<276?0:f<513?interpolate(f,[276,320,340,380,400,440,460,507], [0,-.5,-.5,-1.3,-1.3,-2.5,-2.5,-2.5],clamp): -2.5-2.0*ramp(f,519,636)+ (f<636?.025*Math.sin(f*.9):0);
 const targets:V[]=[[0,2.0,0],[0,2.3,0],[carX,0,0],[carX,.75,0],[carX-5,1.6,0]];
 const positions:V[]=[[7,5,13],[0,2.3,14],[carX,16,.001],[carX,.75,15],[carX+12,8,-14]];
 let target=new THREE.Vector3(...targets[0]),pos=new THREE.Vector3(...positions[0]),span=8.3;
 [[a,1,7.0],[b,2,4.0],[d,3,3.5],[e,4,13+1.5*ramp(f,700,824)]].forEach(([t,i,s])=>{target.lerp(new THREE.Vector3(...targets[i]),t);pos.lerp(new THREE.Vector3(...positions[i]),t);span=THREE.MathUtils.lerp(span,s,t);});
 // A subtle continuous dolly avoids static intervals during explanatory holds.
 span*=1-.012*Math.sin(f*.012);
 const camera=new THREE.OrthographicCamera(-span*1920/1080/2,span*1920/1080/2,span/2,-span/2,.01,250);
 Object.assign(camera,{manual:true});camera.position.copy(pos);camera.up.set(0,1,0);camera.lookAt(target);camera.setViewOffset(1920,1080,0,110,1920,1080);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 return {camera,carX,leaf:a,page:b};
};
export const progressX=(f:number)=>interpolate(f,[276,285,325,350,390,415,460,507],[1.25,1.25,.8,.8,0,0,-1.25,-1.25],clamp);
const acceptedShot=(f:number)=>{
 if(f>=519)return {...inheritedShot(f),span:3.5};
 const a=smooth(f,108,111),b=smooth(f,267,270),d=smooth(f,507,519);
 const camera=new THREE.OrthographicCamera();Object.assign(camera,{manual:true});
 let span=6.5-.3*ramp(f,0,105),target=new THREE.Vector3(1.1,1.6,0),position=new THREE.Vector3(1.1,3.8,13);
 if(f>=105){target.lerp(new THREE.Vector3(13,1.4,12),a);position.lerp(new THREE.Vector3(13,11,18),a);span=THREE.MathUtils.lerp(span,5.6-.6*ramp(f,117,264),a);}
 if(f>=267){target.lerp(new THREE.Vector3(0,0,0),b);position.lerp(new THREE.Vector3(0,16,-.001),b);span=THREE.MathUtils.lerp(span,4.05,b);}
 let carX=f<267?0:progressX(f);
 if(f>=507){const inherited=inheritedShot(f);carX=THREE.MathUtils.lerp(-1.25,inherited.carX,d);target.set(carX*smooth(f,507,510),.75*d,0);
 const elevation=(1-d)*Math.PI/2,azimuth=Math.PI*(1-smooth(f,507,513)),radius=15.25;
 position.set(target.x+Math.sin(azimuth)*Math.cos(elevation)*radius,target.y+Math.sin(elevation)*radius,target.z+Math.cos(azimuth)*Math.cos(elevation)*radius);
 span=THREE.MathUtils.lerp(4.05,3.5,d)+4*Math.sin(Math.PI*d);}
 camera.left=-span*1920/1080/2;camera.right=-camera.left;camera.top=span/2;camera.bottom=-span/2;camera.near=.01;camera.far=250;
 camera.position.copy(position);camera.up.set(0,1,0);camera.lookAt(target);camera.setViewOffset(1920,1080,0,110,1920,1080);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 if(f>=507&&f<519){
  // Fit the rigid car through the orbit; account for its off-axis position, not just its height.
  let fit=1;for(const x of [carX-2.138,carX+2.138])for(const y of [0,1.49])for(const z of [-.848,.848]){const p=new THREE.Vector3(x,y,z).project(camera),sx=(p.x+1)*960,sy=(1-p.y)*540;fit=Math.max(fit,(960-sx)/880,(sx-960)/880,(430-sy)/320,(sy-430)/390);}
  span*=fit;camera.left=-span*1920/1080/2;camera.right=-camera.left;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();
 }
 return {camera,carX,leaf:a,page:b,span};
};
// Fixed azimuth: the front remains screen-right from overhead to the negative-Z side.
const previousShot=(f:number)=>{
 if(f<501||f>=660)return acceptedShot(f);
 const d=smooth(f,501,525),legacy=inheritedShot(f),carX=THREE.MathUtils.lerp(progressX(f),legacy.carX,d);
 const target=new THREE.Vector3(THREE.MathUtils.lerp(0,carX-.25,d),.75*d,0),radius=THREE.MathUtils.lerp(16,15,d),elevation=(1-d)*Math.PI/2;
 const position=new THREE.Vector3(target.x,target.y+Math.sin(elevation)*radius,-Math.max(.001,Math.cos(elevation)*radius));
 let span=THREE.MathUtils.lerp(4.05,3.5*(1-.012*Math.sin(f*.012)),d);
 const camera=new THREE.OrthographicCamera(-span*1920/1080/2,span*1920/1080/2,span/2,-span/2,.01,250);Object.assign(camera,{manual:true});
 camera.position.copy(position);camera.up.set(0,1,0);camera.lookAt(target);camera.setViewOffset(1920,1080,0,110,1920,1080);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 let fit=1;for(const x of [carX-2.138,carX+2.138])for(const y of [0,1.49])for(const z of [-.848,.848]){const p=new THREE.Vector3(x,y,z).project(camera),sx=(p.x+1)*960,sy=(1-p.y)*540;fit=Math.max(fit,(960-sx)/900,(sx-960)/900,(430-sy)/330,(sy-430)/400);}
 if(fit>1){span*=fit;camera.left=-span*1920/1080/2;camera.right=-camera.left;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();}
 return {camera,carX,leaf:1,page:1,span};
};
// Stay on the negative-Z (left) side and orbit toward the accepted rear-left view.
// The car is already stopped; only the camera changes in this bounded interval.
export const shot=(f:number)=>{
 if(f<=640||f>=700)return previousShot(f);
 const t=smooth(f,640,700),start=previousShot(640),end=previousShot(700),carX=start.carX;
 const target=new THREE.Vector3(THREE.MathUtils.lerp(carX-.25,carX-5,t),THREE.MathUtils.lerp(.75,1.6,t),0);
 const angle=Math.atan2(17,14)*t,radius=THREE.MathUtils.lerp(15,Math.hypot(17,14),t);
 const position=new THREE.Vector3(target.x+Math.sin(angle)*radius,target.y+6.4*t,-Math.cos(angle)*radius);
 const span=THREE.MathUtils.lerp(start.camera.top*2,end.camera.top*2,t);
 const camera=new THREE.OrthographicCamera(-span*1920/1080/2,span*1920/1080/2,span/2,-span/2,.01,250);Object.assign(camera,{manual:true});
 camera.position.copy(position);camera.up.set(0,1,0);camera.lookAt(target);camera.setViewOffset(1920,1080,0,110,1920,1080);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 return {camera,carX,leaf:1,page:1,span};
};
export const paperPose=(f:number)=>{const a=smooth(f,108,111);return {position:new THREE.Vector3(3.5+9.5*a,1.65-.19*a,12*a),rotation:new THREE.Euler(-Math.PI/2*a,0,0),scale:new THREE.Vector3(.36+.64*a,.92+.08*a,1)};};
const paperMatrix=(f:number)=>{const p=paperPose(f);return new THREE.Matrix4().compose(p.position,new THREE.Quaternion().setFromEuler(p.rotation),p.scale);};
const leafAngle=(f:number)=>f<105&&f>=24&&f<70?-Math.abs(Math.sin((f-24)*.45))*1.1:0;
const Person=()=> <group position={[-2.9,0,-.6]}>
 <mesh position={[0,1.02,0]}><sphereGeometry args={[.115,12,8]}/><meshToonMaterial color="#9AA5AE" gradientMap={gradient}/></mesh>
 <mesh position={[0,.68,0]}><cylinderGeometry args={[.18,.15,.48,8]}/><meshToonMaterial color="#66879B" gradientMap={gradient}/></mesh>
 {[-1,1].map(side=><group key={side}>
 <mesh position={[side*.19,.83,0]}><sphereGeometry args={[.09,8,6]}/><meshToonMaterial color="#66879B" gradientMap={gradient}/></mesh>
 <mesh position={[side*.24,.63,0]} rotation={[0,0,side*.12]}><cylinderGeometry args={[.07,.06,.34,8]}/><meshToonMaterial color="#66879B" gradientMap={gradient}/></mesh>
 <mesh position={[side*.08,.24,0]}><cylinderGeometry args={[.075,.06,.43,8]}/><meshToonMaterial color="#293747" gradientMap={gradient}/></mesh>
 <Box p={[side*.08,.035,.045]} size={[.13,.07,.21]} color="#293747"/>
 </group>)}
 </group>;
const Paper=({f}:{f:number})=>{const p=paperPose(f);return <group position={p.position} rotation={p.rotation} scale={p.scale}>
 <Box p={[0,0,-.08]} size={[4.4,3,.12]} color="#85694C"/>
 <Box p={[-1.05,0,.01]} size={[2.05,2.8,.07]} color="#FFFCF5"/>
 <Box p={[1.05,0,.01]} size={[2.05,2.8,.07]} color="#FFFCF5"/>
 {f<111&&<group position={[-2.1,1.4,.08]} rotation={[leafAngle(f),0,0]}><Box p={[2.1,-1.4,0]} size={[4.2,2.8,.03]} color="#FFFCF5"/></group>}
 {f>=111&&<Box p={[0,0,.08]} size={[.04,2.8,.04]} color="#D9AB56"/>}
 {f>=117&&Array.from({length:8},(_,i)=>{const draw=ramp(f,125+i*14,139+i*14);return draw<=0?null:<Box key={i} p={[-1.7+.68*draw,.94-i*.25,.08]} size={[Math.max(.001,1.36*draw),.025,.015]} color="#82949F"/>;})}
 {f>=117&&Array.from({length:7},(_,i)=>{const draw=ramp(f,153+i*14,167+i*14);return draw<=0?null:<Box key={i} p={[.35+.68*draw,.9-i*.26,.08]} size={[Math.max(.001,1.36*draw),.025,.015]} color="#82949F"/>;})}
 </group>;};
const Wipe=({f}:{f:number})=>{
 const first=f>=105&&f<=117,second=f>=264&&f<=276;if(!first&&!second)return null;
 const s=shot(f);let w:number,h:number,cx=0;
 if(first){const t=smooth(f,105,108);w=THREE.MathUtils.lerp(1.58,s.span*1920/1080*1.4,t);h=THREE.MathUtils.lerp(2.576,s.span*1.4,t);cx=2.4*(1-t);}
 else {const expand=.46+.94*smooth(f,264,268);w=s.span*1920/1080*expand;h=s.span*1.4*expand;}
 const pos=new THREE.Vector3(cx-w/2,0,-3).applyMatrix4(s.camera.matrixWorld),turn=smooth(f,first?111:270,first?117:276);
 return <group position={pos} quaternion={s.camera.quaternion}><group rotation={[0,-turn*Math.PI/2,0]}><Box p={[w/2,0,0]} size={[w,h,.025]} color="#FFFCF5"/>{second&&Array.from({length:7},(_,i)=><Box key={i} p={[w*.52,h*.3-i*h*.09,.02]} size={[w*.65,.02,.01]} color="#A8B4BF"/>)}</group></group>;
};
const Repair=({x,scale,angle}:{x:number;scale:number;angle:number})=><group position={[x,.1,-1.28]} scale={scale} rotation={[0,angle,0]}>
 <Box p={[.12,.08,0]} size={[.55,.08,.09]} color="#D9AB56"/><Box p={[-.19,.08,0]} size={[.09,.08,.36]} color="#D9AB56"/>
 {[-.15,.15].map(z=><Box key={z} p={[-.32,.08,z]} size={[.22,.08,.09]} color="#D9AB56"/>)}
 <mesh position={[.42,.08,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.11,.035,6,16]}/><meshToonMaterial color="#D9AB56" gradientMap={gradient}/></mesh>
 </group>;
const Road=({f}:{f:number})=>{const s=shot(f),d=smooth(f,501,525);return <> <Box p={[-13-d,-.015,0]} size={[38-4*d,.06,5.6]} color="#64717A"/>
 {(f<501?[-2,0,2]:Array.from({length:15},(_,i)=>4-i*2.4)).map(x=><Box key={x} p={[x,.025,0]} size={[1.2,.02,.06]} color="#DFCE9E"/>)}
 <group visible={f>=501}><Box p={[-6.2,.75,-1.9]} size={[.08,1.5,.08]} color="#C7D0D5"/>
 <Box p={[-6.2,1.55,-1.9]} size={[1.05,.42,.14]} color="#F2D68C"/>
 <group position={[-22,0,0]} scale={.4}>
 <Box p={[0,1.4,0]} size={[4,2.8,4]} color="#C3AD81"/>
 <Box p={[2.06,1.4,0]} size={[.1,1.5,3.4]} color="#86A4AC"/>
 <Box p={[0,3.15,0]} size={[4.6,.5,4.4]} color="#D9AB56"/>
 <Box p={[3,2.5,3]} size={[.12,5,.12]} color="#657F92"/><Box p={[3,4.8,3]} size={[.18,1,2]} color="#D9AB56"/>
 </group>
 {f>=636&&f<690&&Array.from({length:3},(_,i)=><mesh key={i} position={[s.carX-1.8-i*.2,.9+ramp(f,636,690)*(1+i*.3),0]} scale={.08+.16*ramp(f,636,690)}><icosahedronGeometry args={[1,1]}/><meshToonMaterial color="#ADB6BD" transparent opacity={1-ramp(f,650,690)} gradientMap={gradient}/></mesh>)}</group></>;};
const World=({f}:{f:number})=>{const s=shot(f);return <>
 <ambientLight intensity={f<105?.55+.35*ramp(f,0,20):.85+.15*Math.sin(f*.02)}/><directionalLight position={[-4,10,8]} intensity={2} color="#F8DFAB"/>
 <Box p={[0,-.2,0]} size={[110,.3,70]} color="#344458"/>
 <group visible={f<108}>
 <Box p={[0,1.85,-3.5]} size={[12,3.7,.25]} color="#24344C"/>
 {[-6,6].map(x=><Box key={x} p={[x,1.85,0]} size={[.22,3.7,7]} color="#30435B"/>)}
 <Box p={[0,3.7,0]} size={[12,.18,7]} color="#233146"/>
 {[-3,0,3].map(x=><group key={x}><Box p={[x,3.35,1]} size={[.035,.6,.035]} color="#60788D"/><mesh position={[x,3.0,1]}><boxGeometry args={[2.1,.09,.35]}/><meshBasicMaterial color="#F2D68C"/></mesh></group>)}
 {[-2.5,1].map(x=><Box key={x} p={[x,1.6,-3.32]} size={[2.9,2.6,.07]} color="#3A5068"/>)}
 <Person/>
 </group>
 <group visible={f>=111&&f<268}>
 <Box p={[13,1.25,12]} size={[6,.18,4]} color="#806B52"/>
 {[-2.6,2.6].flatMap(x=>[-1.6,1.6].map(z=><Box key={`${x}-${z}`} p={[13+x,.6,12+z]} size={[.15,1.2,.15]} color="#536575"/>))}
 </group>
 {f<268&&<Paper f={f}/>}
 <group visible={f<118||f>=267} position={[s.carX,0,0]}><PriusNHW10Model/></group>
 {f>=267&&f<525&&<group>
 {[.8,0,-1.25].map((x,i)=>{const start=[1.25,.8,0][i],t=ramp(f,[325,390,460][i],[336,401,471][i])*(1-smooth(f,501,525));return t<=0?null:<group key={i}>
 <Repair x={x} scale={.35*t} angle={Math.sin(f*.15+i)*.12}/>
 <Box p={[(start+x)/2,.06,-1.02]} size={[Math.max(.001,Math.abs(start-x)*t),.025,.035]} color="#D9AB56"/>
 {[start,x].map((u,j)=><Box key={j} p={[u,.06,-1.02]} size={[.035,.025,.19*t+.001]} color="#D9AB56"/>)}
 </group>;})}
 </group>}
 {f>=267&&<Road f={f}/>}
 <Wipe f={f}/>
 </>;};
export const ToyotaCh2FortyNineDaysR10f=()=>{
 useStudioFont();const f=useCurrentFrame();const s=shot(f);const cue=CUES.find(q=>f>=q.start&&f<q.end);
 const milestone=new THREE.Vector3(-6.2,1.55,-1.82).project(s.camera);
 const paper=paperMatrix(f).multiply(new THREE.Matrix4().makeTranslation(-2.1,1.4,.1)).multiply(new THREE.Matrix4().makeRotationX(leafAngle(f)));
 const pp=(x:number,y:number)=>{const p=new THREE.Vector3(x,y,0).applyMatrix4(paper).project(s.camera);return new THREE.Vector2((p.x+1)*960,(1-p.y)*540);};
 const origin=pp(0,0),right=pp(4.2,0).sub(origin).divideScalar(500),down=pp(0,-2.8).sub(origin).divideScalar(700);
 const numberTransform=`matrix(${right.x},${right.y},${down.x},${down.y},${origin.x},${origin.y})`;
 const day=Math.min(49,Math.max(1,Math.round(1+48*Math.pow(ramp(f,24,70),3))));
 return <AbsoluteFill style={{background:'#17202E',fontFamily:'"Studio Noto Sans JP", sans-serif'}}>
 <Sequence from={12}><Audio src={staticFile('audio/toyota-v19-chapter2-20261029/v19-ch2-09.wav')}/></Sequence>
 <ThreeCanvas width={1920} height={1080} camera={s.camera} gl={{antialias:true}}><World f={f}/></ThreeCanvas>
 {f<111&&<div style={{position:'absolute',left:0,top:0,width:500,height:700,display:'flex',alignItems:'center',justifyContent:'center',transform:numberTransform,transformOrigin:'0 0',fontSize:220,fontWeight:900,lineHeight:1.2,color:c.ink,opacity:1-smooth(f,105,108)}}>{day}</div>}
 {f>=117&&f<264&&<div style={{position:'absolute',left:470,top:136,width:980,textAlign:'center'}}><div style={{display:'inline-block',background:'#FBFCFD',border:`4px solid ${c.ink}`,borderRadius:14,padding:'12px 26px',fontSize:38,fontWeight:800,color:c.ink,boxShadow:'0 8px 0 #29374718'}}>開発担当・小木曽聡氏の証言</div><div style={{width:110,height:4,background:'#D9AB56',margin:'10px auto 0',borderRadius:2}}/></div>}
 {f>=600&&f<660&&<div style={{position:'absolute',left:(milestone.x+1)*960-105,top:(1-milestone.y)*540-33,width:210,textAlign:'center',fontSize:46,fontWeight:900,color:c.ink}}>500m</div>}
 <ChapterTag/>{cue&&<div style={{opacity:ramp(f,cue.start,cue.start+4)}}><SubtitleBand lines={cue.lines}/></div>}
 <AbsoluteFill style={{background:'#0B0F16',opacity:Math.max(1-ramp(f,0,20),ramp(f,808,824)),pointerEvents:'none'}}/>
 </AbsoluteFill>;
};
