const express = require('express')

const { createTask, getMyTasks, deleteTask, updateTask, createEncryptedTask, getMyTasksDecrypted } = require('../Controllers/Tasks')

const taskRouter = express.Router()


taskRouter.post('/createTask' , createTask)

taskRouter.post('/createEncryptedTask' , createEncryptedTask)

taskRouter.get('/getmyTasks/:id', getMyTasks)

taskRouter.get('/getmyTasksDecrypted/:id', getMyTasksDecrypted)

taskRouter.put('/updateTask/:id' , updateTask)

taskRouter.delete('/deleteTask/:id', deleteTask)



module.exports = taskRouter