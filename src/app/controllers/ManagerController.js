const {
  mutipleMongooseToObjects,
  mongoseToObject,
} = require("../../util/mongoose");
const Magazine = require("../models/Magazine");
const AcademicYear = require("../models/AcademicYear");
const Faculty = require("../models/Faculty");
const Submission = require("../models/Submission");
const path = require("path");
const { downloadAndGenerateLink } = require("../../config/firebase");

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
        username,
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

      const submissions = await Submission.find({});
      const magazines = await Magazine.find({})
        .populate("faculty")
        .populate("academicYear")
        .sort({ academicYear: 1, faculty: 1 })
        .skip(startIndex)
        .limit(perPage);

      const magazinesObject = {};
      magazines.forEach((magazine) => {
        magazinesObject[magazine._id.toString()] = {
          ...magazine.toObject(),
          totalSubmissions: 0,
        };
      });

      // Count the total submissions for each magazine
      submissions.forEach((submission) => {
        const magazineId = submission.magazine.toString(); // Assuming you have a field called "magazine" in Submission model
        if (magazinesObject[magazineId]) {
          magazinesObject[magazineId].totalSubmissions++;
        }
      });

      const pages = [];
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      const username = req.userName;

      res.render("magazine/view", {
        magazines: magazinesObject,
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
        username,
      });
    } catch (error) {
      next(error);
    }
  }

  //[POST] /magazines/:id/update
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
  //[post] /download/
  async downloadMagazines(req, res, next) {
    const filePath = path.resolve(
      __dirname,
      "..",
      "..",
      "temp",
      "downloaded_files.zip"
    );
    try {
      res.setHeader("Content-Disposition", "attachment; filename=file.zip");
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error generating download link:", error);
    }
  }
  async confirmDownload(req, res, next) {
    const id = req.params.id;
    const submissions = await Submission.find({ magazine: id }).populate(
      "student"
    );

    //find submission have magazine=id
    const filePath = path.resolve(
      __dirname,
      "..",
      "..",
      "temp",
      "downloaded_files.zip"
    );
    try {
      // Call downloadAndGenerateLink and wait for it to complete
      const username = req.userName;

      const downloadLink = await downloadAndGenerateLink(submissions);
      res.render("magazine/confirmDownload", {
        username,
        authen: "manager",
      });
    } catch (error) {
      console.error("Error generating download link:", error);
    }
  }
}
function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error deleting file:", err);
    } else {
      console.log("File deleted successfully:", filePath);
    }
  });
}

module.exports = new MagazineController();
