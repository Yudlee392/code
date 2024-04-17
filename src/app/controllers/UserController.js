const Course = require("../models/Course");
const { mutipleMongooseToObjects } = require("../../util/mongoose");
const User = require("../models/User");
const Role = require("../models/Role");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const secretKey = process.env.JWT_SECRET;

class UserController {
  loginpage(req, res) {
    console.log("from login page", req.session);
    const token = req.session.token;
    if (token) return res.redirect("/");
    res.render("login", { activePage: "login" });
  }

  async login(req, res) {
    try {
      const { userName, password } = req.body;
      // Tìm người dùng theo tên đăng nhập
      const user = await User.findOne({ userName }).populate("roleId");

      // Kiểm tra xem người dùng có tồn tại không
      if (!user) {
        res.render("login", { errorMessage: "User not found" });
        return;
      }

      // Xác thực mật khẩu
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.render("login", { errorMessage: "Invalid password" });
        return;
      }

      // Tạo token JWT
      const token = jwt.sign(
        { userId: user._id, roleId: user.roleId },
        secretKey,
        { expiresIn: "7d" }
      );

      // Lưu token vào session
      req.session.token = token;

      // Chuyển hướng dựa trên vai trò của người dùng
      if (user.roleId.name === "admin") {
        res.redirect("/admin/academic/view");
      } else if (user.roleId.name === "manager") {
        res.redirect("/manager/magazine/view");
      } else if (user.roleId.name === "student") {
        res.redirect("/student/submission/view");
      } else if (user.roleId.name === "coordinator") {
        res.redirect("/coordinator/submission/view");
      } else {
        res.redirect("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      res.render("login", { errorMessage: "Internal server error" });
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
      .then((courses) =>
        res.render("home", {
          activePage: "home",
          courses: mutipleMongooseToObjects(courses),
        })
      )
      .catch((error) => next(error));
  }
  //[GET] /search
  search(req, res) {
    res.render("search", { activePage: "search" });
  }

  //[post] /search
  searchpost(req, res) {
    res.send(req.body);
  }
}
module.exports = new UserController();
