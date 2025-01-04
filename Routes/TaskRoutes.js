const express = require('express')

const { deleteTask, updateTask, createEncryptedTask, getMyTasksDecrypted } = require('../Controllers/Tasks')

const taskRouter = express.Router()




taskRouter.post('/createEncryptedTask' , createEncryptedTask)


taskRouter.get('/getmyTasksDecrypted/:id', getMyTasksDecrypted)

taskRouter.put('/updateTask/:id' , updateTask)

taskRouter.delete('/deleteTask/:id', deleteTask)



module.exports = taskRouter