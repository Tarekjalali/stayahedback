const express = require('express');
const ConnectDB = require('./Config/ConnectDB');
const userRouter = require('./Routes/UserRoutes');
const taskRouter = require('./Routes/TaskRoutes');
const cronRouter = require('./Routes/CronRoutes');
const Task = require('./Models/Task');
const User = require('./Models/User'); 
const transporter = require('./Config/EmailTransporter'); 
const cors = require('cors');
const cron = require('node-cron');
const crypto = require('crypto'); 


require('dotenv').config();

const app = express();

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true 
}));

const secretKey = Buffer.from(process.env.SECRET_KEY, 'utf-8');

cron.schedule('0 7 * * *', async () => { 
    console.log(`Cron job started at: ${new Date()}`); 

    const today = new Date().toISOString().split('T')[0]; 

    try {
        const tasksDueToday = await Task.find({ deadline: today }).populate('Taskowner'); 
        console.log(`Tasks due today:`, tasksDueToday); 

        if (tasksDueToday.length > 0) {
            const userTasksMap = {};

            tasksDueToday.forEach(task => {
                if (!task.Taskowner || !task.Taskowner.email) {
                    console.error(`Task "${task.title}" is missing Taskowner or email.`);
                    return;
                }

                const userEmail = task.Taskowner.email;
                const userName = task.Taskowner.name || 'User'; 

               
                const iv = Buffer.from(task.title.iv, 'hex'); 
                const encryptedTitle = task.title.encryptedData;

                const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, iv);
                let decryptedTitle = decipher.update(encryptedTitle, 'hex', 'utf8');
                decryptedTitle += decipher.final('utf8');

                if (!userTasksMap[userEmail]) {
                    userTasksMap[userEmail] = { name: userName, tasks: [] };
                }
                userTasksMap[userEmail].tasks.push(`- ${decryptedTitle}`); 
            });

            for (const [userEmail, { name, tasks }] of Object.entries(userTasksMap)) {
                const emailContent = `
Hello ${name},

Your tasks for today are:

${tasks.join('\n')}

Remember, every task completed brings you closer to your goals. Keep up the great work!

Best regards,
Stay ahead team
                `;

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: userEmail,
                    subject: 'Your Tasks for Today',
                    text: emailContent,
                };

                await transporter.sendMail(mailOptions);
                console.log(`Email sent successfully to ${userEmail}`);
            }
        } else {
            console.log('No tasks due today');
        }
    } catch (error) {
        console.error(`Error fetching tasks with deadlines:`, error);
    }
});

app.use(express.json());
ConnectDB();

app.use('/api/users', userRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/cron', cronRouter);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
