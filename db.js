const mongoose = require('mongoose');
const express = require('express');
const mongouri = process.env.MONGO_DB_URI

const conecttomongo =async()=> {
    mongoose.set("strictQuery", true);
    try {
        const conn = await mongoose.connect(mongouri,  {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            family: 4 // Use IPv4, skip trying IPv6
          })
          console.log("Connected to mongodb successfully");
    } catch (error) {
        console.log(error);
    }
}
module.exports =conecttomongo;