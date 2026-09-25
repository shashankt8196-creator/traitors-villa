const button=document.querySelector('#update'),status=document.querySelector('#status');
let requested=false,timeout;
const fail=message=>{clearTimeout(timeout);requested=false;button.disabled=false;status.textContent=message;};
if(!('serviceWorker' in navigator))fail('This browser cannot install the offline update. Open the game in Safari or Chrome.');
else{
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(requested)location.replace('./');});
  navigator.serviceWorker.addEventListener('message',event=>{
    if(event.data?.type==='UPDATE_BLOCKED')fail('Another game window is still open. Close it, then try again here.');
  });
  button.addEventListener('click',async()=>{
    button.disabled=true;status.textContent='Checking the published files…';
    try{
      const registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
      await registration.update();
      const worker=registration.installing;
      if(worker&&worker.state!=='installed'&&worker.state!=='activated')await new Promise((resolve,reject)=>{
        const limit=setTimeout(()=>reject(new Error('The download is taking longer than expected. Check your connection and try again.')),20000);
        worker.addEventListener('statechange',()=>{
          if(['installed','activated'].includes(worker.state)){clearTimeout(limit);resolve();}
          if(worker.state==='redundant'){clearTimeout(limit);reject(new Error('The update did not finish downloading. Wait for GitHub to finish publishing, then try again.'));}
        });
      });
      if(registration.waiting){
        requested=true;status.textContent='Loading the new version. Your game is saved.';
        timeout=setTimeout(()=>fail('Close other game windows, then try again. Your saved game has not been changed.'),15000);
        registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
      }else{
        status.textContent='The published version is ready. Opening your game…';
        location.replace('./');
      }
    }catch(error){fail(error.message||'Could not check for updates. Check your connection and try again.');}
  });
}
