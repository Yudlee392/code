const Course = require('../models/Course')
const { mutipleMongooseToObjects } = require('../../util/mongoose')
const User = require("../models/User")
const Role = require('../models/Role');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const secretKey = process.env.JWT_SECRET;


class UserController {
    loginpage(req, res) {
        console.log("from login page",req.session)
        const token=req.session.token;  
        if (token) 
            return res.redirect("/")
        res.render('login', { activePage: 'login' });
    }


    async login(req, res) {
        try {
            const { userName, password } = req.body;
            // Find user by username
            const user = await User.findOne({ userName }).populate('roleId');
            // console.log(user);
            // Check if user exists
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Validate password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid password' });
            }


            // console.log(user.roleId.name);
            // Check user role (assuming roleId is populated)
            // if (user.roleId.name !== 'admin') {
            //     return res.status(403).json({ message: 'Insufficient permissions' });
            // }

            // Create JWT token
            const token = jwt.sign({ userId: user._id, roleId: user.roleId}, secretKey, { expiresIn: '7d' });

            // localStorage.setItem('token', token);
            req.session.token = token;
            console.log("from user controller", req.session)
            if (user.roleId.name === 'admin') {
                res.redirect('/admin/academic/view');
            } else if (user.roleId.name === 'manager') {
                res.redirect('/manager/magazine/view');
            }  else if (user.roleId.name === 'student') {
                res.redirect('/student/submission/view');
            }  
            else if (user.roleId.name === 'coordinator') {
                res.redirect('/coordinator/submission/view');
            }  
            else {
                res.redirect('/');
            }
            // Send token as response
            // res.status(200).json({ token });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    //[GET] /
    index(req, res, next) {
        //  Course.find({},function(err,courses){
        //     if(!err) res.json(courses);
        //     else res.status(400).json({error: 'ERROR!!!'})
        //  })
        // res.render('home');
        Course.find({})
            .then(courses => res.render('home', {
                activePage: 'home',
                courses: mutipleMongooseToObjects(courses)
            }))
            .catch(error => next(error))
    }
    //[GET] /search
    search(req, res) {
        res.render('search', { activePage: 'search' });
    }

    //[post] /search
    searchpost(req, res) {
        res.send(req.body);
    }
}
module.exports = new UserController();
