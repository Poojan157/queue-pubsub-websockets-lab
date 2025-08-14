const { createClient } = require('redis');
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

const client = createClient({url : REDIS_URL});
const publisher = client.duplicate();

async function processingSubmission(submission) {
    const { problemId, code, language } = submission;
    console.log("Processing the submission for problemId :", problemId);
    console.log("Language:", language);
    console.log("code:", code);
    // simulating the work below
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('finished processing the submission for the problemId:', problemId);
}

async function startWorker() {
    let running = true; // flag to allow graceful loop exit

    try {
        await client.connect();
        console.log('Redis Client Connected to worker');
        await publisher.connect();
        console.log('Redis publisher connected to worker');

        // graceful shutdown handler
        process.on('SIGINT', async () => {
            console.log('Shutting down gracefully…');
            running = false;
            try {
                await publisher.quit();
                await client.quit();
                console.log('All Redis connections closed. Exiting.');
            } catch (err) {
                console.error('Error during shutdown:', err);
            } finally {
                process.exit(0);
            }
        });

        // main work loop
        while (running) {
            try {
                // use a finite timeout so we can check `running` flag
                const submission = await client.brPop('problems', 20);
                if (!submission) continue; // no job, re-check loop flag

                await processingSubmission(JSON.parse(submission.element));

                // publish to the redis pubSub channel problem_done along with the status
                const status = ['Accepted', 'Wrong Answer', 'Time Limit Exceeded'];
                const evaluated_submission = JSON.parse(submission.element);
                evaluated_submission.status = status[Math.floor(Math.random() * 3)];

                await publisher.publish('problem_done', JSON.stringify(evaluated_submission));

            } catch (error) {
                console.error('Error processing submission', error);
                // small backoff to avoid hot-looping on errors
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

    } catch (error) {
        console.error('Failed to connect to redis', error);
        process.exit(1);
    }
}

startWorker();