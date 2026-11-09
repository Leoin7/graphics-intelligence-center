// A deterministic, local demonstration model. Dimensions and topology are not a CAD design service.
export const DEVICE_TYPES=[
 {name:'RCU 客房控制器',prefix:'RCU',unit:'台',interface:'TCP/IP / 端口待核定'},
 {name:'情景控制面板',prefix:'KP',unit:'个',interface:'485 总线 · 待厂家确认'},
 {name:'灯具 / 阅读灯',prefix:'LT',unit:'盏',interface:'灯光输出 · 回路分组'},
 {name:'温控面板',prefix:'TC',unit:'个',interface:'485 总线 · 待厂家确认'},
 {name:'窗帘电机',prefix:'CM',unit:'台',interface:'控制接口 + 独立 220V 供电'},
 {name:'门磁 / 人体感应 / 服务信号',prefix:'DI',unit:'个',interface:'DI 接入 · 触点形式待核定'}
];
export const PLAN_META=[{name:'支路距离优先',description:'各支路优先减少水平投影距离'},{name:'沿墙通道优先',description:'优先沿示例墙边与公共通道'},{name:'集中干线优先',description:'经统一通道节点组织干线与分支'}];
export const WALLS=[{x:200,y:121,w:9,h:103},{x:200,y:276,w:9,h:151},{x:200,y:477,w:9,h:72},{x:99,y:292,w:101,h:9},{x:99,y:495,w:101,h:9},{x:430,y:121,w:8,h:129},{x:430,y:455,w:8,h:149},{x:209,y:186,w:58,h:8},{x:209,y:549,w:69,h:8}];
const POSITIONS=[[[260,139]],[[220,205],[245,260],[418,300],[418,415]],[[124,251],[169,251],[124,345],[160,461],[260,217],[315,217],[370,217],[413,217],[260,325],[413,325],[260,407],[413,407],[292,536],[389,536],[465,275],[480,431]],[[220,330],[220,450]],[[445,270],[445,435]],[[220,558],[184,453],[290,203]]];
const round1=n=>Math.round(n*10)/10;
const within=p=>p.x>=100&&p.x<=500&&p.y>=125&&p.y<=600;
const blockedPoint=p=>WALLS.some(r=>p.x>r.x&&p.x<r.x+r.w&&p.y>r.y&&p.y<r.y+r.h);
function blockedSegment(a,b){return WALLS.some(r=>a.x===b.x?a.x>r.x&&a.x<r.x+r.w&&Math.max(a.y,b.y)>r.y&&Math.min(a.y,b.y)<r.y+r.h:a.y>r.y&&a.y<r.y+r.h&&Math.max(a.x,b.x)>r.x&&Math.min(a.x,b.x)<r.x+r.w)}
export function manhattanLength(points){return points.slice(1).reduce((n,p,i)=>n+Math.abs(p.x-points[i].x)+Math.abs(p.y-points[i].y),0)}
export function uniqueLength(routes){const groups=new Map();for(const route of routes)for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i],h=a.y===b.y;const key=`${route.network}:${route.groupId||''}:${h?'H':'V'}:${h?a.y:a.x}`;const values=groups.get(key)||[];values.push([Math.min(h?a.x:a.y,h?b.x:b.y),Math.max(h?a.x:a.y,h?b.x:b.y)]);groups.set(key,values)}let sum=0;for(const list of groups.values()){list.sort((a,b)=>a[0]-b[0]);let end=-Infinity;for(const [a,b]of list){if(b>end)sum+=b-Math.max(a,end);end=Math.max(end,b)}}return sum}
class MinHeap{constructor(){this.data=[]}push(value){let i=this.data.push(value)-1;while(i){const parent=(i-1)>>1;if(this.data[parent].cost<=value.cost)break;this.data[i]=this.data[parent];i=parent}this.data[i]=value}pop(){const first=this.data[0],last=this.data.pop();if(this.data.length){let i=0;while(i*2+1<this.data.length){let j=i*2+1;if(j+1<this.data.length&&this.data[j+1].cost<this.data[j].cost)j++;if(this.data[j].cost>=last.cost)break;this.data[i]=this.data[j];i=j}this.data[i]=last}return first}}
function simplify(points){return points.filter((p,i)=>i===0||i===points.length-1||!((points[i-1].x===p.x&&p.x===points[i+1].x)||(points[i-1].y===p.y&&p.y===points[i+1].y)))}
function routePath(start,end,variant,edited,via=false,avoid=[]){
 if(variant===2&&!via){const waypoint={x:228,y:440};const a=routePath(start,waypoint,variant,edited,true,avoid),b=routePath(waypoint,end,variant,edited,true,avoid);return a&&b?simplify([...a,...b.slice(1)]):null}
 const xs=[...new Set([100,110,130,180,190,195,214,220,228,240,260,280,300,320,340,360,380,400,418,424,442,450,470,490,500,start.x,end.x,...WALLS.flatMap(r=>[r.x-4,r.x+r.w+4])])].filter(x=>x>=100&&x<=500).sort((a,b)=>a-b);
 const ys=[...new Set([125,140,170,180,200,220,240,260,280,310,330,350,370,390,410,440,460,480,510,530,540,565,580,600,start.y,end.y,...WALLS.flatMap(r=>[r.y-4,r.y+r.h+4])])].filter(y=>y>=125&&y<=600).sort((a,b)=>a-b);
 const nx=xs.length,ny=ys.length,index=(x,y)=>y*nx+x,si=index(xs.indexOf(start.x),ys.indexOf(start.y)),target=index(xs.indexOf(end.x),ys.indexOf(end.y));
 const heap=new MinHeap(),dist=new Map(),prev=new Map();heap.push({cost:0,id:si*3});dist.set(si*3,0);let found=null;
 while(heap.data.length){const cur=heap.pop();if(cur.cost!==dist.get(cur.id))continue;const node=Math.floor(cur.id/3),dir=cur.id%3;if(node===target){found=cur.id;break}const x=node%nx,y=Math.floor(node/nx),a={x:xs[x],y:ys[y]};for(const [xx,yy,d]of[[x-1,y,1],[x+1,y,1],[x,y-1,2],[x,y+1,2]]){if(xx<0||xx>=nx||yy<0||yy>=ny)continue;const b={x:xs[xx],y:ys[yy]};if(blockedPoint(b)||blockedSegment(a,b))continue;const length=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);const wallDist=Math.min(...WALLS.map(r=>Math.min(Math.abs(b.x-r.x),Math.abs(b.x-r.x-r.w))),Math.abs(b.x-100),Math.abs(b.x-500));let cost=length;if(variant===1)cost*=wallDist<18||b.x>=214&&b.x<=228?0.28:1.35;if(variant===2&&dir&&dir!==d)cost+=55;else if(dir&&dir!==d)cost+=variant===0?2:6;for(const segment of avoid){const [c,d]=segment;if(a.x===b.x&&c.x===d.x&&a.x===c.x)cost+=Math.max(0,Math.min(Math.max(a.y,b.y),Math.max(c.y,d.y))-Math.max(Math.min(a.y,b.y),Math.min(c.y,d.y)))*15;else if(a.y===b.y&&c.y===d.y&&a.y===c.y)cost+=Math.max(0,Math.min(Math.max(a.x,b.x),Math.max(c.x,d.x))-Math.max(Math.min(a.x,b.x),Math.min(c.x,d.x)))*15}if(edited&&b.x>=214&&b.x<=228&&b.y>300&&b.y<480)cost+=length*7;const id=index(xx,yy)*3+d,newCost=cur.cost+cost;if(newCost<(dist.get(id)??Infinity)){dist.set(id,newCost);prev.set(id,cur.id);heap.push({cost:newCost,id})}}}
 if(found===null)return null;const points=[];for(let id=found;id!==undefined;id=prev.get(id)){const node=Math.floor(id/3);points.push({x:xs[node%nx],y:ys[Math.floor(node/nx)]})}return simplify(points.reverse())
}
function deviceZone(p){if(p.x>438)return '阳台';if(p.x<200)return '卫生间';if(p.y>450)return '会客区';return '睡眠区'}
export function buildGeneration(s,inventoryOnly=false){
 const m={version:3,metresPerUnit:7.2/420,devices:[],plans:[],bom:[],systemGroups:[],checks:[],assumptions:['示例尺寸链按水平 7200 mm 的统一比例换算，非上传图纸的实测尺寸；毫米标注取整，线长只计水平投影。','线路为示例平面寻径，不含立管、安装余量和实际电缆芯数。','灯具暂按 10 W/盏估算；线径、保护器和RCU端口均待项目参数与厂家确认。']};
 const counts=DEVICE_TYPES.map((_,i)=>Math.max(0,Math.trunc(Number(s.componentCounts?.[i]??0))));
 if(counts.reduce((a,b)=>a+b,0)>64){m.checks.push({id:'capacity',level:'error',title:'单张示例图最多布置 64 个设备点',detail:'请拆分图页或降低演示数量，不能截断设备后继续出图。'});return m}
 if(s.selectedTypes?.includes('light')&&counts[2]===0)m.checks.push({id:'no-lights',level:'error',title:'缺少待生成的灯具',detail:'请先补充灯具构件，或取消灯光回路生成类型。'});
 if(s.selectedTypes?.includes('control')&&counts[0]===0)m.checks.push({id:'rcu',level:'error',title:'缺少RCU控制器',detail:'客控布线必须有明确控制器。'});
 const used=new Set();
 for(let type=0;type<counts.length;type++)for(let i=0;i<counts[type];i++){
  const [x,y]=POSITIONS[type][i%POSITIONS[type].length];let point={x:x+Math.floor(i/POSITIONS[type].length)*9,y:y+Math.floor(i/POSITIONS[type].length)*7};if(type===0&&i===0&&s.positionPoints?.rcu?.point)point={...s.positionPoints.rcu.point};
  for(let k=0;k<40&&used.has(`${point.x},${point.y}`);k++)point={x:point.x+3,y:point.y+3};used.add(`${point.x},${point.y}`);
  const d={id:`${DEVICE_TYPES[type].prefix}-${String(i+1).padStart(2,'0')}`,type,name:DEVICE_TYPES[type].name,point,zone:deviceZone(point)};if(type===5)d.name=['门磁','人体感应','DND / MUR 服务信号'][i%3];m.devices.push(d);
  if(!within(point)||blockedPoint(point))m.checks.push({id:`position-${d.id}`,level:'error',title:`${d.id} 位置超出有效区域或落在墙体内`,detail:'请重新选点或减少设备布点数量。'})
 }
 const db={id:'DB-01',point:s.positionPoints?.distribution?.point?{...s.positionPoints.distribution.point}:{x:243,y:582}};m.distribution=db;
 if(!within(db.point)||blockedPoint(db.point))m.checks.push({id:'db-position',level:'error',title:'配电箱位置不可用',detail:'请在示例房间内的非墙体位置重新选择。'});
 const controllers=m.devices.filter(d=>d.type===0);for(const d of m.devices.filter(d=>d.type!==0&&d.type!==2)){d.controllerId=controllers.slice().sort((a,b)=>manhattanLength([a.point,d.point])-manhattanLength([b.point,d.point]))[0]?.id;d.interface=DEVICE_TYPES[d.type].interface}
 for(let type=0;type<counts.length;type++)if(counts[type])m.bom.push({type,name:DEVICE_TYPES[type].name,quantity:counts[type],unit:DEVICE_TYPES[type].unit,specification:'型号待企业设备库确认',ids:m.devices.filter(d=>d.type===type).map(d=>d.id)});
 for(const rcu of controllers)for(const type of[1,3,4,5]){const devices=m.devices.filter(d=>d.type===type&&d.controllerId===rcu.id);if(devices.length)m.systemGroups.push({controllerId:rcu.id,type,name:DEVICE_TYPES[type].name,quantity:devices.length,deviceIds:devices.map(d=>d.id),interface:DEVICE_TYPES[type].interface})}
 if(m.checks.some(c=>c.level==='error'))return m;
 if(inventoryOnly)return m;
 for(let variant=0;variant<3;variant++){
  const p={...PLAN_META[variant],index:variant,routes:[],circuits:[],checks:[]};
  if(s.selectedTypes?.includes('light')){
   const groups=new Map();for(const d of m.devices.filter(d=>d.type===2)){const zone=d.zone;const key=zone==='卫生间'&&s.issueChoice0==='独立回路 · RCU 控制'&&d.id==='LT-04'?'镜前灯独立':zone;const arr=groups.get(key)||[];arr.push(d);groups.set(key,arr)}let i=0;for(const [zone,devices]of groups){const circuit={id:`L${String(++i).padStart(2,'0')}`,name:zone+'照明',sourceId:db.id,deviceIds:devices.map(d=>d.id),estimatedWatts:devices.length*10,specification:'线径 / 保护器待复核'};p.circuits.push(circuit);for(const d of devices){d.circuitId=circuit.id;const points=routePath(db.point,d.point,variant,!!s.routeEdited);if(points)p.routes.push({id:`${circuit.id}-${d.id}`,sourceId:db.id,targetId:d.id,network:'light',groupId:circuit.id,points});else p.checks.push({level:'error',title:`${d.id} 无可用路径`})}}
  }
  if(s.selectedTypes?.includes('control'))for(const d of m.devices.filter(d=>d.type!==0&&d.type!==2)){
   const source=controllers.find(c=>c.id===d.controllerId);if(!source)continue;const points=routePath(source.point,d.point,variant,!!s.routeEdited,false,p.routes.filter(r=>r.network==='light').flatMap(r=>r.points.slice(1).map((v,i)=>[r.points[i],v])));if(points)p.routes.push({id:`${source.id}-${d.id}`,sourceId:source.id,targetId:d.id,network:'control',groupId:source.id,interface:d.interface,points});else p.checks.push({level:'error',title:`${d.id} 无可用控制路径`});
   if(d.type===4&&s.positions?.distribution){const points=routePath(db.point,d.point,variant,false,false,p.routes.filter(r=>r.network==='control').flatMap(r=>r.points.slice(1).map((v,i)=>[r.points[i],v])));if(points)p.routes.push({id:`P-${d.id}`,sourceId:db.id,targetId:d.id,network:'power',groupId:'ACTUATOR-220V',points})}
  }
  p.lightMetres=round1(uniqueLength(p.routes.filter(r=>r.network==='light'))*m.metresPerUnit);p.controlMetres=round1(uniqueLength(p.routes.filter(r=>r.network==='control'))*m.metresPerUnit);p.powerMetres=round1(uniqueLength(p.routes.filter(r=>r.network==='power'))*m.metresPerUnit);p.lengthMetres=round1(uniqueLength(p.routes)*m.metresPerUnit);p.turns=p.routes.reduce((n,r)=>n+Math.max(0,r.points.length-2),0);p.estimatedWatts=p.circuits.reduce((n,c)=>n+c.estimatedWatts,0);m.plans.push(p)
 }
 m.checks.push({id:'strong-weak',level:'review',title:'强弱电已独立建模，敷设层及交叉做法待复核',detail:'寻径对强弱电共线段增加避让代价；二维平面不包含桥架标高、间距和分管信息，不能据此判定施工合规。'},{id:'connected',level:'pass',title:'设备与连接清单一致',detail:`${m.devices.length} 个设备；每条路径端点可追溯到设备编号。`},{id:'walls',level:'pass',title:'已对示例墙体执行平面避让',detail:'仅适用于内置示例墙体，不代表真实工程穿墙审查。'},{id:'parameters',level:'review',title:'线径、保护器、负荷及RCU容量待工程复核',detail:'系统尚未接入真实设备规格与工程规范校核服务。'});
 if(s.selectedTypes?.includes('control')&&counts[4]&&!s.positions?.distribution)m.checks.push({id:'supply',level:'review',title:'执行器 220V 供电接入点待确认',detail:'未确认配电箱时，不绘制假定供电路径。'});
 if(s.deferredLayers?.length)m.checks.push({id:'deferred',level:'review',title:`${s.deferredLayers.length} 个暂存图层未纳入生成`,detail:'补充分类型后应重新识别并重算。'});
 for(const p of m.plans)m.checks.push(...p.checks);return m
}
let lastGenerationKey='',lastGeneration=null;
export function getGeneration(s){const key=JSON.stringify([s.componentCounts,s.selectedTypes,s.positionPoints,s.positions,s.routeEdited,s.issueChoice0,s.issueChoice1,s.deferredLayers]);if(key!==lastGenerationKey){lastGeneration=buildGeneration(s);lastGenerationKey=key}return lastGeneration}

export function presentationModel(s){
 if(s.generated&&!s.busy)return getGeneration(s);
 if(s.recognized?.[2]&&!(s.busy&&s.step<=2))return {...buildGeneration(s,true),plans:[],checks:[],systemGroups:[]};
 return {devices:[],plans:[],checks:[],systemGroups:[]};
}
