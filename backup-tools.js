function collectRun58Data(){
  const data={};
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(key&&key.startsWith("run58_"))data[key]=localStorage.getItem(key);
  }
  return data;
}

async function copyRun58Data(){
  const text=JSON.stringify(collectRun58Data(),null,2);
  try{
    await navigator.clipboard.writeText(text);
    alert("훈련 데이터를 복사했습니다. ChatGPT 채팅에 그대로 붙여넣어 주세요.");
  }catch(e){
    const area=document.createElement("textarea");
    area.value=text;
    area.setAttribute("readonly","");
    area.style.position="fixed";
    area.style.left="-9999px";
    document.body.appendChild(area);
    area.select();
    const ok=document.execCommand("copy");
    area.remove();
    alert(ok?"훈련 데이터를 복사했습니다. ChatGPT 채팅에 그대로 붙여넣어 주세요.":"자동 복사에 실패했습니다. JSON 파일 공유를 사용해 주세요.");
  }
}

async function shareRun58Data(){
  const text=JSON.stringify(collectRun58Data(),null,2);
  const file=new File([text],"run58-localStorage.json",{type:"application/json"});
  try{
    if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
      await navigator.share({title:"RUN58 훈련 데이터",text:"RUN58 localStorage 백업",files:[file]});
      return;
    }
  }catch(e){
    if(e&&e.name==="AbortError")return;
  }
  const blob=new Blob([text],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="run58-localStorage.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
