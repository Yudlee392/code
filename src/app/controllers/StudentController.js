const {
  mutipleMongooseToObjects,
  mongoseToObject,
} = require("../../util/mongoose");
const Student = require("../models/User");
const {
  upload,
  bucket,
  admin,
  getCachedViewLink,
} = require("../../config/firebase");
const Submission = require("../models/Submission");
const Magazine = require("../models/Magazine");
const Faculty = require("../models/Faculty");
const Role = require("../models/Role");
const { sendMailToCoordinator } = require("../../config/mailNotification");
const User = require("../models/User");

class StudentController {
  // [GET] /submission/create
  async getSubmissionForm(req, res, next) {
    try {
      console.log("khoaaa", new Date());
      const faculty = req.facultyId;
      const magazines = await Magazine.find({ faculty: faculty }).populate(
        "academicYear"
      );
      // only take magazine with currentday < magazine.academicYear.closureDate
      const submitableMagazines = magazines.filter((magazine) => {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const magazineDate = new Date(magazine.academicYear.closureDate);
        return currentDate <= magazineDate;
      });

      const username = req.userName;

      // Render the submission form view with the fetched data
      res.render("submission/create", {
        authen: "student",
        activePage: "submission",
        magazines: mutipleMongooseToObjects(submitableMagazines),
        username,
        // Example authentication check
        // Pass any data needed for rendering the form
      });
    } catch (error) {
      next(error);
    }
  }

  // [POST] /submission/create
  async submitFormData(req, res, next) {
    try {
      const user = req.userId;
      const faculty = await Faculty.findOne({ _id: req.facultyId });
      // const faculty = req.facultyId;
      // const magazines = await Magazine.find({ faculty: faculty });
      const { title, magazine } = req.body;
      const { image, document } = req.files;
      // Check if both files are uploaded
      if (!image || !document) {
        return res
          .status(400)
          .json({ message: "Both image and document files are required" });
      }

      // Handle image file
      const imageFileName = Date.now() + image[0].originalname;
      const imageFileRef = bucket.file(imageFileName);

      await imageFileRef.save(image[0].buffer, {
        metadata: { contentType: image[0].mimetype },
      });

      // Handle document file
      const documentFileName = Date.now() + document[0].originalname;
      const documentFileRef = bucket.file(documentFileName);

      await documentFileRef.save(document[0].buffer, {
        metadata: { contentType: document[0].mimetype },
      });

      const imagePath = `${imageFileName}`;
      const documentPath = `${documentFileName}`;

      // const viewLinkImage = await getCachedViewLink(imagePath);
      // const viewLinkDocument = await getCachedViewLink(documentPath);

      const newSubmission = new Submission({
        student: user,
        imagePath,
        documentPath,
        title,
        magazine,
      });
      newSubmission.save();
      const roleCoordinator = await Role.findOne({ name: "coordinator" });
      const roleCoordinatorId = roleCoordinator._id;

      const coordinators = await User.find({
        roleId: roleCoordinatorId,
        facultyId: faculty._id,
      });

      for (const coordinator of coordinators) {
        await sendMailToCoordinator(
          req,
          coordinator.email,
          faculty.name,
          newSubmission._id
        );
      }

      res.redirect("./view");
    } catch (error) {
      next(error);
    }
  }

  async getAllSubmissions(req, res, next) {
    try {
      const page = req.query.page || 1;
      const perPage = 10; // Define how many submissions per page

      const faculty = await Faculty.findOne({ _id: req.facultyId });
      const user = req.userId;

      const totalSubmissions = await Submission.countDocuments({
        student: user,
      });
      const totalPages = Math.ceil(totalSubmissions / perPage);
      const startIndex = (page - 1) * perPage;

      const submissions = await Submission.find({ student: user })
        .populate({
          path: "magazine",
          populate: [{ path: "academicYear" }, { path: "faculty" }],
        })
        .sort({ dateSubmitted: -1 })
        .skip(startIndex)
        .limit(perPage);
      const pages = [];
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      const username = req.userName;
      res.render("submission/view", {
        authen: "student",
        activePage: "viewsubmission",
        submissions: mutipleMongooseToObjects(submissions),
        facultyName: faculty.name,
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
  //[GET] /student/submission/:id/edit
  async editSubmissionForm(req, res, next) {
    const userId = req.userId;

    Submission.findById(req.params.id)
      .populate("magazine")
      .populate("student")
      .then(async (submission) => {
        const viewImageLink = await getCachedViewLink(submission.imagePath);
        const viewDocLink = await getCachedViewLink(submission.documentPath);
        console.log(
          "userId",
          userId,
          "submission.student",
          submission.student._id
        );
        if (userId != submission.student._id) {
          return res.status(403).json({ message: "Access forbidden" });
        }
        const username = req.userName;

        res.render("submission/edit", {
          authen: "student",
          submission: mongoseToObject(submission),
          viewImageLink: viewImageLink,
          viewDocLink: viewDocLink,
          username,
        });
      })
      .catch((error) => next(error));
  }
  //[POST] /student/submission/:id/edit
  async editSubmission(req, res, next) {
    const { title } = req.body;
    const { image, document } = req.files;
    const submission = await Submission.findById(req.params.id);

    if (image) {
      const imageFileName = Date.now() + image[0].originalname;
      const imageFileRef = bucket.file(imageFileName);

      await imageFileRef.save(image[0].buffer, {
        metadata: { contentType: image[0].mimetype },
      });
      const imagePath = `${imageFileName}`;
      submission.imagePath = imagePath;
    }

    if (document) {
      const documentFileName = Date.now() + document[0].originalname;
      const documentFileRef = bucket.file(documentFileName);

      await documentFileRef.save(document[0].buffer, {
        metadata: { contentType: document[0].mimetype },
      });
      submission.documentPath = documentPath;
    }
    submission.title = title;
    submission.save();
    res.redirect("../view");
  }
}

module.exports = new StudentController();
