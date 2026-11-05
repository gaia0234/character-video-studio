import React, {useMemo} from 'react';
import {Composition, registerRoot} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {PriusNHW10Model} from './longform/r10/PriusNHW10Model';

const CarCheck: React.FC<{view:'side'|'top'|'rear34'}> = ({view}) => {
  const width=1600,height=900;
  const camera=useMemo(()=>{
    const c=new THREE.OrthographicCamera(-3.2,3.2,1.8,-1.8,.01,100);
    // R3F resize must not replace the metre-based orthographic frustum with pixel units.
    Object.assign(c,{manual:true});
    if(view==='side') c.position.set(0,.745,10);
    if(view==='top') {c.position.set(0,10,0);c.up.set(0,0,-1);}
    if(view==='rear34') c.position.set(10,3.1,-9);
    c.lookAt(0,view==='top'?0:.745,0);c.updateProjectionMatrix();return c;
  },[view]);
  return <ThreeCanvas width={width} height={height} camera={camera} style={{backgroundColor:'#FFFFFF'}} gl={{antialias:true}}>
    <ambientLight intensity={1.2}/><directionalLight position={[-3,7,5]} intensity={2}/>
    <PriusNHW10Model/>
  </ThreeCanvas>;
};
const Root=()=> <>{(['side','top','rear34'] as const).map(view=><Composition key={view} id={`R10Car-${view}`} component={CarCheck} defaultProps={{view}} width={1600} height={900} durationInFrames={1} fps={30}/>)}</>;
registerRoot(Root);
