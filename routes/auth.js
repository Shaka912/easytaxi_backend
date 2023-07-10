const express = require("express");
const User = require("../models/users");
const Userdetails = require("../models/userdetails");

const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwt_secrect = process.env.JWT_SECRECT;
const fetchuser = require("../middleware/fetchuser");
// create user endpoint
router.post(
  "/createuser",
  [
    //body("email", "please enter a valid email").isEmail(),
    body("password", "password must be at least 5characters").isLength({
      min: 5,
    }),
    // body("name", "Name must be at least 3characters").isLength({ min: 3 }),
    // body("gender", "PLease specify gender").isLength({ min: 4 }),
    body("Phonenumber", "Please enter phone number only").isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let user = await User.findOne({ phonenumber: req.body.phonenumber });
      if (user) {
        return res
          .status(400)
          .json({ error: "Sorry The email is already is taken" });
      }
      const salt = await bcrypt.genSalt(10);
      const secpass = await bcrypt.hash(req.body.password, salt);

      user = await User.create({
        password: secpass,
        phonenumber: req.body.phonenumber,
      });
      //res.json(user);
      const data = {
        user: {
          id: user.id,
          phone:user.phonenumber
        },
      };
      const authtoken = jwt.sign(data, jwt_secrect);
      res.send({authtoken, user})
      console.log(authtoken)
    } catch (error) {
      console.error(error.message);
      res.status(500).send("some error has accored");
    }
  }
);
//user login endpoint
router.post(
  "/login",
  [
    body("phonenumber", "Please enter valid Number").exists(),
    body("password", "Password cannot be blank").exists(),
  ],
  async (req, res) => {
    //error checking
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(403).json({ errors: errors.array() });
    }
    const { phonenumber, password } = req.body;

    try {
      let user = await User.findOne({ phonenumber: phonenumber });
      if (user == null) {
        return res
          .status(401)
          .json({ errors: "Username or password is not correct" });
      }
      //comparing user password with password in database

      let passcompare = await bcrypt.compare(password, user.password);
      if (passcompare == false) {
        return res.status(402).json({ errors: "Please enter correct " });
      }
      const data = {
        id: user.id,
        phonenumber: user.phonenumber,
      };
      const authtoken = jwt.sign(data, jwt_secrect);
      res.json( {authtoken, user});
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error has occured");
    }
  }
);
//route for adding user details like gender etc
router.post(
  "/adduserdetails",
  [
    body("email", "please enter a valid email").isEmail(),
    body("lastname", "Name must be at least 3characters").isLength({ min: 3 }),
    body("firstname", "Name must be at least 3characters").isLength({ min: 3 }),
    body("gender", "please specify gender").isLength({ min: 3 }),
    body("birthdate", "Name must be at least 3characters").isLength({ min: 3 }),
  ],
  async (req, res) => {
    const user = await User.findOne({_id:req.body.userid})
    if (user == null) {
      return res
        .status(401)
        .json({ errors: "Username or password is not correct" });
    }
    const ff = await Userdetails.findOne({userid:req.body.userid})
    if(ff){
      return res.status(401).json({errors:"user details already added"})
    }
    const ss = await Userdetails.create({
      userid:req.body.userid,
      email:req.body.email,
      lastname:req.body.lastname,
      firstname:req.body.firstname,
      birthdate:req.body.birthdate,
      gender:req.body.gender,
    })
    res.json(ss);
  }
)
// get details of logged-in user,, login required
router.post("/getuser", fetchuser, async (req, res) => {
  try {
    userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Some error has occured");
  }
});
router.post(
  "/createcap",
  [
    body("email", "Please Enter valid email").isEmail(),
    body("name"),
    body("password", "Password length should be minimum 8 characters").isLength(
      { min: 8 }
    ),
    body("phonenumber", "Please enter valid phone number").isLength({ min: 8 }),
    body("birthyear").isNumeric(),
  ],
  async (res, req) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ error: "Sorry The email is already is taken" });
      }
      const salt = await bcrypt.genSalt(10);
      const secpass = await bcrypt.hash(req.body.password, salt);

      user = await User.create({
        name: req.body.name,
        password: secpass,
        email: req.body.email,
        Phonenumber: req.body.Phonenumber,
      });
      res.json(user);
      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, jwt_secrect);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("some error has accored");
    }
  }
);

//endpoint for firebase when firebase verifies user signup/login with phone number
router.post('/verify-user', async (req, res) => {
  const idToken = req.body.idToken;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phoneNumber = decodedToken.phone_number;
    // Save user to your MongoDB database
     // Find user in your MongoDB database
     const user = await User.findOne({ phonenumber: phoneNumber });
     if(user){
      const data = {
        user: {
          id: user.id,
          phone:user.phonenumber
        }, 
      };
      const authtoken = jwt.sign(data, jwt_secrect);
      res.send({token:authtoken, message:"login successfull",})
    }else{
      // User does not exist, handle sign up
      const newUser = new User({ phonenumber: phoneNumber });
      await newUser.save();
      const data = {
        user: {
          id: newUser.id,
          phone:newUser.phonenumber
        }, 
      };
      const authtoken = jwt.sign(data, jwt_secrect);
      res.send({token:authtoken, message:"signup successfull",})
     }
  } catch (error) {
    res.status(400).send('Invalid ID token');
  }
});

//endpoint for saving fcmtoken recieved from client side to keep token updated
// Route for saving FCM token
router.post('/savefcmtoken', async (req, res) => {
  const userId = req.body.userid;
  const token = req.body.token;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.fcmtoken = token;
    await user.save();

    res.status(200).json({ message: 'FCM token saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;
