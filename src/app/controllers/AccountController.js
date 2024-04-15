const {
  mutipleMongooseToObjects,
  mongoseToObject,
} = require("../../util/mongoose");
const Faculty = require("../models/Faculty");
const Role = require("../models/Role");
const User = require("../models/User");
const bcrypt = require("bcrypt");

class AccountController {
  async createAccountForm(req, res) {
    try {
      const roles = await Role.find();
      const faculties = await Faculty.find(); // Assuming Facility model is imported
      res.render("account/create", {
        roles: mutipleMongooseToObjects(roles),
        faculties: mutipleMongooseToObjects(faculties),
        authen: "admin",
        activePage: "account",
      });
    } catch (error) {
      next(error);
    }
  }

  //[POST] /admin/account/create
  async createAccount(req, res, next) {
    const { userName, password, roleId, email, fullName, facultyId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if facultyId is provided
    const facultyIdToUse = facultyId || null; // Or any other default value

    const newAccount = new User({
      userName,
      password: hashedPassword,
      roleId,
      fullName,
      facultyId: facultyIdToUse,
      email,
    });
    newAccount.save();
    res.redirect("./view");
  }

  //[GET] /admin/account/view
  async viewUsers(req, res, next) {
    try {
      const [roles, faculties, users] = await Promise.all([
        Role.find(),
        Faculty.find(),
        User.find().populate("roleId").populate("facultyId"),
      ]);

      const roleIdMap = new Map(); // Map to store role IDs by name
      roles.forEach((role) => roleIdMap.set(role.name, role._id));

      const [roleAdminId, roleManagerId, roleStudentId, roleCoordinatorId] =
        await Promise.all([
          roleIdMap.get("admin"),
          roleIdMap.get("manager"),
          roleIdMap.get("student"),
          roleIdMap.get("coordinator"),
        ]);

      const [admins, managers, students, coordinators] = await Promise.all([
        User.find({ roleId: roleAdminId })
          .populate("roleId")
          .populate("facultyId"),
        User.find({ roleId: roleManagerId })
          .populate("roleId")
          .populate("facultyId"),
        User.find({ roleId: roleStudentId })
          .populate("roleId")
          .populate("facultyId"),
        User.find({ roleId: roleCoordinatorId })
          .populate("roleId")
          .populate("facultyId"),
      ]);

      res.render("account/view", {
        users: mutipleMongooseToObjects(users),
        admins: mutipleMongooseToObjects(admins),
        managers: mutipleMongooseToObjects(managers),
        students: mutipleMongooseToObjects(students),
        coordinators: mutipleMongooseToObjects(coordinators),
        authen: "admin",
        activePage: "account",
        roles: mutipleMongooseToObjects(roles),
        faculties: mutipleMongooseToObjects(faculties),
      });
    } catch (error) {
      next(error);
    }
  }

  //[POST] /admin/account/:id/delete
  async deleteAccount(req, res, next) {
    try {
      await User.deleteOne({ _id: req.params.id });
      res.redirect("../view");
    } catch (error) {
      next(error);
    }
  }

  //[GET] /admin/account/:id/edit
  async editAccount(req, res, next) {
    const roles = await Role.find();
    const faculties = await Faculty.find();

    User.findById(req.params.id)
      .then((user) =>
        res.render("account/edit", {
          user: mongoseToObject(user),
          roles: mutipleMongooseToObjects(roles),
          faculties: mutipleMongooseToObjects(faculties),
        })
      )
      .catch((error) => next(error));
  }

  //[POST] /admin/account/:id/update
  async updateAccount(req, res, next) {
    try {
      const { userName, password, email, fullName, roleId, facultyId } =
        req.body;

      const accountId = req.params.id;
      const updateObject = {
        userName,
        email,
        fullName,
        roleId,
      };
      if (password != "") {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateObject.password = hashedPassword;
      }
      if (facultyId !== "") {
        updateObject.facultyId = facultyId;
      }
      const updatedAccount = await User.findByIdAndUpdate(
        accountId,
        updateObject,
        { new: true }
      );
      if (!updatedAccount) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.redirect("../view");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AccountController();
