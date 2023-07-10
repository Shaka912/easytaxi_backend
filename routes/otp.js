const express = require("express");
const router = express.Router();
const accountSid = 'ACe52edb463f03ac255668a74397509338'
const autoken = 'b19d998269095aac0aa027f80cfaef61'
const serviceId = 'VA9dbe81f9481a804f6c115a2c119fef3e'
const client = require('twilio')(accountSid,autoken)

router.get("/verify", (req,res)=>{
    client
          .verify.services(serviceId).verifications.create({to:`+${req.query.phonenumber}`,channel:req.query.channel})
          .then((data)=>{res.status(200).send(data)})
})

module.exports = router;