const Task = require('../Models/Task')

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

exports.updateTask = async(req,res)=>{

    try {

        const {id} = req.params
        await Task.findByIdAndUpdate(id, req.body)
        res.status(200).send({msg : "task updated"})
        
    } catch (error) {
        res.status(500).send({ errors: [{ msg: "Could not update task" }] })
    }

}

exports.deleteTask = async(req,res)=>{

    try {
        const {id} = req.params

        await Task.findByIdAndDelete(id)

        res.status(200).send('task deleted')
        
    } catch (error) {
        res.status(500).send({ errors: [{ msg: "Could not delete task" }] })
    }

}