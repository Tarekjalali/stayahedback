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

// Schedule cron job to run every minute for testing purposes
cron.schedule('* * * * *', async () => { // Runs every minute for testing
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    console.log(`Cron job started at: ${new Date()}`); // Log when the cron job starts

    try {
        const tasksDueToday = await Task.find({ deadline: today }).populate('Taskowner'); // Populate the owner field with user data
        console.log(`Tasks due today:`, tasksDueToday); // Log the tasks due today

        if (tasksDueToday.length > 0) {
            // Create a map to store tasks by user email
            const userTasksMap = {};

            // Loop through each task and organize them by user
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

            // Now loop through each user and send an email
            for (const [userEmail, taskList] of Object.entries(userTasksMap)) {
                // Prepare the email content
                const emailContent = `
Hello,

Your tasks for today are:

${taskList.join('\n')}

Remember, every task completed brings you closer to your goals. Keep up the great work!

Best regards,
Stay ahead team
                `;

                // Send the email
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: userEmail,
                    subject: 'Your Tasks for Today',
                    text: emailContent,
                };

                await transporter.sendMail(mailOptions);
                console.log(`Email sent successfully to ${userEmail}`); // Log successful email sending
            }
        } else {
            console.log('No tasks due today'); // Log if no tasks are due
        }
    } catch (error) {
        console.error(`Error fetching tasks with deadlines:`, error); // Log any error that occurs
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