/*
 * Copyright © Atomic Inc 2007-2012
 * http://jsorm.com
 *
 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
 * 
 * 
 * These libraries contains work written and published by Douglas Crockford www.crockford.com. 
 * Page xii of "JavaScript: The Good Parts" ISBN 978-0-596-51774-8 explicitly states that
 * "writing a program that uses several chunks of code from this book does not require permission."
 * To use any code in these libraries that comes from that work requires reference to the original license.
 * 
 * Version: 1.3b
 */


(function(exports){JSORM=JSORM||{};JSORM.db={index:{},parser:{},channel:{}};JSORM.db.db=JSORM.extend({},function(config){config=config||{};var clone=JSORM.clone,common=JSORM.common,apply=JSORM.apply,fork=JSORM.fork,first=JSORM.first;var journal=[],channel=config.channel||null,idField,myclass=this.myclass;var updateMode=config.updateMode||myclass.updates.nothing,writeMode=config.writeMode||myclass.modes.nothing;var store=JSORM.db.engine.hash(JSORM.db.index.hash("type"));var defaultWriteMode=myclass.modes.nothing,defaultUpdateMode=myclass.updates.nothing;var parser=config.parser||JSORM.db.parser.json();var updateParams=config.updateParams||{},loadParams=config.loadParams||{};JSORM.eventualize(this);this.events('load','loadexception','add','datachanged','clear','update','beforewrite','write','writeexception','commit','commitexception');var findInternal=function(args){var ret=null,i,len,query,idx,data;idx=store.query(args.where);if(idx){if(args.index){ret=idx;}
else{ret=[];for(i=0,len=idx.length;i<len;i++){data=store.get(idx[i]);ret.push(apply({},clone(data),args.fields));}}}
return(ret);};var clearInternal=function(log){if(log){journal.push({type:myclass.types.clear,data:store.get()});}
store.clear();};var loadData=function(data){var r=data.records;clearInternal(false);idField=data.id||"id";store.addIndex(idField);store.addIndex('type');store.insert(r);journal.clear();};var loadCallback=function(args){var options=args.options||{},r=[],parsed,processed=false;var e,sfcb,cb=args.callback,scope=args.scope||this;if(args.success&&(parsed=parser.read(args.response))){loadData(parsed);r=parsed.records;processed=true;sfcb=options.success;e="load";}else{sfcb=options.failure;e="loadexception";}
this.fire(e,{records:r,options:options});if(sfcb&&typeof(sfcb)==="function"){sfcb.call(scope,r,options,processed);}
if(cb&&typeof(cb)==="function"){cb.call(scope,r,options,processed);}};var removeAt=function(index){var i,len,removed=[],entry;index=[].concat(index);for(i=0,len=index.length;i<len;i++){entry=store.remove(index[i]);removed.push(entry);}
return(removed);};var write=function(mode){var data,tmp,i,len,j,lenj,recs={},entry,den,curId,condensed,orig;if(mode===myclass.modes.replace){data=store.get();}else{data=[];condensed=mode===myclass.modes.condensed;for(i=0,len=journal.length;i<len;i++){entry=journal[i];if(entry!==null){switch(entry.type){case myclass.types.change:orig=entry.data.original;for(j=0,lenj=orig.length;j<lenj;j++){curId=orig[j].id;if(condensed&&recs[curId]){apply(recs[curId].data,entry.data.changed);}else{den={type:entry.type,data:clone(entry.data.changed)};den.data[idField]=curId;recs[curId]=den;data.push(den);}}
break;case myclass.types.add:tmp=store.get(entry.data);for(j=0,lenj=tmp.length;j<lenj;j++){den={type:entry.type,data:tmp[j]};recs[tmp[j][idField]]=den;data.push(den);}
break;case myclass.types.clear:data.push({type:entry.type});break;case myclass.types.remove:tmp=[];den={};for(j=0,lenj=entry.data.length;j<lenj;j++){curId=entry.data[j][idField];tmp.push(curId);if(condensed&&recs[curId]){recs[curId].data.remove(curId);if(recs[curId].type===myclass.types.change){recs[curId]=den;}}else{recs[curId]=den;}}
den.type=entry.type;den.data=tmp;data.push(den);break;default:break;}}}}
return(data);};var writeCallback=function(args){var i,len,response=args.response,o=args.options||{},update;var r=[],e,sfcb,cb=o.callback,scope=o.scope||this,options=o.options;var newRec,where,index;if(args.success){if(this.fire('write',{options:o,data:response})!==false){update=first(o.update,updateMode,defaultUpdateMode);switch(update){case myclass.updates.nothing:break;case myclass.updates.replace:r=parser.read(response);loadData(r);break;case myclass.updates.update:r=parser.read(response);where={field:idField,compare:'equals'};for(i=0,len=r.records.length;i<len;i++){newRec=r.records[i];where.value=newRec[idField];index=findInternal({where:where,index:true});if(index&&index.length>0){store.update(index,newRec);}else{store.insert(newRec);}}
break;}
journal.clear();sfcb=o.success;e="commit";}else{sfcb=o.failure;e="commitexception";}}else{sfcb=o.failure;e="writeexception";}
this.fire(e,{options:o,data:response});if(sfcb&&typeof(sfcb)==="function"){sfcb.call(scope,this,options,response);}
if(cb&&typeof(cb)==="function"){cb.call(scope,this,options,response);}};apply(this,{insert:function(data){var index;if(data){if(typeof(data)==="string"){data=parser.read(data);if(data&&typeof(data)==="object"){data=data.records;}}
index=store.insert(data);journal.push({type:myclass.types.add,data:index});this.fire("add",{records:data});}},find:function(params){params=params||{};var data=findInternal({where:params.where,fields:params.fields,index:false});return(data);},update:function(params){var index,oldData,det=[],i,len,args=params||{},id,idconf;index=findInternal({where:args.where,index:true});oldData=store.update(index,args.data);idconf={};idconf[idField]=true;id=store.get(index,idconf);for(i=0,len=index.length;i<len;i++){det.push({index:index[i],data:oldData[i],id:id[i][idField]});}
journal.push({type:myclass.types.change,data:{changed:args.data,original:det}});this.fire("update",{records:store.get(index)});},load:function(args){args=args||{};var params,tp={callback:args.callback,success:args.success,failure:args.failure,scope:args.scope,options:args.options};if(args.data){tp.success=true;tp.response=args.data;fork({fn:loadCallback,arg:[tp],scope:this});}else if(channel){params=apply({},loadParams);apply(params,args.params);channel.load({params:params,scope:this,callback:loadCallback,options:tp});}else{tp.success=false;fork({fn:loadCallback,arg:[tp],scope:this});}
return(this);},remove:function(params){var args=params||{};var index=findInternal({where:args.where,index:true});var removed=removeAt(index);journal.push({type:myclass.types.remove,data:removed});this.fire("remove",{records:removed});},clear:function(){clearInternal();this.fire("clear");},getModifiedCount:function(){return(journal.length);},isDirty:function(){return(journal.length>0);},commit:function(options){options=options||{};var params,records,mode;mode=first(options.mode,writeMode,defaultWriteMode);if(!channel||(mode===myclass.modes.nothing)){journal.clear();this.fire("commit",{options:options});}else{if(this.fire("beforewrite",{options:options})!==false){records=write(mode);params=apply({},updateParams);apply(params,options.params);apply(params,{data:parser.write(records),mode:mode});channel.update({params:params,callback:writeCallback,scope:this,options:options});}}},reject:function(count){var start=0,index,data,type,i,j,len,lenj,orig;if(!count||count>journal.length){count=journal.length;start=0;}else{start=journal.length-count;}
var m=journal.splice(start,count).reverse();for(i=0,len=m.length;i<len;i++){index=m[i].index;data=m[i].data;type=m[i].type;switch(type){case myclass.types.change:orig=data.original;for(j=0,lenj=orig.length;j<lenj;j++){store.update(orig[j].index,orig[j].data);}
break;case myclass.types.add:removeAt(data);break;case myclass.types.remove:store.insert(data);break;case myclass.types.clear:store.insert(data);break;default:}}}});store.addIndex(config.index);store.addIndex('type');if(config.data){this.load({data:config.data});}},{modes:{nothing:0,replace:1,update:2,condensed:3},updates:{nothing:0,update:1,replace:2},types:{change:0,add:1,remove:2,clear:3,load:4},joins:{or:0,and:1}});JSORM.db.engine=function(){var apply=JSORM.apply,clone=JSORM.clone;var compares,pass1,pass2,pass3,intersection,union,keysAsArray,isPrimitive,isCompound;compares={equals:function(name,val){return(function(entry){return(entry[name]===val);});},"in":function(name,val){var h,ret;if(val.isArray){h=val.hasher();ret=function(entry){return(h.hasOwnProperty(entry[name]));};}
else{ret=null;}
return(ret);},gt:function(name,val){return(typeof(val)==="number"?function(entry){return(entry[name]>val);}:null);},ge:function(name,val){return(typeof(val)==="number"?function(entry){return(entry[name]>=val);}:null);},lt:function(name,val){return(typeof(val)==="number"?function(entry){return(entry[name]<val);}:null);},le:function(name,val){return(typeof(val)==="number"?function(entry){return(entry[name]<=val);}:null);},starts:function(name,val){return(typeof(val)==="string"?function(entry){return(entry[name].indexOf(val)===0);}:null);},ends:function(name,val){return(typeof(val)==="string"?function(entry){var a=entry[name];return(a.length-a.indexOf(val)-val.length===0);}:null);},contains:function(name,val){return(typeof(val)==="string"?function(entry){return(entry[name].indexOf(val)>=0);}:null);},isnull:function(name,val){return(function(entry){return(entry[name]===null);});},notnull:function(name,val){return(function(entry){return(entry[name]!==null);});}};intersection=function(){var result,i,len,o;if(!arguments||arguments.length<1){result={};}else if(arguments.length==1&&typeof(arguments[0])==="object"){result=arguments[0];}else{result=arguments[0].isArray?arguments[0].hasher():arguments[0];for(i=1,len=arguments.length;i<len;i++){o=arguments[i].isArray?arguments[i].hasher():arguments[i];result=JSORM.common(result,o,true);}}
return(result);};union=function(){var result,i,len,o;if(!arguments||arguments.length<1){result={};}else{result={};for(i=0,len=arguments.length;i<len;i++){o=arguments[i].isArray?arguments[i].hasher():arguments[i];result=JSORM.apply(result,o);}}
return(result);};keysAsArray=function(o){var i,r=[];for(i in o){if(i&&o.hasOwnProperty(i)&&typeof(o[i])!=="function"){r.push(i);}}
return(r);};isPrimitive=function(where){return(where.hasOwnProperty('field')&&where.field&&typeof(where.field)==="string"&&where.hasOwnProperty('compare')&&where.compare&&compares[where.compare]&&(where.hasOwnProperty("value")||where.compare==="isnull"||where.compare==="notnull"));};isCompound=function(where){return(where.hasOwnProperty("join")&&(where.join==="and"||where.join==="or")&&where.hasOwnProperty("terms")&&where.terms.isArray);};pass1=function(where,index){var r,r2,i,len,subm;if(isPrimitive(where)){if((subm=index.find(where))!==null){r=subm;}else{r=compares[where.compare](where.field,where.value);}}else if(isCompound(where)){r={join:where.join,terms:[],fn:[],comps:[]}
if(where.type){r.type=where.type};for(i=0,len=where.terms.length;i<len;i++){r2=pass1(where.terms[i],index);if(r2.isArray){r.terms.push(where.terms[i]);}else if(typeof(r2)==="function"){r.fn.push(r2);}else{r.comps.push(r2);}}}else{r=null;}
return(r);};pass2=function(where,foreach,index,limit){var r=[],r2,r3,subquery,i,len,j,lenj,list,keeper,typelimit;if(where.type){typelimit=index.find({field:'type',compare:'equals',value:where.type});limit=limit?intersection(limit,typelimit):typelimit.hasher();}
if(where.join==="and"){if(limit){r2=limit;}
if(where.terms&&where.terms.length>0){r3=intersection.apply(this,where.terms);r2=r2?intersection(r3,r2):r3;}
if(where.fn&&where.fn.length>0){r2=foreach(function(record){keeper=true;for(i=0,len=where.fn.length;i<len;i++){if(!where.fn[i](record)){keeper=false;break;}}
return(keeper);},r2?keysAsArray(r2):null);}
if(where.comps&&where.comps.length>0){for(i=0,len=where.comps.length;i<len;i++){r2=pass2(where.comps[i],foreach,index,r2);}}}else{if(where.terms.length>0){r2=union.apply(this,where.terms);r2=limit?intersection(r2,limit):r2;}
if(where.fn.length>0){r3=foreach(function(record){var matched=false;for(i=0,len=where.fn.length;i<len;i++){if(where.fn[i](record)){matched=true;break;}}
return(matched);},limit);r2=r2?union(r2,r3):r3.hasher();}
if(where.comps.length>0){for(i=0,len=where.comps.length;i<len;i++){if((r3=pass2(where.comps[i],foreach,index,limit))&&r3.isArray){for(j=0,lenj=r3.length;j<lenj;j++){r2[r3[j]]=true;}}}}}
if(r2){r=r2.isArray?r2:keysAsArray(r2);}else{r=[];}
return(r);};return{executeQuery:function(where,index,foreach){var i,len,subm,match=[],idx,fn,results,tmp;if(!where){results=foreach(function(record){return(true);});}else{if(isPrimitive(where)){tmp={join:'and'};if(where.type){tmp.type=where.type;}
delete where.type;tmp.terms=[where];where=tmp;}
results=pass1(where,index);results=pass2(results,foreach,index);}
return(results);}};}();JSORM.db.engine.array=JSORM.extend(JSORM.db.engine,function(){this.type="array";var data=[],index=null;var apply=JSORM.apply;var foreach=function(fn,limit){var i,len,r=[];if(limit&&limit.isArray){for(i=0,len=limit.length;i<len;i++){if(fn(data[limit[i]])){r.push(limit[i]);}}}else{for(i=0,len=data.length;i<len;i++){if(fn(data[i])){r.push(i);}}}
return(r);};apply(this,{length:function(){return(data.length);},insert:function(records){var i,len,locs=[],index=data.length;data.insert(index,records);for(i=0,len=records.length;i<len;i++){locs.push(index+i);}},remove:function(index){var entry=data.splice(index,1);return(entry);},clear:function(){data.clear();},get:function(idx,fields){var ret,i,len;if(idx===null||typeof(idx)==="undefined"){ret=data;}else if(idx&&idx.isArray){ret=[];for(i=0,len=idx.length;i<len;i++){ret.push(apply({},data[idx[i]],fields));}}else{ret=apply({},data[idx],fields);}
return(ret);},update:function(idx,newData){var r,i,len,oldData=[],changes;for(i=0,len=idx.length;i<len;i++){r=data[idx[i]];if(r){changes={};apply(changes,r,newData);apply(r,newData);oldData[i]=changes;}}
return(oldData);},addIndex:function(fields){},removeIndex:function(fields){},query:function(where){return(this.executeQuery(where,index,foreach));}});});JSORM.db.engine.hash=JSORM.extend(JSORM.db.engine,function(index){this.type="hash";var data={},length=0,max=0,unused=[];var apply=JSORM.apply;index=index||JSORM.db.index.hash();var foreach=function(fn,limit){var i,len,r=[];if(limit){for(i=0,len=limit.length;i<len;i++){if(fn(data[limit[i]])){r.push(limit[i]);}}}else{for(i in data){if(fn(data[i])){r.push(i);}}}
return(r);};apply(this,{length:function(){return(length);},insert:function(records){var i,len,idx,locs=[];for(i=0,len=records.length;i<len;i++){if(typeof(idx=unused.shift())==="undefined"){idx=max++;}
data[idx]=records[i];locs.push(idx);length++;}
index.add(locs,records);return(locs);},remove:function(idx){var entry=data[idx];delete data[idx];index.remove(idx,entry);length--;if(idx+1===max){max--;}else{unused.push(idx);}
return(entry);},clear:function(){JSORM.clear(data);index.clear();unused.clear();length=0;max=0;},get:function(idx,fields){var ret,i,len;if(idx===null||typeof(idx)==="undefined"){ret=[];for(i in data){if(i&&typeof(i)!=="function"&&typeof(data[i])==="object"){ret.push(data[i]);}}}else if(idx&&idx.isArray){ret=[];for(i=0,len=idx.length;i<len;i++){ret.push(apply({},data[idx[i]],fields));}}else{ret=apply({},data[idx],fields);}
return(ret);},update:function(idx,newdata){var r,i,len,oldData=[],changes;idx=[].concat(idx);for(i=0,len=idx.length;i<len;i++){r=data[idx[i]];if(r){changes={};apply(changes,r,newdata);apply(r,newdata);oldData[i]=changes;index.update(changes,newdata,idx[i]);}}
return(oldData);},addIndex:function(fields){index.fields(fields);},removeIndex:function(fields){index.unfields(fields);},query:function(where){return(this.executeQuery(where,index,foreach));}});});JSORM.db.index.hash=JSORM.extend({},function(f){this.type="hash";var fields=0,data={};JSORM.apply(this,{fields:function(f){var i,len;if(f){f=[].concat(f);for(i=0,len=f.length;i<len;i++){if(typeof(f[i])==="string"&&!data.hasOwnProperty(f[i])){data[f[i]]={};fields++;}}}},unfields:function(f){var i,len;if(f){f=[].concat(f);for(i=0,len=f.length;i<len;i++){if(typeof(f[i])==="string"&&data.hasOwnProperty(f[i])){delete data[f[i]];fields--;}}}},add:function(index,records){var i,j,len,ci,dj,rij;if(fields>0){records=[].concat(records);index=[].concat(index);for(i=0,len=records.length;i<len;i++){ci=index[i];for(j in data){if(data.hasOwnProperty(j)&&records[i].hasOwnProperty(j)){dj=data[j];rij=records[i][j];dj[rij]=dj[rij]||[];dj[rij].push(ci);}}}}},remove:function(index,record){var j;for(j in data){if(data.hasOwnProperty(j)&&record.hasOwnProperty(j)){data[j][record[j]].remove(index);}}},clear:function(){var i;for(i in data){if(data.hasOwnProperty(i)){JSORM.clear(data[i]);}}},find:function(query){var ret=null,field;if(query&&query.field&&query.compare&&(field=data[query.field])&&query.compare==="equals"){ret=field[query.value];}
return(ret);},update:function(old,newdata,index){var i,field;for(i in newdata){if(newdata.hasOwnProperty(i)&&data.hasOwnProperty(i)&&(field=data[i])&&old[i]!=newdata[i]){field[old[i]].remove(index);field[newdata[i]].push(index);}}}});this.fields(f);});JSORM.db.channel.http=JSORM.extend({},function(config){config=config||{};var ajax=JSORM.ajax,fork=JSORM.fork,that=this;var loadUrl=config.loadUrl||config.url,updateUrl=config.updateUrl||config.url;JSORM.eventualize(this);this.events('beforeupdate','update','updateexception','beforeload','load','loadexception');var processResponse=function(eSuccess,eFailure,filename,xhr,success,o){var e,a,s,ct,ct2,res;if(success){e=eSuccess;a=o.options;s=true;ct=xhr.getResponseHeader("Content-type");ct2=xhr.getResponseHeader("Content-Type");res=ct==="text/xml"||ct2==="text/xml"?xhr.responseXML:xhr.responseText;}else{e=eFailure;a=xhr;s=false;}
that.fire(e,o);o.callback.call(o.scope,{options:o.arg,success:s,response:res});};var updateResponse=function(filename,xhr,success,o){processResponse("update","updateexception",filename,xhr,success,o);};var loadResponse=function(filename,xhr,success,o){processResponse("load","loadexception",filename,xhr,success,o);};var message=function(beforeevent,arg,callback,method,url){var params=arg.params,cb=arg.callback,scope=arg.scope,options=arg.options;if(that.fire("beforeevent",params)!==false){var o={params:params||{},options:{callback:cb,scope:scope,arg:options},callback:callback,method:method,scope:this,url:url};ajax(o);}else{fork({fn:cb,scope:scope||that,arg:[{options:options,success:false}]});}};JSORM.apply(this,{update:function(arg){message("beforeupdate",arg,updateResponse,"POST",updateUrl);},load:function(arg){message("beforeload",arg,loadResponse,"GET",loadUrl);}});});if(!this.JSON){JSON={};}
(function(){function f(n){return n<10?'0'+n:n;}
if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return this.getUTCFullYear()+'-'+
f(this.getUTCMonth()+1)+'-'+
f(this.getUTCDate())+'T'+
f(this.getUTCHours())+':'+
f(this.getUTCMinutes())+':'+
f(this.getUTCSeconds())+'Z';};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf();};}
var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}
function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}
if(typeof rep==='function'){value=rep.call(holder,key,value);}
switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}
gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}
v=partial.length===0?'[]':gap?'[\n'+gap+
partial.join(',\n'+gap)+'\n'+
mind+']':'['+partial.join(',')+']';gap=mind;return v;}
if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==='string'){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}
v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+
mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}
if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}
rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}
return str('',{'':value});};}
if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}
return reviver.call(holder,key,value);}
cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+
('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}
if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}
throw new SyntaxError('JSON.parse');};}})();JSORM.db.parser.json=JSORM.extend({},function(config){config=config||{};var id=config.id,root=config.root,lastMeta={},lastRoot={};JSORM.apply(this,{read:function(json){var data=null,p;p=JSON.parse(json);if(p&&typeof(p)==="object"){data={};if(p.isArray){data.records=p;data.id=id;}else{root=p.meta&&p.meta.root?p.meta.root:root;data.records=p[root];data.id=p.meta&&p.meta.id?p.meta.id:id;lastMeta=p.meta;lastRoot=root;}}
return(data);},write:function(records){var obj={};obj[lastRoot]=records;if(lastMeta){obj.meta=lastMeta;}
var j=JSON.stringify(obj);if(!j){throw{message:"JsonParser.write: unable to encode records into Json"};}
return(j);}});});JSORM.db.parser.object=JSORM.extend({},function(){var clone=JSORM.clone;JSORM.apply(this,{read:function(data){data=[].concat(clone(data,true));return{records:data};},write:function(records){return(clone(records,true));}});});}(typeof module==="undefined"||typeof module.exports==="undefined"?(this.JSORM===undefined?this.JSORM={}:this.JSORM):module.exports));