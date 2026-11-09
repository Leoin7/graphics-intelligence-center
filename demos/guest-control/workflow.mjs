import {invalidate} from './state.mjs';
export const UNKNOWN_LAYERS=['未分类图层 A','未分类图层 B'];
export const LAYER_CATEGORIES=['建筑结构','墙体','门窗','家具','电气设备','照明灯具','灯光回路线','客控信号线','标注尺寸','文字说明','电气导线','照明','动力设备','通用建筑'];
export const DELIVERY_ITEMS=[['inventory','设备编号、数量与产品清单逐项一致'],['interfaces','厂家型号、RCU端口与控制接口已人工核对'],['wiring','线径、负荷、保护器及强弱电敷设已人工核对']];
export function recognitionSummary(s,i){
 if(!s.recognized?.[i]||(s.busy&&s.step<=i))return null;
 const pending=UNKNOWN_LAYERS.filter(n=>!s.layerClasses[n]).length;
 if(i===0)return {total:12,classified:12-pending,pending,label:'图层'};
 if(i===1)return {total:s.regionTypes.length,pending:s.boundaryClosed?0:1,label:'区域'};
 return {total:s.componentCounts.reduce((a,b)=>a+b,0),types:s.componentCounts.filter(n=>n>0).length,pending:0,label:'构件'};
}
export function classifyLayers(s,names,category){
 if(s.busy||!s.recognized?.[0]||!['',...LAYER_CATEGORIES].includes(category))return false;
 const selected=UNKNOWN_LAYERS.filter(n=>names.includes(n)&&((s.layerClasses[n]||'')!==category));
 if(!selected.length)return false;
 invalidate(s,0);for(const n of selected)s.layerClasses[n]=category;
 s.deferredLayers=UNKNOWN_LAYERS.filter(n=>!s.layerClasses[n]);
 return true;
}
export function deliveryReview(s){const complete=DELIVERY_ITEMS.filter(([id])=>s.deliveryChecks?.[id]===true).length;return {complete,total:DELIVERY_ITEMS.length,ready:complete===DELIVERY_ITEMS.length}}
