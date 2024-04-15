const express = require('express');
const router = express.Router();
const academicYearController = require ('../app/controllers/AcademicYearController');

router.get('/academic/create', academicYearController.createForm);
router.post('/academic/create', academicYearController.create);
router.get('/academic/view', academicYearController.view);
router.post('/academic/:id/delete', academicYearController.delete);

router.get('/academic/:id/edit', academicYearController.edit);

router.post('/academic/:id/update', academicYearController.update);

router.get("/academic/chart", academicYearController.chart);

module.exports = router;
