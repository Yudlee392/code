const AcademicYear = require("../models/AcademicYear");
const {
  mutipleMongooseToObjects,
  mongoseToObject,
} = require("../../util/mongoose");
const Submission = require("../models/Submission");
const Magazine = require("../models/Magazine");
const Faculty = require("../models/Faculty");

class AcademicYearController {
  //[GET] /createAcademicYear
  createForm(req, res) {
    res.render("academicYear/create");
  }
  //[POST] /createAcademicYear
  create(req, res) {
    const academicYear = new AcademicYear(req.body);
    academicYear.save();
    res.redirect("./view");
  }

  //[GET] /academic/view
  view(req, res, next) {
    AcademicYear.find({})
      .then((academicYears) =>
        res.render("academicYear/view", {
          academicYears: mutipleMongooseToObjects(academicYears),
          authen: "admin",
          activePage: "academic",
        })
      )
      .catch((error) => next(error));
  }

  //[POST] /:id/delete
  delete(req, res, next) {
    AcademicYear.deleteOne({ _id: req.params.id })
      .then(() => res.redirect("../view"))
      .catch((error) => next(error));
  }
  //[GET] /:id/edit
  edit(req, res, next) {
    AcademicYear.findById(req.params.id)
      .then((academicYear) =>
        res.render("academicYear/edit", {
          academicYear: mongoseToObject(academicYear),
        })
      )
      .catch((error) => next(error));
  }
  //[POST] /:id/update
  update(req, res, next) {
    AcademicYear.updateOne({ _id: req.params.id }, req.body)
      .then(() => res.redirect("../view"))
      .catch((error) => next(error));
  }
  //[POST] /chart
  async chart(req, res, next) {
    const academicYears = await AcademicYear.find().sort({ startDate: 1 });
    const faculties = await Faculty.find();

    // Initialize an array to store chart data
    const chartData = [];

    // Loop through each academic year
    for (const academicYear of academicYears) {
      // Fetch all magazines for all faculties within the current academic year
      const magazines = await Magazine.find({ academicYear: academicYear._id });

      // Loop through each faculty
      for (const faculty of faculties) {
        // Filter magazines for the current faculty
        const facultyMagazines = magazines.filter((magazine) =>
          magazine.faculty.equals(faculty._id)
        );

        // Count total submissions and unique students for all magazines of the current faculty within the academic year
        const aggregationPipeline = [
          {
            $match: {
              magazine: {
                $in: facultyMagazines.map((magazine) => magazine._id),
              },
            },
          },
          {
            $group: {
              _id: "$student", // Group by student
              count: { $sum: 1 }, // Count submissions for each student
            },
          },
          {
            $group: {
              _id: null,
              totalSubmissions: { $sum: "$count" }, // Total submissions for the faculty
              uniqueStudents: { $sum: 1 }, // Count unique students
            },
          },
        ];

        const result = await Submission.aggregate(aggregationPipeline);

        // Extract total submissions and unique students from the aggregation result
        const totalSubmissions =
          result.length > 0 ? result[0].totalSubmissions : 0;
        const uniqueStudents = result.length > 0 ? result[0].uniqueStudents : 0;

        // Add data for the current faculty and academic year to chartData array
        chartData.push({
          academicYear: academicYear.name,
          faculty: faculty.name,
          totalSubmissions: totalSubmissions,
          uniqueStudents: uniqueStudents,
        });
      }
    }
    // Render the chart view with chartData
    res.render("chart", {
      chartData,
      authen: "admin",
      activePage: "chart",
    });
  }
}

module.exports = new AcademicYearController();
