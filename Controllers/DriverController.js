var jwt = require('jsonwebtoken');
const twilio = require('twilio');
const drivermodel = require('../models/driver')
const ratingmodel = require('../models/userrating')//For Giving Rating to User
const driverrating = require('../models/driverratings')
const client = twilio(process.env.Account_SID, process.env.Auth_Token);

const SECRET_KEY = 'hello$123'

const Login = async (request, response) => {
    const { phone } = request.body;
    try {
        const checkuser = await drivermodel.findOne({ phone: phone });
        if (checkuser) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            // Send OTP via Twilio
            client.messages
                .create({
                    body: `Your OTP is: ${otp}`,
                    from: process.env.Twilio_Number,
                    to: `+${phone}`,
                })
                .then(() => {
                    response.status(200).json({
                        message: 'User Login Success',
                        data: checkuser._doc._id, // Removed unnecessary spread operator
                        otp: otp
                    });
                })
                .catch((error) => {
                    console.error(error);
                    response.status(500).json({ error: 'Failed to send OTP' });
                });
        } else {
            response.status(200).json({
                message: 'Phone Number Not Exist',
            });
        }
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: 'Internal Server Error' });
    }
};

const Register = async (request, response) => {
    const checkuser = await drivermodel.findOne({ phone: request.body.phone });

    if (checkuser) {
        response.status(200).json({
            message: 'Driver Already Exists',
        });
    } else {
        try {
            if (!request.files) {
                return response.status(400).json({ error: 'Image upload failed' });
            }

            // // Get the image URL from the request file object
            const vehicle_image = request.files[0].location;
            const license_image = request.files[1].location;
            const driver_image = request.files[2].location;

            const newDriver = new drivermodel({
                first_name: request.body.first_name,
                last_name: request.body.last_name,
                email: request.body.email,
                city: request.body.city,
                phone: request.body.phone,
                gender: request.body.gender,
                vehicle: {
                    brand: request.body.brand,
                    vehicletype: request.body.vehicletype,
                    model: request.body.model,
                    year: request.body.year,
                    plate_number: request.body.plate_number,
                    images: {
                        vehicle_image: vehicle_image,
                        license_image: license_image,
                        driver_image: driver_image
                    }
                }
            });

            const saveuser = await newDriver.save();
            const otp = Math.floor(100000 + Math.random() * 900000);

            // Send OTP via Twilio
            client.messages
                .create({
                    body: `Your OTP is: ${otp}`,
                    from: process.env.Twilio_Number,
                    to: `+${request.body.phone}`,
                })
                .then(() => {
                    response.status(200).json({
                        message: 'User Register Success',
                        data: saveuser,
                        otp: otp
                    });
                })
                .catch((error) => {
                    console.error(error);
                    response.status(500).json({ error: 'Failed to send OTP' });
                });
        } catch (error) {
            console.error(error);
            response.status(500).json({ error: 'Driver Not Created' });
        }
    }
}


const SendAgianOtp = async (request, response) => {
    const { phone } = request.body
    const otp = Math.floor(100000 + Math.random() * 900000);
    // Send OTP via Twilio
    client.messages
        .create({
            body: `Your OTP is: ${otp}`,
            from: process.env.Twilio_Number,
            to: `+${phone}`,
        })
        .then(() => {
            response.status(200).json({
                message: 'OTP has been generated',
                otp: otp
            });
        })
        .catch((error) => {
            console.error(error);
            response.status(500).json({ error: 'Failed to send OTP' });
        });
}

const verifyotp = async (request, response) => {
    try {
        const checkuser = await drivermodel.findOne({ _id: request.body.id });
        if (checkuser) {
            if (!checkuser.isValid) {
                checkuser.isValid = true;
                const user_info = await checkuser.save();
                const data = {
                    user: {
                        id: user_info._id,
                        phone: user_info.phone
                    },
                };
                const token = jwt.sign(data, SECRET_KEY);
                response.status(200).json({
                    message: 'isValid field updated successfully',
                    data: {
                        ...user_info._doc,
                        token: token,
                    },
                });
            } else {
                const data = {
                    user: {
                        id: checkuser._id,
                        phone: checkuser.phone
                    },
                };
                const token = jwt.sign(data, SECRET_KEY);
                response.status(200).json({
                    message: 'Field Already Updated',
                    data: {
                        ...checkuser._doc,
                        token: token,
                    },
                });
            }
        } else {
            response.status(200).json({
                message: 'User not found',
            });
        }
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: 'Internal Server Error' });
    }
};


const driver_to_user = async (request, response) => {
    try {
        const rating = new ratingmodel({
            userid: request.body.userid,
            ratedBy: request.user.id,
            rating: request.body.rating,
            rideRequestId: request.body.rideRequestId,
            comment: request.body.comment,
        });

        const result = await rating.save();
        response.status(200).json({
            message: 'Your Response was successfully saved',
            data: result,
        });
    } catch (error) {
        response.status(200).json({
            message: 'Something went wrong',
        });
    }
}

const driver_rating = async (request, response) => {
    const data = await driverrating.find({ driverinfo: request.user.id });

    // Check if there are ratings before calculating the average
    if (data.length === 0) {
        response.status(200).json({
            message: "No ratings available for this Driver.",
        });
        return;
    }

    const sumOfRatings = data.reduce((acc, item) => acc + item.rating, 0);
    const averageRating = sumOfRatings / data.length;

    response.status(200).json({
        data: averageRating,
    });
}

module.exports = {
    Login,
    Register,
    verifyotp,
    driver_to_user,
    driver_rating,
    SendAgianOtp
}