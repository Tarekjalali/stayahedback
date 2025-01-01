exports.checkDeadlines =  async (req, res) => {
    const today = new Date().toISOString().split('T')[0]; 

    try {
        const tasksDueToday = await Task.find({ deadline: today }).populate('Taskowner'); 

        if (tasksDueToday.length > 0) {
            const taskList = tasksDueToday.map(task => `- ${task.title}`).join('\n');
            const userEmail = tasksDueToday[0].Taskowner.email; 

            const emailContent = `
Hello ${tasksDueToday[0].Taskowner.name},

Your tasks for today are:

${taskList}

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
            res.status(200).send('Emails sent successfully');
        } else {
            res.status(200).send('No tasks due today');
        }
    } catch (error) {
        console.error('Error fetching tasks with deadlines:', error);
        res.status(500).send({msg : error});
    }
}