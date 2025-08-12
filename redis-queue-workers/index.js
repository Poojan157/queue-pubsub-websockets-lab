const express = require('express');
const { createClient } = require('redis');

const app = express();
const PORT = 3000;

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const client = createClient({ url: REDIS_URL });

client.on('error', err => console.log('Redis Client Error', err));


// Four worker servers will be running right now in the 4 separate docker containers
// Main server running on some other Docker container
// Redis server running on some other Docker container
// main server pushes to the redis queue
// 4 workers will pick up the work from queue using the BRPOP key 0


app.use(express.json());

app.post('/submit',async(req,res)=>{
    try{
        const {problemId , code , language } = req.body;

        await client.LPUSH("problems",JSON.stringify({
            problemId:problemId,
            code : code,
            language:language
        }));

        res.status(200).send("Submission Received and stored in the database");
    }
    catch(error){
        console.error(`Redis Error: ${error}`);
        res.status(500).send('Failed to store the submission');
    }
})


async function startServer(){
    try{
        await client.connect();
        console.log('Successfully connected to redis');
        app.listen(PORT,()=>{
            console.log('http server running on port : 3000');
        });

    }
    catch(error){
        console.error('Failed to connect to redis:',error);
    }
}


startServer();