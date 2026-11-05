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
// Coordinates in metres: the calendar leaf and notebook are the same hinged object.
export const shot=(f:number)=>{
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
const pageAngleFor=(f:number,page:number)=>-Math.PI*page*.97-(f>=24&&f<70?Math.abs(Math.sin((f-24)*.45))*1.4:0);
const World=({f}:{f:number})=>{
 const s=shot(f);const pageAngle=pageAngleFor(f,s.page);
 return <>
 <ambientLight intensity={.85+.15*Math.sin(f*.02)}/><directionalLight position={[-4,10,8]} intensity={2} color="#F8DFAB"/>
 <Box p={[0,-.2,0]} size={[110,.3,70]} color="#344458"/>
 {/* Test hall remains behind the opening's car and calendar. */}
 <group visible={f<264}><Box p={[0,3,-5]} size={[18,6,.3]} color="#24344C"/>
 {[-7,0,7].map(x=><Box key={x} p={[x,3,-4.8]} size={[.2,6,.3]} color="#60788D"/>)}
 <Box p={[-1,5.6,-4.5]} size={[7,.16,.3]} color="#F2D68C"/></group>
 <group position={[2.5*(1-s.leaf),2.3,1.4]} rotation={[-s.leaf*.15,0,0]} scale={[(.55+.45*s.leaf)*(1-s.page),(1.2-.2*s.leaf)*(1-s.page),1-s.page]}>
 <Box p={[0,0,-.1]} size={[5,3.6,.25]} color="#85694C"/>
 <Box p={[-1.24,0,.08]} size={[2.42,3.4,.08]} color="#FFFCF5"/>
 <group position={[-2.45,1.65,.15]} rotation={[pageAngle,0,0]}><Box p={[2.45,-1.65,0]} size={[4.9,3.3,.04]} color="#FFFCF5"/></group>
 {f>=111&&Array.from({length:6},(_,i)=><Box key={i} p={[.8,.9-i*.36,.2]} size={[1.8,.025,.015]} color="#A8B4BF"/>)}
 {f>=111&&<Box p={[0,0,.22]} size={[.035,3.3,.025]} color="#D9AB56"/>}
 </group>
 {/* One shared car, never cross-faded into a second copy. */}
 <group position={[s.carX,0,0]}><PriusNHW10Model/></group>
 {/* Road, repair marks, milestone and distant dealership live in the same world. */}
 <Box p={[-14,-.015,0]} size={[34,.06,5.6]} color="#64717A"/>
 {Array.from({length:15},(_,i)=><Box key={i} p={[4-i*2.4,.025,0]} size={[1.2,.02,.06]} color="#DFCE9E"/>)}
 {[-.5,-1.3,-2.5].map((x,i)=><group key={i} position={[x,.1,1.25]} scale={.65*ramp(f,[320,380,440][i],[330,390,450][i])*(1-smooth(f,507,519))}>
 <Box p={[.12,.08,0]} size={[.55,.08,.09]} color="#D9AB56"/>
 <Box p={[-.19,.08,0]} size={[.09,.08,.36]} color="#D9AB56"/>
 {[-.15,.15].map(z=><Box key={z} p={[-.32,.08,z]} size={[.22,.08,.09]} color="#D9AB56"/>)}
 <mesh position={[.42,.08,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.11,.035,6,16]}/><meshToonMaterial color="#D9AB56" gradientMap={gradient}/></mesh>
 </group>)}
 <Box p={[-6.2,.75,-1.9]} size={[.08,1.5,.08]} color="#C7D0D5"/>
 <Box p={[-6.2,1.55,-1.9]} size={[1.05,.42,.14]} color="#F2D68C"/>
 <group position={[-22,0,0]} scale={.4}>
 <Box p={[0,1.4,0]} size={[4,2.8,4]} color="#C3AD81"/>
 <Box p={[2.06,1.4,0]} size={[.1,1.5,3.4]} color="#86A4AC"/>
 <Box p={[0,3.15,0]} size={[4.6,.5,4.4]} color="#D9AB56"/>
 <Box p={[3,2.5,3]} size={[.12,5,.12]} color="#657F92"/><Box p={[3,4.8,3]} size={[.18,1,2]} color="#D9AB56"/>
 </group>
 {/* Anonymous, small worker seen from behind, no face. */}
 <group position={[3,0,-2]}><Box p={[0,.6,0]} size={[.4,.65,.23]} color="#6C879B"/><Box p={[0,1.1,0]} size={[.27,.27,.25]} color="#A0ABB5"/>{[-.12,.12].map(x=><Box key={x} p={[x,.2,0]} size={[.12,.4,.16]} color="#293747"/>)}</group>
 {f>=636&&f<690&&Array.from({length:3},(_,i)=><mesh key={i} position={[s.carX-1.8-i*.2,.9+ramp(f,636,690)*(1+i*.3),0]} scale={.08+.16*ramp(f,636,690)}><icosahedronGeometry args={[1,1]}/><meshToonMaterial color="#ADB6BD" transparent opacity={1-ramp(f,650,690)} gradientMap={gradient}/></mesh>)}
 </>;
};
export const ToyotaCh2FortyNineDaysR10=()=>{
 useStudioFont();const f=useCurrentFrame();const s=shot(f);const cue=CUES.find(q=>f>=q.start&&f<q.end);
 const milestone=new THREE.Vector3(-6.2,1.55,-1.82).project(s.camera);
 // The 2D number is affinely projected onto the rotating 3D paper (orthographic camera).
 const paperParent=new THREE.Matrix4().compose(new THREE.Vector3(2.5*(1-s.leaf),2.3,1.4),new THREE.Quaternion().setFromEuler(new THREE.Euler(-s.leaf*.15,0,0)),new THREE.Vector3((.55+.45*s.leaf)*(1-s.page),(1.2-.2*s.leaf)*(1-s.page),1-s.page));
 const paper=paperParent.multiply(new THREE.Matrix4().makeTranslation(-2.45,1.65,.175)).multiply(new THREE.Matrix4().makeRotationX(pageAngleFor(f,s.page)));
 const projectPaper=(x:number,y:number)=>{const p=new THREE.Vector3(x,y,0).applyMatrix4(paper).project(s.camera);return new THREE.Vector2((p.x+1)*960,(1-p.y)*540);};
 const origin=projectPaper(0,0),right=projectPaper(4.9,0).sub(origin).divideScalar(500),down=projectPaper(0,-3.3).sub(origin).divideScalar(700);
 const numberTransform=`matrix(${right.x},${right.y},${down.x},${down.y},${origin.x},${origin.y})`;
 const day=Math.min(49,Math.max(1,Math.round(1+48*Math.pow(ramp(f,24,70),3))));
 return <AbsoluteFill style={{background:'#17202E',fontFamily:'"Studio Noto Sans JP", sans-serif'}}>
 <Sequence from={12}><Audio src={staticFile('audio/toyota-v19-chapter2-20261029/v19-ch2-09.wav')}/></Sequence>
 <ThreeCanvas width={1920} height={1080} camera={s.camera} gl={{antialias:true}}><World f={f}/></ThreeCanvas>
 {f<111&&<div style={{position:'absolute',left:0,top:0,width:500,height:700,display:'flex',alignItems:'center',justifyContent:'center',transform:numberTransform,transformOrigin:'0 0',fontSize:220,fontWeight:900,lineHeight:1.2,color:c.ink}}>{day}</div>}
 {f>=117&&f<264&&<div style={{position:'absolute',left:470,top:136,width:980,textAlign:'center'}}><div style={{display:'inline-block',background:'#FBFCFD',border:`4px solid ${c.ink}`,borderRadius:14,padding:'12px 26px',fontSize:38,fontWeight:800,color:c.ink,boxShadow:'0 8px 0 #29374718'}}>開発担当・小木曽聡氏の証言</div><div style={{width:110,height:4,background:'#D9AB56',margin:'10px auto 0',borderRadius:2}}/></div>}
 {f>=600&&f<660&&<div style={{position:'absolute',left:(milestone.x+1)*960-105,top:(1-milestone.y)*540-33,width:210,textAlign:'center',fontSize:46,fontWeight:900,color:c.ink}}>500m</div>}
 <ChapterTag/>{cue&&<div style={{opacity:ramp(f,cue.start,cue.start+4)}}><SubtitleBand lines={cue.lines}/></div>}
 <AbsoluteFill style={{background:'#0B0F16',opacity:Math.max(1-ramp(f,0,20),ramp(f,808,824)),pointerEvents:'none'}}/>
 </AbsoluteFill>;
};
