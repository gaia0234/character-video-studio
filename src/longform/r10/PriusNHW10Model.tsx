import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {SVGLoader} from 'three/examples/jsm/loaders/SVGLoader.js';

// Accepted Im9 / ToyotaPriusRegeneration.tsx body path, unchanged SVG coordinates.
// Axes: front -X, up +Y, width Z. Ground Y=0. Dimensions in metres.
export const BODY_PATH = 'M0 636 Q4 598 18 584 L58 563 C119 474 270 422 468 377 L734 220 C811 176 857 160 943 153 C1105 143 1408 139 1484 172 C1556 197 1639 242 1738 296 Q1794 335 1852 343 L1961 361 Q1991 383 1999 434 L2001 488 Q2040 522 2045 578 L2044 672 Q2029 705 1919 730 L1785 763 C1797 509 1428 523 1439 792 L536 780 C533 512 183 505 174 786 L45 769 L23 722 L13 690 Z';
export const NHW10 = {length: 4.275, width: 1.695, height: 1.490, wheelbase: 2.550};
export const C = {body: '#E9EFF4', bodyLow: '#D5E0E9', bumper: '#C9D6DE', glass: '#7FA3B8', red: '#C4513F', gold: '#D9AB56', tire: '#293747', hub: '#C3CED5', ink: '#293747'};
const svgShape = (d: string) => SVGLoader.createShapes(new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`).paths[0])[0];
const rawBody = () => svgShape(BODY_PATH);
// Dense curve sampling measures the actual Bezier extrema, not control-point bounds.
let measured: {minX:number;maxX:number;roofV:number;scale:number;groundV:number} | undefined;
export const profileMetrics = () => {
  if(measured) return measured;
  const p = rawBody().getPoints(128);
  const minX = Math.min(...p.map(v => v.x)); const maxX = Math.max(...p.map(v => v.x));
  const roofV = Math.min(...p.map(v => v.y));
  const scale = NHW10.length / (maxX-minX);
  measured={minX,maxX,roofV,scale,groundV:roofV+NHW10.height/scale};
  return measured;
};
type P = [number, number, number];
// Circular plan corners: front R .32m, rear R .22m, both inside accepted side path.
export const PLAN = {frontRadius: .32, rearRadius: .22};
const halfWidth = (u: number, v: number) => {
  const m=profileMetrics();
  const roof = 1 - .2 * THREE.MathUtils.clamp((410-v)/(410-148),0,1);
  const dFront=(u-m.minX)*m.scale, dRear=(m.maxX-u)*m.scale;
  const inset=(d:number,r:number)=>d>=r?0:r-Math.sqrt(Math.max(0,r*r-(r-Math.max(0,d))**2));
  const corner=Math.max(inset(dFront,PLAN.frontRadius),inset(dRear,PLAN.rearRadius));
  return (NHW10.width/2-corner)*roof;
};
const point = (u: number,v: number,side: number, lift=0): P => {
  const m=profileMetrics();
  return [(u-(m.minX+m.maxX)/2)*m.scale,(m.groundV-v)*m.scale,side*(halfWidth(u,v)+lift)];
};
const bodyGeometry = () => {
  const m=profileMetrics();
  const g=new THREE.ExtrudeGeometry(rawBody(),{depth:2,bevelEnabled:false,curveSegments:64,steps:24});
  // Split cap triangles at the belt before tapering: otherwise a triangle crossing
  // the taper kink bulges outside the side windows and hides their lower edges.
  const source=g.getAttribute('position'); const split:number[]=[];
  for(let i=0;i<source.count;i+=3) {
    const tri=Array.from({length:3},(_,j)=>new THREE.Vector3().fromBufferAttribute(source,i+j));
    for(const sign of [-1,1]) {
      const clipped:THREE.Vector3[]=[];
      for(let k=0;k<3;k++) {const a=tri[k],b=tri[(k+1)%3];const inside=(a.y-410)*sign>=0;
        if(inside) clipped.push(a);
        if(((a.y-410)*sign<0)!==((b.y-410)*sign<0)) clipped.push(a.clone().lerp(b,(410-a.y)/(b.y-a.y)));
      }
      for(let k=1;k<clipped.length-1;k++) split.push(...clipped[0].toArray(),...clipped[k].toArray(),...clipped[k+1].toArray());
    }
  }
  // Subdivide BEFORE the nonlinear width mapping. Large cap triangles must not
  // shortcut the rounded surface and protrude through bonnet/lamp surfaces.
  const dense:number[]=[];
  const refine=(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3):void=>{
    const edges=[a.distanceToSquared(b),b.distanceToSquared(c),c.distanceToSquared(a)];
    const longest=Math.max(...edges);
    if(longest<=24*24) {dense.push(...a.toArray(),...b.toArray(),...c.toArray());return;}
    if(longest===edges[0]) {const m=a.clone().lerp(b,.5);refine(a,m,c);refine(m,b,c);}
    else if(longest===edges[1]) {const m=b.clone().lerp(c,.5);refine(a,b,m);refine(a,m,c);}
    else {const m=c.clone().lerp(a,.5);refine(a,b,m);refine(m,b,c);}
  };
  for(let i=0;i<split.length;i+=9) refine(new THREE.Vector3(...split.slice(i,i+3) as P),new THREE.Vector3(...split.slice(i+3,i+6) as P),new THREE.Vector3(...split.slice(i+6,i+9) as P));
  g.setAttribute('position',new THREE.Float32BufferAttribute(dense,3));g.deleteAttribute('normal');g.deleteAttribute('uv');g.clearGroups();
  const p=g.getAttribute('position');
  for(let i=0;i<p.count;i++) {
    const u=p.getX(i),v=p.getY(i),z=p.getZ(i)-1;
    p.setXYZ(i,(u-(m.minX+m.maxX)/2)*m.scale,(m.groundV-v)*m.scale,z*halfWidth(u,v));
  }
  // SVG Y reflection reverses winding. Restore outward-facing triangles.
  for(let i=0;i<p.count;i+=3) {
    const a=new THREE.Vector3().fromBufferAttribute(p,i);
    p.setXYZ(i,p.getX(i+2),p.getY(i+2),p.getZ(i+2)); p.setXYZ(i+2,a.x,a.y,a.z);
  }
  g.computeVertexNormals();
  // Analytic normals on the warped side caps avoid T-junction shading seams.
  const normals=g.getAttribute('normal');
  for(let i=0;i<p.count;i+=3) {
    const z0=dense[i*3+2],z1=dense[(i+1)*3+2],z2=dense[(i+2)*3+2];
    if(z0!==z1 || z1!==z2 || (z0!==0 && z0!==2)) continue;
    for(let j=i;j<i+3;j++) {
      // Winding swap above reverses the source corner order.
      const sourceIndex=i+2-(j-i),u=dense[sourceIndex*3],v=dense[sourceIndex*3+1],h=.1;
      const du=(halfWidth(u+h,v)-halfWidth(u-h,v))/(2*h*m.scale);
      // Stable toon side shading: the belt taper is a deliberate hard break,
      // so do not interpolate its derivative across unconstrained cap triangles.
      const n=new THREE.Vector3(-du,0,z0===0?-1:1).normalize();normals.setXYZ(j,n.x,n.y,n.z);
    }
  }
  return g;
};
const Line: React.FC<{points:P[];radius?:number;closed?:boolean;color?:string}> = ({points,radius=.006,closed=false,color=C.ink}) => {
  const geometry=useMemo(()=>{
    const curve=new THREE.CurvePath<THREE.Vector3>();
    const vertices=closed?[...points,points[0]]:points;
    for(let i=1;i<vertices.length;i++) curve.add(new THREE.LineCurve3(new THREE.Vector3(...vertices[i-1]),new THREE.Vector3(...vertices[i])));
    return new THREE.TubeGeometry(curve,Math.max(64,points.length*4),radius,6,closed);
  },[points,radius,closed]);
  return <mesh geometry={geometry}><meshBasicMaterial color={color}/></mesh>;
};
const Panel: React.FC<{points:P[];color:string;map:THREE.Texture;edge?:boolean}> = ({points,color,map,edge=true}) => {
  const geometry=useMemo(()=>{
    const g=new THREE.BufferGeometry(); const a:number[]=[];
    for(let i=1;i<points.length-1;i++) a.push(...points[0],...points[i],...points[i+1]);
    g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));g.computeVertexNormals();return g;
  },[points]);
  return <><mesh geometry={geometry}><meshToonMaterial color={color} gradientMap={map} side={THREE.DoubleSide}/></mesh>{edge&&<Line points={points} closed/>}</>;
};
const upperV=(u:number) => {
  const pts=rawBody().getPoints(128); let top=Infinity;
  for(let i=1;i<pts.length;i++) {const a=pts[i-1],b=pts[i];if((u-a.x)*(u-b.x)<=0 && a.x!==b.x) top=Math.min(top,a.y+(b.y-a.y)*(u-a.x)/(b.x-a.x));}
  return top;
};
const rearU=(v:number) => {
  const pts=rawBody().getPoints(128);let rear=-Infinity;
  for(let i=1;i<pts.length;i++) {const a=pts[i-1],b=pts[i];if((v-a.y)*(v-b.y)<=0 && a.y!==b.y) rear=Math.max(rear,a.x+(b.x-a.x)*(v-a.y)/(b.y-a.y));}
  return rear;
};
const CrownGlass: React.FC<{start:number;end:number;map:THREE.Texture}> = ({start,end,map}) => {
  const rows=Array.from({length:25},(_,i)=>{const u=start+(end-start)*i/24;const v=upperV(u);return [-.89,.89].map(side=>{const p=point(u,v,side);p[1]+=.009;return p;});});
  return <>{rows.slice(0,-1).map((row,i)=><Panel key={i} points={[row[0],row[1],rows[i+1][1],rows[i+1][0]]} color={C.glass} map={map} edge={false}/>)}<Line points={[...rows.map(r=>r[0]),...rows.slice().reverse().map(r=>r[1])]} closed/></>;
};
const WINDOWS = ['M511 424 L787 249 Q853 211 957 194 L1106 186 L1071 387 Z','M1144 189 Q1361 184 1460 225 L1582 315 Q1569 359 1536 369 L1112 390 Z'];
export const PriusNHW10Model: React.FC = () => {
  const {camera}=useThree();
  const {body,map,contour,windows,m}=useMemo(()=>{
    const map=new THREE.DataTexture(new Uint8Array([85,170,255]),3,1,THREE.RedFormat);
    map.minFilter=map.magFilter=THREE.NearestFilter; map.generateMipmaps=false;map.needsUpdate=true;
    return {body:bodyGeometry(),map,contour:rawBody().getPoints(64),windows:WINDOWS.map(d=>svgShape(d).getPoints(16)),m:profileMetrics()};
  },[]);
  // Accepted drawing's wheel pair midpoint, exact specified wheelbase, source wheel radius.
  const axleMid=((357.587+1605.892)/2-(m.minX+m.maxX)/2)*m.scale;
  const tireR=152*m.scale;
  const rearView=camera.position.x>0 && camera.position.z<0;
  const rearTangentU=m.maxX-PLAN.rearRadius/m.scale*(1-Math.abs(camera.position.z)/Math.hypot(camera.position.x,camera.position.z));
  return <group>
    <mesh geometry={body}><meshToonMaterial color={C.body} gradientMap={map}/></mesh>
    {[-1,1].map(side=><React.Fragment key={side}>
      {rearView && side===1 ? <>
        {/* The far-side seam beyond the tangent lies inside the apparent rear edge. */}
        <ProfileVisibleSegments contour={contour} side={side} maxU={rearTangentU}/>
        <EndSilhouette u={rearTangentU} side={1}/>
      </> : <Line points={contour.map(p=>point(p.x,p.y,side,.001))} closed/>}
      {windows.map((w,i)=><Panel key={i} points={w.map(p=>point(p.x,p.y,side,.008))} color={C.glass} map={map}/>)}
      <Line points={[[1460,228],[1454,376]].map(([u,v])=>point(u,v,side,.012))} radius={.008}/>
      {/* Continuous belt and minimal door seams; no logos/plate/antenna/spoiler. */}
      <Line points={[[550,460],[1100,440],[1770,420],[1890,414]].map(([u,v])=>point(u,v,side,.009))} color={C.gold} radius={.015}/>
      {[[[550,429],[545,610],[570,721],[1075,731]],[[1105,396],[1090,600],[1102,730],[1463,730],[1570,570],[1611,350]]].map((p,i)=><Line key={i} points={p.map(([u,v])=>point(u,v,side,.009))} radius={.0035}/>)}
      {[[967,480],[1473,454]].map(([u,v])=><Line key={u} points={[point(u,v,side,.015),point(u+64,v-4,side,.015)]} radius={.012}/>)}

      <Panel points={[[64,553],[110,497],[190,474],[121,550]].map(([u,v])=>point(u,v,side,.012))} color={C.hub} map={map}/>
      {[-1,1].map(axle=><group key={axle} position={[axleMid+axle*NHW10.wheelbase/2,tireR,side*.640]} rotation={[Math.PI/2,0,0]}>
        <mesh><cylinderGeometry args={[tireR,tireR,.198,48]}/><meshToonMaterial color={C.tire} gradientMap={map}/></mesh>
        <mesh position={[0,side*.103,0]}><cylinderGeometry args={[tireR*.68,tireR*.68,.012,32]}/><meshToonMaterial color={C.hub} gradientMap={map}/></mesh>
      </group>)}
    </React.Fragment>)}
    {/* Join the two side profiles at longitudinal extrema: top-view outline must close. */}
    <Line points={[point(m.minX,636,-1,.001),point(m.minX,636,1,.001)]}/>
    {rearView ? <Line points={[
      ...Array.from({length:49},(_,i)=>point(rearTangentU+(m.maxX-rearTangentU)*i/48,578,1,.001)),
      ...Array.from({length:49},(_,i)=>point(m.maxX,578,1-2*i/48,.001)),
    ]}/> : <Line points={[point(m.maxX,578,-1,.001),point(m.maxX,578,1,.001)]}/>}
    {/* Glazing follows the same continuous bonnet / roof / rear-deck perimeter. */}
    <CrownGlass start={535} end={810} map={map}/>
    <CrownGlass start={1510} end={1795} map={map}/>
    <Line points={[point(1852,343,-1,.003),point(1852,343,0,.003),point(1852,343,1,.003)]}/>
    {/* The lower transverse edge meets the actual rear wheel-arch / sill corner. */}
    <Line points={Array.from({length:49},(_,i)=>point(1785,763,-1+2*i/48,.001))}/>
    {camera.position.x>0 && camera.position.z<0 && <FrontSilhouette camera={camera}/>}

    {[-1,1].map(side=><RearLamp key={side} side={side} map={map}/>)}
  </group>;
};

const RearLamp:React.FC<{side:number;map:THREE.Texture}>=({side,map})=>{
  const rows=Array.from({length:17},(_,j)=>{
    const t=j/16,v=398+90*t;
    const end=rearU(v),start=1890+33*t;
    const sideRow=Array.from({length:33},(_,i)=>point(start+(end-start)*i/32,v,side,.001));
    const rearRow=Array.from({length:17},(_,i)=>{
      const p=point(end,v,side*(1-.45*i/16));p[0]+=.001;return p;
    });
    // The seam is a single shared surface vertex; the rear patch is inset by 1mm.
    return [...sideRow,...rearRow.slice(1)];
  });
  const perimeter=[...rows[0],...rows.slice(1).map(r=>r[r.length-1]),...rows[rows.length-1].slice(0,-1).reverse(),...rows.slice(1,-1).reverse().map(r=>r[0])];
  return <>
    {rows.slice(0,-1).flatMap((r,j)=>r.slice(0,-1).map((_,i)=><Panel key={`${j}-${i}`} points={[r[i],r[i+1],rows[j+1][i+1],rows[j+1][i]]} color={C.red} map={map} edge={false}/>))}
    <Line points={perimeter} closed/>
    <Line points={rows[13]} color={C.hub} radius={.012}/>
  </>;
};

// Apparent front outline on the circular plan corner, not the old side-cap seam.
const FrontSilhouette:React.FC<{camera:THREE.Camera}>=({camera})=>{
  const m=profileMetrics();
  const u=m.minX+PLAN.frontRadius/m.scale*(1-Math.abs(camera.position.z)/Math.hypot(camera.position.x,camera.position.z));
  const pts=rawBody().getPoints(128);
  const crossings:number[]=[];
  for(let i=1;i<pts.length;i++) {const a=pts[i-1],b=pts[i];if(a.x!==b.x && (u-a.x)*(u-b.x)<=0) crossings.push(a.y+(b.y-a.y)*(u-a.x)/(b.x-a.x));}
  const top=Math.min(...crossings),bottom=Math.max(...crossings);
  return <Line points={Array.from({length:97},(_,i)=>point(u,top+(bottom-top)*i/96,-1,.001))}/>;
};

const ProfileVisibleSegments:React.FC<{contour:THREE.Vector2[];side:number;maxU:number}>=({contour,side,maxU})=>{
  const segments:P[][]=[[]];
  for(const p of contour) {
    if(p.x<=maxU) segments[segments.length-1].push(point(p.x,p.y,side,.001));
    else if(segments[segments.length-1].length) segments.push([]);
  }
  return <>{segments.filter(p=>p.length>1).map((p,i)=><Line key={i} points={p}/>)}</>;
};
const EndSilhouette:React.FC<{u:number;side:number}>=({u,side})=>{
  const pts=rawBody().getPoints(128);const ys:number[]=[];
  for(let i=1;i<pts.length;i++) {const a=pts[i-1],b=pts[i];if(a.x!==b.x && (u-a.x)*(u-b.x)<=0) ys.push(a.y+(b.y-a.y)*(u-a.x)/(b.x-a.x));}
  const top=Math.min(...ys),bottom=Math.max(...ys);
  return <Line points={Array.from({length:97},(_,i)=>point(u,top+(bottom-top)*i/96,side,.001))}/>;
};
