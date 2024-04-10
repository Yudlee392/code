const express = require('express');
const router = express.Router();
const coordinatorController = require('../app/controllers/CoordinatorController');
router.get('/submission/view', coordinatorController.viewAllSubmissionWithFacultyId);
router.get('/submission/:id/edit', coordinatorController.editSubmissionForm);
router.post('/submission/:id/edit', coordinatorController.editSubmission);
router.get('/submission/filter', coordinatorController.filterSubmissions);


module.exports = router;    