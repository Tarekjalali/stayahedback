const express = require('express')
const Task = require('../Models/Task')
const { createTask, getMyTasks, deleteTask } = require('../Controllers/Tasks')

const taskRouter = express.Router()


taskRouter.post('/createTask' , createTask)

taskRouter.get('/getmyTasks/:id', getMyTasks)

taskRouter.put('/updateTask/:id' , updateTask)

taskRouter.delete('/deleteTask/:id', deleteTask)



module.exports = taskRouter