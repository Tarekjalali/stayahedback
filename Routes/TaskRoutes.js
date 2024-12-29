const express = require('express')

const { createTask, getMyTasks, deleteTask, updateTask } = require('../Controllers/Tasks')

const taskRouter = express.Router()


taskRouter.post('/createTask' , createTask)

taskRouter.get('/getmyTasks/:id', getMyTasks)

taskRouter.put('/updateTask/:id' , updateTask)

taskRouter.delete('/deleteTask/:id', deleteTask)



module.exports = taskRouter