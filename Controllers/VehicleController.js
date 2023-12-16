const VehicleModel = require('../models/Vehicles')
const generalUsePurposes = ['For Function Use', 'For Tour Use', 'For Daily Use'];
const commercialUsePurposes = ['Box Truck', 'Mini Truck', 'Cargo Van'];

const PostVehicle = async (request, response) => {
    const imageUrl = request.file.location;

    const {
        vehicle_type,
        vehicle_name,
        vehicle_petrol_capacity,
        vehicle_petrol_average,
        vehicle_max_power,
        vehicle_max_speed,
        vehicle_control_type,
        vehicle_sitting_capacity,
        vehicle_price_per_day,
        vehicle_useage,
        vehicle_useage_purpose,
    } = request.body;

    // Check if the provided vehicle_useage_purpose is valid based on the selected vehicle_useage
    let isPurposeValid = false;
    if (vehicle_useage === 'General Use') {
        isPurposeValid = generalUsePurposes.includes(vehicle_useage_purpose);
    } else if (vehicle_useage === 'Commercial Use') {
        isPurposeValid = commercialUsePurposes.includes(vehicle_useage_purpose);
    }

    if (!isPurposeValid) {
        return response.status(400).json({
            success: false,
            message: 'Invalid usage purpose for the given usage type.',
        });
    }

    const newVehicle = new VehicleModel({
        vehicle_type,
        vehicle_name,
        vehicle_petrol_capacity,
        vehicle_petrol_average,
        vehicle_max_power,
        vehicle_max_speed,
        vehicle_control_type,
        vehicle_sitting_capacity,
        vehicle_price_per_day,
        vehicle_image: imageUrl,
        vehicle_useage,
        vehicle_useage_purpose,
    });

    try {
        const savedVehicle = await newVehicle.save();

        response.status(201).json({
            success: true,
            message: 'Vehicle added successfully',
            vehicle: savedVehicle,
        });
    } catch (error) {
        response.status(500).json({
            success: false,
            message: 'Failed to add vehicle',
            error: error.message,
        });
    }
};



const Get_Vehicles = async (request, response) => {
    try {
        const { vehicle_useage, vehicle_useage_purpose } = request.params;
        console.log({
            vehicle_useage,
            vehicle_useage_purpose
        })

        const data = await VehicleModel.find({
            vehicle_useage: vehicle_useage,
            vehicle_useage_purpose: vehicle_useage_purpose
        });

        // const filterdata = data.filter(item => item.vehicle_availability == true)

        if (data) {
            response.status(200).json({
                success: true,
                message: 'Vehicles retrieved successfully',
                data: data,
            });
        } else {
            response.status(200).json({
                success: false,
                message: 'No Vehicle found',
                data: data,
            });
        }
    } catch (error) {
        response.status(500).json({
            success: false,
            message: 'Failed to retrieve vehicles',
            error: error.message,
        });
    }
};

module.exports = {
    PostVehicle,
    Get_Vehicles
}