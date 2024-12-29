const express = require('express');
const Task = require('../Models/Task');
const transporter = require('../Config/EmailTransporter'); 
const { checkDeadlines } = require('../Controllers/Cron');

const CronRouter = express.Router();


CronRouter.get('/check-deadlines',checkDeadlines);

module.exports = CronRouter;
