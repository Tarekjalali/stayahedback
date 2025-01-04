const Task = require('../Models/Task')
const crypto = require('crypto');



exports.updateTask = async (req, res) => {
  try {
      const { id } = req.params;
      const { title, deadline, isDone } = req.body;

      const updateData = {};

      
      if (title) {
          const iv = crypto.randomBytes(16); 
          const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
          let encryptedData = cipher.update(title, 'utf8', 'hex');
          encryptedData += cipher.final('hex');

          updateData.title = {
              encryptedData,
              iv: iv.toString('hex')
          };
      }

      
      if (deadline) {
          updateData.deadline = deadline;
      }

      
      if (typeof isDone === 'boolean') {
          updateData.isDone = isDone;
      }

      
     

      
      const updatedTask = await Task.findByIdAndUpdate(id, updateData, { new: true });

      
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


const secretKey = Buffer.from(process.env.SECRET_KEY, 'utf-8'); 
const iv = crypto.randomBytes(16); 

exports.createEncryptedTask = async (req, res) => {
    try {
      const { title, deadline, isDone, Taskowner } = req.body;
  
      
      const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
      let encryptedTitle = cipher.update(title, 'utf8', 'hex');
      encryptedTitle += cipher.final('hex');
  
      
      const newTask = new Task({
        title: {
          encryptedData: encryptedTitle, 
          iv: iv.toString('hex')
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
  
      
      const tasks = await Task.find({ Taskowner: id });
  
      
      const decryptedTasks = tasks.map(task => {
        const iv = Buffer.from(task.title.iv, 'hex'); 
        const encryptedTitle = task.title.encryptedData; 
  
        const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, iv); 
        let decryptedTitle = decipher.update(encryptedTitle, 'hex', 'utf8');
        decryptedTitle += decipher.final('utf8'); 
  
        
        return {
          ...task.toObject(), 
          title: decryptedTitle 
        };
      });
  
      res.status(200).send({ msg: "My tasks (decrypted)", tasks: decryptedTasks });
    } catch (error) {
      console.error(error);
      res.status(500).send({ errors: [{ msg: "Could not get decrypted tasks" }] });
    }
  };