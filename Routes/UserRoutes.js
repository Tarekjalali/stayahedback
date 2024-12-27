const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../Models/User');
const Task = require('../Models/Task'); // Import Task model
const transporter = require('../Config/EmailTransporter');
const { validationCreate, Validation } = require('../MiddleWares/Validator');
const { IsAuthorized } = require('../MiddleWares/IsAuthorized');

const userRouter = express.Router();

userRouter.post('/createAccount', validationCreate, Validation, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const found = await User.findOne({ email });
    if (found) {
      return res.status(400).send({ errors: [{ msg: 'Email already exists' }] });
    }

    const newAccount = new User(req.body);

    // Generate a random 8-digit activation code
    const digits = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let activationCode = '';
    for (let i = 0; i < 8; i++) {
      activationCode += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    newAccount.activationCode = activationCode;

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    newAccount.password = hashedPassword;

    await newAccount.save();

    const activationLink = `${process.env.FRONTEND_URL}/activate/${activationCode}`;

    // Send the activation email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Account Activation Code',
      text: `Hi ${name},\n\nThank you for signing up! Please use the following code to activate your account:\n\n${activationCode}\n\n 
      click the link below to go to the activation page\n\n
      https://stayahead.onrender.com/Activation`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).send({ msg: 'Account created, but email not sent.', newAccount });
      } else {
        console.log('Email sent: ' + info.response);
        res.status(200).send({ msg: 'Account created. Please check your email to activate your account.', newAccount });
      }
    });
  } catch (error) {
    res.status(500).send({ errors: [{ msg: 'Could not create account' }] });
  }
});

userRouter.get('/activate/:code', async (req, res) => {
  try {
    const { code } = req.params;

   
    // Find the user by activationCode
    const user = await User.findOne({ activationCode: code });

    if (!user) {
      return res.status(400).send({ errors: [{ msg: 'Invalid or expired activation code.' }] });  
    }

    // Activate the account
    user.isActive = true;
    user.activationCode = ''; // Optionally clear the activation code after activation

    await user.save();

    res.status(200).send({ msg: 'Your account has been activated. You can now log in.' });
  } catch (error) {
    res.status(500).send({ errors: [{ msg: 'Could not activate account' }] });
  }
});

userRouter.post('/signIn', async (req, res) => {
  try {
    const { email, password } = req.body;
    const found = await User.findOne({ email });
    if (!found) {
      return res.status(400).send({ errors: [{ msg: 'Wrong email or password' }] });
    }

    const match = bcrypt.compareSync(password, found.password);

    if (!match) {
      return res.status(400).send({ errors: [{ msg: 'Wrong email or password' }] });
    }

    if (!found.isActive) {
      return res.status(400).send({ errors: [{ msg: 'Please check your email to activate your account first' }] });
    }

    const payload = { id: found._id };

    const token = jwt.sign(payload, process.env.privateKey, { expiresIn: '7d' });

    res.status(200).send({ msg: "Welcome", found, token });
  } catch (error) {
    res.status(500).send({ errors: [{ msg: 'Could not login' }] });
  }
});

userRouter.delete('/deleteAccount/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete all tasks associated with the user
    await Task.deleteMany({ owner: id });

    // Delete the user
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).send({ msg: 'User not found' });
    }

    res.status(200).send({ msg: "Account and associated tasks deleted successfully" });
  } catch (error) {
    res.status(500).send({ errors: [{ msg: 'Could not delete account' }] });
  }
});

userRouter.put('/updateAccount/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, req.body);
    res.status(200).send({ msg: "Account updated successfully" });
  } catch (error) {
    res.status(500).send({ errors: [{ msg: 'Could not update account' }] });
  }
});

userRouter.put('/updatePassword/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPass, newPass } = req.body;

    if (!oldPass || !newPass) {
      return res.status(400).send({ errors: [{ msg: 'Please provide both old and new passwords' }] });
    }

    const found = await User.findById(id);
    if (!found) {
      return res.status(404).send({ errors: [{ msg: 'User not found' }] });
    }

    const match = bcrypt.compareSync(oldPass, found.password);
    if (!match) {
      return res.status(400).send({ success: false, msg: 'Incorrect old password' })
    }

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(newPass, salt);

    found.password = hashedPassword;
    await found.save();

    res.status(200).send({ success: true, msg: 'Password updated successfully' })
  } catch (error) {
    res.status(500).send({ errors: [{ msg: 'Could not update password' }] });
  }
});


userRouter.get('/getcurrentuser', IsAuthorized, async(req,res)=>{res.send(req.authUser)})

module.exports = userRouter;
