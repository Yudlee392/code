const Course = require("../models/Course");
const { mutipleMongooseToObjects } = require("../../util/mongoose");
const session = require("express-session");
const Magazine = require("../models/Magazine");
const Faculty = require("../models/Faculty");
const Submission = require("../models/Submission");
const {
  upload,
  bucket,
  admin,
  getCachedViewLink,
} = require("../../config/firebase");

class SiteController {
  //[GET] /
  async index(req, res, next) {
    var ss = req.session;
    // req.session.role='khoa ko khon'
    // console.log(req.session)

    //  Course.find({},function(err,courses){
    //     if(!err) res.json(courses);
    //     else res.status(400).json({error: 'ERROR!!!'})
    //  })
    // res.render('home');
    const faculties = await Faculty.find({}); //sort by

    const magazines = await Magazine.find({});
    const submissions = await Submission.find({ status: "Approved" }).populate(
      "student"
    );

    const modifiedSubmissions = await Promise.all(
      submissions.map(async (submission) => {
        // Fetch cached view links asynchronously
        const viewImageLink = await getCachedViewLink(submission.imagePath);
        const viewDocLink = await getCachedViewLink(submission.documentPath);

        // Create a new object with modified properties
        return {
          ...submission.toObject(),
          viewImageLink,
          viewDocLink,
        };
      })
    );
    // console.log(modifiedSubmissions);
    res.render("home", {
      activePage: "home",
      magazines: mutipleMongooseToObjects(magazines),
      submissions: modifiedSubmissions,
      faculties: mutipleMongooseToObjects(faculties),
    });
  }
  //[GET] /search
  search(req, res) {
    var ss = req.body;
    req.session.username = "khoa ngu";
    console.log(req.session);
    res.render("search", { activePage: "search" });
  }

  //[post] /search
  searchpost(req, res) {
    res.send(req.body);
  }
}
module.exports = new SiteController();
