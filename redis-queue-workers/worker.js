const { createClient } = require('redis');
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const client = createClient({ url: REDIS_URL });

async function processSubmission(submision){
    const {problemId, code ,language} = submision;
    console.log("Processing the submission for problemId :",problemId);
    console.log("Language:",language);
    console.log("code:",code);

    await new Promise(resolve=>setTimeout(resolve,1000));
    console.log('finished processing the submission for the problemId:',problemId);
}


async function startWorker(){
    try{
        await client.connect();
        console.log('Worker is connected to the redis');
        while(true){
            try{
                // BRPOP Returns the javascript object >> {key : problems, elememnt : {whatever}}
                const submission = await client.BRPOP("problems",0);
                await processSubmission(JSON.parse(submission.element));
            }
            catch(error){
                console.error('Error Processing submision',error);
            }
        }
    }
    catch(error){
        console.error('Failed to connect to redis:',error);
    }
}

startWorker();