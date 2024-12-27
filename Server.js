const express = require('express');
const ConnectDB = require('./Config/ConnectDB');
const userRouter = require('./Routes/UserRoutes');
const taskRouter = require('./Routes/TaskRoutes');
const Task = require('./Models/Task');
const User = require('./Models/User'); // Import the User model
const transporter = require('./Config/EmailTransporter'); // Import nodemailer transporter
const cors = require('cors');


const app = express();

app.use(cors({
    origin: '*', // Allow all origins (for testing only)
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Include methods your app supports
    credentials: true // If you're using cookies or authentication
  }));

// Schedule cron job to run every day at 8 AM
const cron = require('node-cron');

cron.schedule('22 17 * * *', async () => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    try {
        const tasksDueToday = await Task.find({ deadline: today }).populate('owner'); // Populate the owner field with user data

        if (tasksDueToday.length > 0) {
            // Loop through each task and build the task list
            const taskList = tasksDueToday.map(task => `- ${task.title}`).join('\n');

            // Get the user email (assuming only one user is receiving it, if not loop through users)
            const userEmail = tasksDueToday[0].owner.email; 

            // Prepare the email content
            const emailContent = `
Hello ${tasksDueToday[0].owner.name},

Your tasks for today are:

${taskList}

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
            console.log('Email sent successfully');
        } else {
            console.log('No tasks due today');
        }
    } catch (error) {
        console.error('Error fetching tasks with deadlines:', error);
    }
});


require('dotenv').config();
app.use(express.json());
ConnectDB();

app.use('/api/users', userRouter);
app.use('/api/tasks', taskRouter);

app.listen(process.env.port, console.log(`Server is running on port ${process.env.port}`));
