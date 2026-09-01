self.addEventListener("push",event=>{
  let data={title:"🏃 STYLE RUN 일정 변경",body:"날씨에 따라 훈련 일정이 변경되었습니다.",url:"./",tag:"run10k-weather-schedule"};
  try{if(event.data)data={...data,...JSON.parse(event.data.text())}}catch(error){console.error("Invalid push payload",error)}
  event.waitUntil(self.registration.showNotification(data.title,{body:data.body,tag:data.tag,renotify:true,data:{url:data.url||"./"}}));
});

self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||"./",self.location.href).href;
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const client of list){if(new URL(client.url).origin===new URL(target).origin){client.navigate(target);return client.focus()}}
    return clients.openWindow(target);
  }));
});
