const Customer = require('../models/Customer');
const Contact = require('../models/Contact')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.register = async (req, res) => {
    const { name, email, password,phone } = req.body; 
    try {
        let customer = await Customer.findOne({ email });
        if (customer) {
            return res.status(409).json({ msg: "Customer already exists" }); 
        }
        customer = new Customer({ name, email, password,phone }); 
        const salt = await bcrypt.genSalt(10);
        customer.password = await bcrypt.hash(password, salt);
        customer.isActive = new Date();
        await customer.save();
        const payload = { user: { id: customer._id, isAdmin: customer.isAdmin } }; 
        jwt.sign(payload, process.env.JWT_SECRET, (err, token) => {
            if (err) {
                console.log(err);
                throw err;
            }
            console.log(token);
            res.json({ token });
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
};



exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        let customer = await Customer.findOne({ email });
        if (!customer) {
            return res.status(404).json({ msg: "Customer does not exist" }); 
        }
        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid password" }); 
        }
        const payload = { user: { id: customer._id, isAdmin: customer.isAdmin } }; 
        jwt.sign(payload, process.env.JWT_SECRET,  (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
};

exports.customer = async (req, res) => {
    try {
        const cId = req.user.user.id; 
        console.log(cId);
        
        
        let customer = await Customer.findById(cId);
        
        if (!customer) {
            return res.status(404).json({ msg: "Customer does not exist" });
        }

        // If customer found, return customer details
        res.json(customer);
       
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
};

exports.contact = async (req, res) => {
    const { name, email, subject,message } = req.body; 
    try {
        const cId = req.user.user.id;
        let customer = await Customer.findOne({ email });
        
        if (!customer) {
            return res.status(409).json({ msg: "Customer does not exists" }); 
        }
        let contactUs  = new Contact({ name, email, subject,message,cId }); 
        
        await contactUs.save();
        res.status(200).json({
            success: true,
            message: "Alright, we will get back to you as soon as possible"
          });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
};