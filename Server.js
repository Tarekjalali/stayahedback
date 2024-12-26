const express = require ('express');
const ConnectDB = require('./Config/ConnectDB');
const userRouter = require('./Routes/UserRoutes');
const taskRouter = require('./Routes/TaskRoutes');
const cors = require('cors');


const app = express()

app.use(cors())


require('dotenv').config();
app.use(express.json());
ConnectDB()

app.use('/api/users', userRouter)
app.use('/api/tasks', taskRouter)



app.listen(process.env.port , console.log(`server is running on port ${process.env.port}`) )