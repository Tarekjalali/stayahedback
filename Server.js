cron.schedule('* * * * *', async () => { // Runs every minute for testing
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    console.log('Cron job started at:', new Date()); // Log when the cron job starts

    try {
        const tasksDueToday = await Task.find({ deadline: today }).populate('owner'); // Populate the owner field with user data
        console.log('Tasks due today:', tasksDueToday); // Log the tasks due today

        if (tasksDueToday.length > 0) {
            // Create a map to store tasks by user email
            const userTasksMap = {};

            // Loop through each task and organize them by user
            tasksDueToday.forEach(task => {
                const userEmail = task.owner.email;

                // If the user is not in the map, initialize an empty array for them
                if (!userTasksMap[userEmail]) {
                    userTasksMap[userEmail] = [];
                }

                // Add the task to the user's task list
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
        console.error('Error fetching tasks with deadlines:', error); // Log any error that occurs
    }
});
