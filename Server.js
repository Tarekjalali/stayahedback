const express = require('express');
const ConnectDB = require('./Config/ConnectDB');
const userRouter = require('./Routes/UserRoutes');
const taskRouter = require('./Routes/TaskRoutes');
const cronRouter = require('./Routes/CronRoutes');
const Task = require('./Models/Task');
const User = require('./Models/User'); // Import the User model
const transporter = require('./Config/EmailTransporter'); // Import nodemailer transporter
const cors = require('cors');
const cron = require('node-cron');

require('dotenv').config();

const app = express();

app.use(cors({
    origin: '*', // Allow all origins (for testing only)
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Include methods your app supports
    credentials: true // If you're using cookies or authentication
}));

cron.schedule('59 14 * * *', async () => { // Runs every day at 12:00 PM
    console.log(`Cron job started at: ${new Date()}`); // Log when the cron job starts

    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    try {
        const tasksDueToday = await Task.find({ deadline: today }).populate('Taskowner'); // Populate the owner field with user data
        console.log(`Tasks due today:`, tasksDueToday); // Log the tasks due today

        if (tasksDueToday.length > 0) {
            const userTasksMap = {};

            tasksDueToday.forEach(task => {
                if (!task.Taskowner || !task.Taskowner.email) {
                    console.error(`Task "${task.title}" is missing Taskowner or email.`);
                    return;
                }

                const userEmail = task.Taskowner.email;
                if (!userTasksMap[userEmail]) {
                    userTasksMap[userEmail] = [];
                }
                userTasksMap[userEmail].push(`- ${task.title}`);
            });

            for (const [userEmail, taskList] of Object.entries(userTasksMap)) {
                const emailContent = `
Hello,

Your tasks for today are:

${taskList.join('\n')}

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
