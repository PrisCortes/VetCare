const {app,safeStorage}=require('electron');
app.whenReady().then(async()=>{
 try{if(!await safeStorage.isAsyncEncryptionAvailable())throw new Error('Protección no disponible.');const encrypted=await safeStorage.encryptStringAsync('vetcare-offline-probe');if(await safeStorage.decryptStringAsync(encrypted)!=='vetcare-offline-probe')throw new Error('Verificación fallida.');console.log('Protección de secretos de Electron: cifrado y descifrado verificados.');app.exit(0);}
 catch{console.error('No se pudo verificar la protección de secretos de Electron.');app.exit(1);}
});
