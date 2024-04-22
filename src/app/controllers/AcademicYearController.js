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
    const username = req.userName;
    AcademicYear.find({})
      .then((academicYears) =>
        res.render("academicYear/view", {
          academicYears: mutipleMongooseToObjects(academicYears),
          authen: "admin",
          activePage: "academic",
          username,
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
    const username = req.userName;

    AcademicYear.findById(req.params.id)
      .then((academicYear) =>
        res.render("academicYear/edit", {
          academicYear: mongoseToObject(academicYear),
          username,
          authen: "admin",

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
    const username = req.userName;

    try {
        const academicYears = await AcademicYear.find().sort({ startDate: 1 });
        const faculties = await Faculty.find();

        const chartData = [];

        // Fetch magazines for all academic years and faculties concurrently
        const magazinePromises = academicYears.map(async academicYear => {
            const magazines = await Magazine.find({ academicYear: academicYear._id });
            return { academicYear, magazines };
        });

        const results = await Promise.all(magazinePromises);

        for (const { academicYear, magazines } of results) {
            const aggregationPromises = faculties.map(async faculty => {
                const facultyMagazines = magazines.filter(magazine => magazine.faculty.equals(faculty._id));

                const aggregationPipeline = [
                    {
                        $match: {
                            magazine: { $in: facultyMagazines.map(magazine => magazine._id) }
                        }
                    },
                    {
                        $group: {
                            _id: "$student",
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalSubmissions: { $sum: "$count" },
                            uniqueStudents: { $sum: 1 }
                        }
                    }
                ];

                const result = await Submission.aggregate(aggregationPipeline);
                const totalSubmissions = result.length > 0 ? result[0].totalSubmissions : 0;
                const uniqueStudents = result.length > 0 ? result[0].uniqueStudents : 0;

                return {
                    academicYear: academicYear.name,
                    faculty: faculty.name,
                    totalSubmissions,
                    uniqueStudents
                };
            });

            const facultyData = await Promise.all(aggregationPromises);
            chartData.push(...facultyData);
        }

        res.render("chart", {
            chartData,
            authen: "admin",
            activePage: "chart",
            username,
        });
    } catch (error) {
        console.error("Error fetching chart data:", error);
        // Handle error
        res.status(500).send("Internal Server Error");
    }
}

}

module.exports = new AcademicYearController();
