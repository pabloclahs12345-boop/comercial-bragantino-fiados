const http=require("http"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const PORT = process.env.PORT || 3000;
const empty=()=>({users:[{user:"admin",pass:"1234"}],clients:[],debts:[],payments:[],logs:[]});
function read(){if(!fs.existsSync(DB))fs.writeFileSync(DB,JSON.stringify(empty(),null,2));try{return JSON.parse(fs.readFileSync(DB,"utf8"))}catch{return empty()}}
function save(d){fs.writeFileSync(DB,JSON.stringify(d,null,2))}
function money(v){let s=String(v??"").trim().replace(/\s/g,"");if(s.includes(",")&&s.includes("."))s=s.replace(/\./g,"").replace(",",".");else s=s.replace(",",".");let n=Number(s);return Number.isFinite(n)?Math.round(n*100)/100:0}
function send(r,c,d,t="application/json"){r.writeHead(c,{"Content-Type":t,"Cache-Control":"no-store"});r.end(t.includes("json")?JSON.stringify(d):d)}
function body(q){return new Promise((ok,no)=>{let b="";q.on("data",x=>b+=x);q.on("end",()=>{try{ok(b?JSON.parse(b):{})}catch(e){no(e)}})})}
function due(D,id){let a=D.debts.filter(x=>x.clientId===id).reduce((s,x)=>s+money(x.amount),0),p=D.payments.filter(x=>x.clientId===id).reduce((s,x)=>s+money(x.amount),0);return Math.max(0,Math.round((a-p)*100)/100)}
function log(D,user,action,detail){D.logs.push({id:crypto.randomUUID(),user,action,detail,date:new Date().toISOString()})}
const file=(n)=>fs.readFileSync(path.join(__dirname,n));
const mime={".html":"text/html; charset=utf-8",".js":"application/javascript",".css":"text/css",".json":"application/json",".png":"image/png",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"};
const server=http.createServer(async(q,r)=>{
 try{
  const u=new URL(q.url,"http://localhost"),D=read();
  if(q.method==="GET"){
   if(u.pathname==="/")return send(r,200,file("index.html").toString(),"text/html; charset=utf-8");
   if(u.pathname==="/sw.js")return send(r,200,file("sw.js").toString(),"application/javascript");
   let p=path.join(__dirname,u.pathname.replace(/^\/+/,"")); if(fs.existsSync(p)&&fs.statSync(p).isFile())return send(r,200,file(path.basename(p)).toString(),mime[path.extname(p)]||"text/plain");
  }
  if(q.method==="POST"&&u.pathname==="/api/login"){let b=await body(q),x=D.users.find(x=>x.user===b.user&&x.pass===b.pass);if(!x)return send(r,401,{error:"Usuário ou senha inválidos."});return send(r,200,{user:x.user,token:"local-"+crypto.randomUUID()})}
  if(!q.headers.authorization)return send(r,401,{error:"Faça login novamente."});
  if(q.method==="GET"&&u.pathname==="/api/state")return send(r,200,{clients:D.clients.map(c=>({...c,due:due(D,c.id),available:Math.max(0,money(c.limit)-due(D,c.id))})),debts:D.debts,payments:D.payments,logs:D.logs});
  if(q.method==="POST"&&u.pathname==="/api/clients"){let b=await body(q);if(!b.name?.trim())return send(r,400,{error:"Informe o nome."});let c={id:crypto.randomUUID(),name:b.name.trim(),phone:b.phone||"",cpf:b.cpf||"",limit:money(b.limit),note:b.note||"",createdAt:new Date().toISOString()};D.clients.push(c);log(D,b.user||"admin","cliente_criado",c.name);save(D);return send(r,200,c)}
  if(q.method==="PUT"&&u.pathname.startsWith("/api/clients/")){let id=u.pathname.split("/").pop(),c=D.clients.find(x=>x.id===id);if(!c)return send(r,404,{error:"Cliente não encontrado."});let b=await body(q);Object.assign(c,{name:String(b.name||"").trim(),phone:b.phone||"",cpf:b.cpf||"",limit:money(b.limit),note:b.note||""});log(D,b.user||"admin","cliente_editado",c.name);save(D);return send(r,200,c)}
  if(q.method==="DELETE"&&u.pathname.startsWith("/api/clients/")){let id=u.pathname.split("/").pop();if(due(D,id)>0)return send(r,400,{error:"Não é possível excluir cliente com dívida em aberto."});D.clients=D.clients.filter(x=>x.id!==id);log(D,"admin","cliente_excluido",id);save(D);return send(r,200,{ok:true})}
  if(q.method==="POST"&&u.pathname==="/api/debts"){let b=await body(q),c=D.clients.find(x=>x.id===b.clientId),a=money(b.amount);if(!c)return send(r,404,{error:"Cliente não encontrado."});if(a<=0)return send(r,400,{error:"Valor inválido."});if(money(c.limit)>0&&due(D,c.id)+a>money(c.limit))return send(r,400,{error:`Limite excedido. Disponível: R$ ${Math.max(0,c.limit-due(D,c.id)).toFixed(2).replace(".",",")}`});let x={id:crypto.randomUUID(),clientId:c.id,description:b.description||"Compra fiado",amount:a,date:b.date||new Date().toISOString().slice(0,10),dueDate:b.dueDate||"",note:b.note||"",createdAt:new Date().toISOString()};D.debts.push(x);log(D,b.user||"admin","debito",c.name+" — "+a);save(D);return send(r,200,x)}
  if(q.method==="POST"&&u.pathname==="/api/payments"){let b=await body(q),a=money(b.amount),d=due(D,b.clientId),c=D.clients.find(x=>x.id===b.clientId);if(!c)return send(r,404,{error:"Cliente não encontrado."});if(a<=0||a>d)return send(r,400,{error:`Pagamento inválido. Dívida atual: R$ ${d.toFixed(2).replace(".",",")}`});let x={id:crypto.randomUUID(),clientId:b.clientId,amount:a,date:b.date||new Date().toISOString().slice(0,10),method:b.method||"Não informado",note:b.note||"",createdAt:new Date().toISOString()};D.payments.push(x);log(D,b.user||"admin","pagamento",c.name+" — "+a);save(D);return send(r,200,x)}
  if(q.method==="POST"&&u.pathname==="/api/password"){let b=await body(q),x=D.users[0];if(x.user!==b.currentUser||x.pass!==b.currentPass)return send(r,401,{error:"Senha atual incorreta."});if(!b.newUser||!b.newPass||b.newPass!==b.confirm)return send(r,400,{error:"Preencha e confirme a nova senha."});x.user=b.newUser;x.pass=b.newPass;save(D);return send(r,200,{user:x.user})}
  if(q.method==="POST"&&u.pathname==="/api/restore"){let b=await body(q);if(!b.data||!Array.isArray(b.data.clients))return send(r,400,{error:"Backup inválido."});fs.writeFileSync(DB,JSON.stringify(b.data,null,2));return send(r,200,{ok:true})}
  if(q.method==="POST"&&u.pathname==="/api/clear"){fs.writeFileSync(DB,JSON.stringify(empty(),null,2));return send(r,200,{ok:true})}
  send(r,404,{error:"Não encontrado."});
 }catch(e){console.error(e);send(r,500,{error:e.message})}
});
server.listen(PORT,"0.0.0.0",()=>console.log(`Controle de Fiados: http://localhost:${PORT}`));
