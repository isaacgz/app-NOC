// import { envs } from '../config/plugins/envs.plugin';
import { Server } from "./presentation/server";
import 'dotenv/config';



(async() => {
    await main();
})();

async function main(){
    await Server.start();

    // console.log(envs)
}
