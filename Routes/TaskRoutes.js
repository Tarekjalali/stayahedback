const express = require('express')
const Task = require('../Models/Task')

const taskRouter = express.Router()


taskRouter.post('/createTask' , async (req,res)=>{

    try {

        const newTask = await new Task(req.body)
        await newTask.save()
        res.status(200).send('task created')

        
    } catch (error) {
        res.status(500).send({errors : [{msg : "could not create task"}]})
    }

})

taskRouter.get('/getmyTasks/:id', async (req, res) => {
    try {
        const { id } = req.params
        // Find tasks where the owner is the given user ID
        const tasks = await Task.find({ owner: id })

        res.status(200).send({ msg: "My tasks", tasks })
    } catch (error) {
        res.status(500).send({ errors: [{ msg: "Could not get tasks" }] })
    }
})

taskRouter.put('/updateTask/:id' , async(req,res)=>{

    try {

        const {id} = req.params
        await Task.findByIdAndUpdate(id, req.body)
        res.status(200).send({msg : "task updated"})
        
    } catch (error) {
        res.status(500).send({ errors: [{ msg: "Could not update task" }] })
    }

})

taskRouter.delete('/deleteTask/:id', async(req,res)=>{

    try {
        const {id} = req.params

        await Task.findByIdAndDelete(id)

        res.status(200).send('task deleted')
        
    } catch (error) {
        res.status(500).send({ errors: [{ msg: "Could not delete task" }] })
    }

})



module.exports = taskRouter