const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../Models/User');
const Task = require('../Models/Task'); 
const transporter = require('../Config/EmailTransporter');


exports.createAccount =  async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const found = await User.findOne({ email });
    if (found) {
      return res.status(400).send({ errors: [{ msg: 'Email already exists' }] });
    }

    const newAccount = new User(req.body);

    
    const digits = "1234567890";
    let activationCode = '';
    for (let i = 0; i < 4; i++) {
      activationCode += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    newAccount.activationCode = activationCode;

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    newAccount.password = hashedPassword;

    await newAccount.save();

    const activationLink = `${process.env.FRONTEND_URL}/activate/${activationCode}`;

    
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
}

exports.activateAccount= async (req, res) => {
  try {
    const { code } = req.params;

   
    
    const user = await User.findOne({ activationCode: code });

    if (!user) {
      return res.status(400).send({ errors: [{ msg: 'Invalid or expired activation code.' }] });  
    }

    
    user.isActive = true;
    user.activationCode = ''; 

    await user.save();

    res.status(200).send({ msg: 'Your account has been activated. You can now log in.' });
  } catch (error) {
    res.status(500).send({ errors: [{ msg: 'Could not activate account' }] });
  }
}

exports.signIn = async (req, res) => {
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
}

exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    
    await Task.deleteMany({ Taskowner: id });

    
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).send({ msg: 'User not found' });
    }

    res.status(200).send({ msg: "Account and associated tasks deleted successfully" });
  } catch (error) {
    res.status(500).send({ errors: [{ msg: 'Could not delete account' }] });
  }
}

exports.updateAccount = async (req, res) => {
    try {
      const { id } = req.params;
      await User.findByIdAndUpdate(id, req.body);
      res.status(200).send({ msg: "Account updated successfully" });
    } catch (error) {
      res.status(500).send({ errors: [{ msg: 'Could not update account' }] });
    }
  }


  exports.updatePassword =  async (req, res) => {
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
  }

  exports.getCurrentUser = async(req,res)=>{res.send(req.authUser)}