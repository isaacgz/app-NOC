// import { envs } from '../config/plugins/envs.plugin';
import { Server } from "./presentation/server";
import 'dotenv/config';



(async() => {
    await main();
})();

async function main(){
    await Server.start();

    // Manejar señales de terminación para cleanup graceful
    process.on('SIGTERM', async () => {
        console.log('\n📡 Received SIGTERM signal');
        await Server.stop();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('\n📡 Received SIGINT signal (Ctrl+C)');
        await Server.stop();
        process.exit(0);
    });

    // console.log(envs)
}
