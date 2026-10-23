const {app,safeStorage}=require('electron');
app.whenReady().then(async()=>{
 try{if(!await safeStorage.isAsyncEncryptionAvailable())throw new Error('Protección no disponible.');const encrypted=await safeStorage.encryptStringAsync('vetcare-offline-probe');if((await safeStorage.decryptStringAsync(encrypted)).result!=='vetcare-offline-probe')throw new Error('Verificación fallida.');console.log('Protección de secretos de Electron: cifrado y descifrado verificados.');app.exit(0);}
 catch(error){console.error('No se pudo verificar la protección de secretos de Electron: '+(error instanceof Error?error.message:'error no identificado'));app.exit(1);}
});
