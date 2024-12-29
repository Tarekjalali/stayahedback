const crypto = require('crypto');
const Task = require('../Models/Task');

// Encryption function (same as before)
function encryptTask(task) {
  const SECRET_KEY = process.env.SECRET_KEY || 'your-256-bit-secret'; // Use a secure secret key
  const IV = crypto.randomBytes(16); // Random initialization vector
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET_KEY, 'hex'), IV);
  let encrypted = cipher.update(task, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encryptedTask: encrypted, iv: IV.toString('hex') };
}

// Decryption function (same as before)
function decryptTask(encryptedTask, iv) {
  const SECRET_KEY = process.env.SECRET_KEY || 'your-256-bit-secret'; // Use a secure secret key
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(SECRET_KEY, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedTask, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Create Task Route
exports.createTask = async (req, res) => {
  try {
    const { title, deadline, Taskowner } = req.body;

    // Encrypt the task title
    const { encryptedTask, iv } = encryptTask(title);

    // Save encrypted task and IV to the database
    const newTask = new Task({
      title: encryptedTask,
      deadline,
      Taskowner,
      iv,
    });

    await newTask.save();
    res.status(200).send('Task created');
  } catch (error) {
    res.status(500).send({ errors: [{ msg: 'Could not create task' }] });
  }
};

// Get My Tasks Route
exports.getMyTasks = async (req, res) => {
  try {
    const { id } = req.params;
    const tasks = await Task.find({ Taskowner: id });

    // Decrypt each task's title
    const decryptedTasks = tasks.map(task => ({
      taskId: task._id,
      title: decryptTask(task.title, task.iv), // Decrypt the title
      deadline: task.deadline,
      isDone: task.isDone,
    }));

    res.status(200).send({ msg: 'My tasks', tasks: decryptedTasks });
  } catch (error) {
    res.status(500).send({ errors: [{ msg: 'Could not get tasks' }] });
  }
};

// Update Task Route
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, deadline, isDone } = req.body;

    // If the title is updated, re-encrypt it
    let updatedData = { deadline, isDone };

    if (title) {
      const { encryptedTask, iv } = encryptTask(title); // Encrypt the new title
      updatedData.title = encryptedTask;
      updatedData.iv = iv;
    }

    // Update the task in the database
    await Task.findByIdAndUpdate(id, updatedData);

    res.status(200).send({ msg: 'Task updated' });
  } catch (error) {
    res.status(500).send({ errors: [{ msg: 'Could not update task' }] });
  }
};

// Delete Task Route
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    await Task.findByIdAndDelete(id);

    res.status(200).send('Task deleted');
  } catch (error) {
    res.status(500).send({ errors: [{ msg: 'Could not delete task' }] });
  }
};
