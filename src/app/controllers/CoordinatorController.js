const Faculty = require("../models/Faculty");
const {
  mutipleMongooseToObjects,
  mongoseToObject,
} = require("../../util/mongoose");
const Magazine = require("../models/Magazine");
const Submission = require("../models/Submission");
const { getCachedViewLink } = require("../../config/firebase");
const { sendMailToStudent } = require("../../config/mailNotification");

class CoordinatorController {
  async viewAllSubmissionWithFacultyId(req, res, next) {
    try {
      const facultyId = req.facultyId;
      const { page = 1, status = "all", search } = req.query;
      const perPage = 10; // Define how many submissions per page
      const startIndex = (page - 1) * perPage;

      // Retrieve the faculty associated with the coordinator
      const faculty = await Faculty.findById(facultyId);
      // Retrieve magazines for the faculty
      const magazines = await Magazine.find({ faculty: facultyId });
      const magazineIds = magazines.map((magazine) => magazine._id);

      const filters = { magazine: { $in: magazineIds } };

      if (status !== "all") {
        filters.status = new RegExp(status, "i"); // Case-insensitive comparison for status
      }

      if (search) {
        filters.$or = [
          { "student.fullName": { $regex: search, $options: "i" } },
          { title: { $regex: search, $options: "i" } },
        ];
      }

      const totalSubmissions = await Submission.countDocuments(filters);
      const totalPages = Math.ceil(totalSubmissions / perPage);

      const submissions = await Submission.find(filters)
        .populate("student")
        .populate({
          path: "magazine",
          populate: [{ path: "academicYear" }],
        })
        .sort({ dateSubmitted: -1 })
        .skip(startIndex)
        .limit(perPage)
        .lean();

      const pages = [];
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      const username = req.userName;

      res.render("submission/viewForCoordinator", {
        facultyName: faculty.name,
        authen: "coordinator",
        submissions: submissions,
        currentPage: page,
        totalPages: totalPages,
        pages,
        username,
        // Pass any other data needed for rendering the view
      });
    } catch (error) {
      next(error);
    }
  }

  //[GET] /coordinator/submission/:id/edit
  async editSubmissionForm(req, res, next) {
    const facultyId = req.facultyId;

    Submission.findById(req.params.id)
      .populate("magazine")
      .populate("student")
      .then(async (submission) => {
        const viewImageLink = await getCachedViewLink(submission.imagePath);
        const viewDocLink = await getCachedViewLink(submission.documentPath);
        if (facultyId != submission.magazine.faculty) {
          return res.status(403).json({ message: "Access forbidden" });
        }
        const username = req.userName;

        res.render("submission/editForCoordinator", {
          submission: mongoseToObject(submission),
          viewImageLink: viewImageLink,
          viewDocLink: viewDocLink,
          authen: "coordinator",
          username,
        });
      })
      .catch((error) => next(error));
  }
  //[POST] /coordinator/submission/:id/edit
  async editSubmission(req, res, next) {
    try {
      const { status, comment } = req.body;
      await Submission.updateOne({ _id: req.params.id }, { status, comment });
      const submission = await Submission.findOne({
        _id: req.params.id,
      }).populate("student");
      sendMailToStudent(
        req,
        submission.student.email,
        submission.status,
        submission.comment,
        submission.title,
        submission.student.fullName
      );

      res.redirect("../view");
    } catch (error) {
      next(error);
    }
  }

  async filterSubmissions(req, res, next) {
    try {
      const facultyId = req.facultyId;
      const { status, search } = req.query;

      // Retrieve the faculty associated with the coordinator
      const faculty = await Faculty.findById(facultyId);

      // Define magazineIds based on your application logic
      const magazineIds = await Magazine.find({ faculty: facultyId }).distinct(
        "_id"
      );

      const filters = { magazine: { $in: magazineIds } };

      if (status && status !== "all") {
        filters.status = new RegExp(status, "i"); // Case-insensitive comparison for status
      }

      console.log("Filters:", filters); // Add this line to log the filters

      if (search) {
        filters.$or = [
          { "student.fullName": { $regex: search, $options: "i" } },
          { title: { $regex: search, $options: "i" } },
        ];
      }

      const submissions = await Submission.find(filters)
        .populate("student")
        .populate("magazine")
        .sort({ dateSubmitted: -1 })
        .lean();

      console.log("Filtered Submissions:", submissions);
      const username = req.userName;

      res.render("submission/viewForCoordinator", {
        facultyName: faculty.name,
        authen: "coordinator",
        submissions: submissions,
        username,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CoordinatorController();
