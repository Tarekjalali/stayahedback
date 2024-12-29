const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  isDone: {
    type: Boolean,
    default: false,
  },
  Taskowner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel', 
    required: true,
  },
});

module.exports = mongoose.model('Task', taskSchema);
