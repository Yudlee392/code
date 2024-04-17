const {
  mutipleMongooseToObjects,
  mongoseToObject,
} = require("../../util/mongoose");
const Magazine = require("../models/Magazine");
const AcademicYear = require("../models/AcademicYear");
const Faculty = require("../models/Faculty");

class MagazineController {
  async createMagazineForm(req, res) {
    try {
      const academicYears = await AcademicYear.find({});
      const faculties = await Faculty.find({});
      const username = req.userName;

      res.render("magazine/create", {
        authen: "manager",
        activePage: "magazine",
        academicYears: mutipleMongooseToObjects(academicYears),
        faculties: mutipleMongooseToObjects(faculties),
        username
      });
    } catch (error) {
      next(error);
    }
  }

  //[POST] /admin/magazine/create
  async createMagazine(req, res, next) {
    try {
      const { title, academicYear, faculty } = req.body;
      const newMagazine = new Magazine({ title, academicYear, faculty });
      await newMagazine.save();
      res.redirect("./view");
    } catch (error) {
      next(error);
    }
  }

  //[GET] /admin/magazine/view
  async viewMagazines(req, res, next) {
    try {

      const page = req.query.page || 1; // Default to page 1 if no page parameter is provided
      const perPage = 10; // Number of items per page
      const academicYears = await AcademicYear.find({});
      const faculties = await Faculty.find({});

      const totalMagazines = await Magazine.countDocuments();
      const totalPages = Math.ceil(totalMagazines / perPage);
      const startIndex = (page - 1) * perPage;

      const magazines = await Magazine.find({})
        .populate("faculty")
        .populate("academicYear")
        .sort({ academicYear: 1, faculty: 1 })
        .skip(startIndex)
        .limit(perPage);
      const pages = [];
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      const username = req.userName;

      res.render("magazine/view", {
        magazines: mutipleMongooseToObjects(magazines),
        authen: "manager",
        activePage: "magazine",
        academicYears: mutipleMongooseToObjects(academicYears),
        faculties: mutipleMongooseToObjects(faculties),
        currentPage: page,
        totalPages: totalPages,
        pages,
        username,
      });
    } catch (error) {
      next(error);
    }
  }

  //[POST] /admin/magazines/:id/delete
  async deleteMagazine(req, res, next) {
    try {
      await Magazine.deleteOne({ _id: req.params.id });
      res.redirect("../view");
    } catch (error) {
      next(error);
    }
  }

  //[GET] /admin/magazines/:id/edit
  async editMagazine(req, res, next) {
    try {
      const academicYears = await AcademicYear.find({});
      const faculties = await Faculty.find({});
      const magazine = await Magazine.findById(req.params.id);
      const username = req.userName;
      res.render("magazine/edit", {
        magazine: mongoseToObject(magazine),
        academicYears,
        faculties,
        username
      });
    } catch (error) {
      next(error);
    }
  }

  //[POST] /admin/magazines/:id/update
  async updateMagazine(req, res, next) {
    try {
      const { title, academicYear, faculty } = req.body;
      await Magazine.updateOne(
        { _id: req.params.id },
        { title, academicYear, faculty }
      );
      res.redirect("../view");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MagazineController();
