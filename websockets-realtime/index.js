/*
Flow Description:

1. Client establishes a WebSocket (WS) connection to the server.

2. After the WS connection is established, the client sends an HTTP request:
   { problemId, code, language }

3. Server receives the HTTP request:
   - Associates the problemId with the client’s existing WS connection
     (subscribes this WS connection to the corresponding Redis Pub/Sub channel).
   - Enqueues the submission into a processing queue.
   - Sends back an HTTP response indicating: 
     { status: "pending", message: "Submission received" }

4. The queue forwards the submission to a worker service for processing.

5. The worker evaluates the submission and determines the result
   (e.g., Accepted, TLE, WA, etc.), then publishes this result
   to the problemId’s Redis Pub/Sub channel.

6. The server receives the published result via Redis Pub/Sub and sends it
   over the corresponding WS connection to the client.

7. The client receives the result in real time through the WS connection
   and updates the UI accordingly.
*/


const express = require('express');
const WebSocket = require('ws');
const {createClient} = require('redis');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const port = 3000;
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const client = createClient({url:REDIS_URL});

client.on('error',err=>console.log('Redis Client Error',err));

async function startServer(){
    try{
        await client.connect();
        console.log('Connected to redis queue client successfully');
        
        const server = app.listen(port,()=>{
            console.log(`Server is running on port ${port}`);
        });
        
        const wss = new WebSocket.Server({server});
    
        const subscribe = client.duplicate();
        await subscribe.connect();

        await subscribe.subscribe('problem_done',(message)=>{
            for(const socket of wss.clients){
                if(socket.readyState === WebSocket.OPEN){
                    socket.send(message);
                }
            }
        });
        
        wss.on('connection',(ws)=>{
            console.log('client connected');
            
            ws.on('close',()=>{
                console.log('Client disconnected');
            });
        });


        process.on('SIGINT', async () => {
            console.log('Shutting down…');
            try {
                // Stop accepting new HTTP/WebSocket connections
                server.close(err => {
                if (err) console.error('Error closing HTTP server:', err);
                });
                
                // Unsubscribe and quit the Redis subscriber
                await subscribe.unsubscribe('problem_done');
                await subscribe.quit();
                
                // Quit the main Redis client
                await client.quit();
                
                console.log('Cleanup complete, exiting.');
                process.exit(0);
            } catch (err) {
                console.error('Error during shutdown:', err);
                process.exit(1);
            }
        });

    }
    catch(error){
        console.error(`Error connecting to redis: ${error}`);
    }
}

startServer();

app.post('/submit',async(req,res)=>{
    try{
        const {problemId, code, language} = req.body;
        await client.LPUSH('problems',JSON.stringify({
            problemId : problemId,
            code : code,
            language : language
        }));

        res.status(200).send('Submission received and is being processed');
    }
    catch(error){
        console.error('Error while pushing into the redis queue:',error);
        res.status(400).send("Some error occured");
    }
});
