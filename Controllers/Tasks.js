const Task = require('../Models/Task')
const crypto = require('crypto');

exports.createTask =  async (req,res)=>{

    try {

        const newTask = await new Task(req.body)
        await newTask.save()
        res.status(200).send('task created')

        
    } catch (error) {
        res.status(500).send({errors : [{msg : "could not create task"}]})
    }

}

exports.getMyTasks = async (req, res) => {
    try {
        const { id } = req.params
        
        const tasks = await Task.find({ Taskowner: id })

        res.status(200).send({ msg: "My tasks", tasks })
    } catch (error) {
        res.status(500).send({ errors: [{ msg: "Could not get tasks" }] })
    }
}

exports.updateTask = async (req, res) => {
    try {
      const { id } = req.params;
      const { title, deadline } = req.body;
  
      // Prepare update data
      const updateData = {};
  
      // If title is provided, encrypt it before updating
      if (title) {
        const iv = crypto.randomBytes(16); // Generate a random IV
        const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
        let encryptedData = cipher.update(title, 'utf8', 'hex');
        encryptedData += cipher.final('hex');
  
        // Store the encrypted title and IV
        updateData.title = {
          encryptedData,
          iv: iv.toString('hex')
        };
      }
  
      // If deadline is provided, update it
      if (deadline) {
        updateData.deadline = deadline;
      }
  
      // If neither title nor deadline are provided, return an error
      if (Object.keys(updateData).length === 0) {
        return res.status(400).send({ errors: [{ msg: "Either title or deadline must be provided" }] });
      }
  
      // Update the task with the new data (title and/or deadline)
      const updatedTask = await Task.findByIdAndUpdate(id, updateData, { new: true });
  
      // Send response with updated task
      res.status(200).send({ msg: "Task updated", updatedTask });
    } catch (error) {
      console.error(error);
      res.status(500).send({ errors: [{ msg: "Could not update task" }] });
    }
  };

exports.deleteTask = async(req,res)=>{

    try {
        const {id} = req.params

        await Task.findByIdAndDelete(id)

        res.status(200).send('task deleted')
        
    } catch (error) {
        res.status(500).send({ errors: [{ msg: "Could not delete task" }] })
    }

}


const secretKey = Buffer.from('myverysecurekey12345678901234567', 'utf-8'); // 32-byte key
const iv = crypto.randomBytes(16); // 16-byte IV for AES-256-CBC

exports.createEncryptedTask = async (req, res) => {
    try {
      const { title, deadline, isDone, Taskowner } = req.body;
  
      // Encrypt the title
      const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
      let encryptedTitle = cipher.update(title, 'utf8', 'hex');
      encryptedTitle += cipher.final('hex');
  
      // Create the task with the encrypted title and other fields
      const newTask = new Task({
        title: {
          encryptedData: encryptedTitle, // Encrypted title
          iv: iv.toString('hex') // Store the IV as a hex string
        },
        deadline,
        isDone,
        Taskowner
      });
  
      await newTask.save();
  
      res.status(200).send('Encrypted task created');
    } catch (error) {
      console.error(error);
      res.status(500).send({ errors: [{ msg: "Could not create encrypted task" }] });
    }
  };


  exports.getMyTasksDecrypted = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Fetch tasks for the specified Taskowner
      const tasks = await Task.find({ Taskowner: id });
  
      // Decrypt the title for each task
      const decryptedTasks = tasks.map(task => {
        const iv = Buffer.from(task.title.iv, 'hex'); // Convert the stored IV back to a buffer
        const encryptedTitle = task.title.encryptedData; // Get the encrypted title
  
        const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, iv); // Use the same secret key and IV
        let decryptedTitle = decipher.update(encryptedTitle, 'hex', 'utf8');
        decryptedTitle += decipher.final('utf8'); // Final decryption step
  
        // Return the decrypted task with the decrypted title
        return {
          ...task.toObject(), // Convert Mongoose document to plain JavaScript object
          title: decryptedTitle // Replace the encrypted title with the decrypted title
        };
      });
  
      res.status(200).send({ msg: "My tasks (decrypted)", tasks: decryptedTasks });
    } catch (error) {
      console.error(error);
      res.status(500).send({ errors: [{ msg: "Could not get decrypted tasks" }] });
    }
  };